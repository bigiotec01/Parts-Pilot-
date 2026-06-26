'use strict';

const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const STATUS_LABELS = {
  pendiente:        'Pendiente de cotizar',
  cotizando:        'Cotización enviada',
  pedido_fabrica:   'Por ordenar',
  ordenadas:        'Piezas ordenadas',
  esperando_piezas: 'Esperando piezas',
  en_transito:      'En tránsito',
  recibido:         'Recibido en Tienda',
  entregado:        'Orden Completa',
};

// Obtiene tokens FCM de todos los admins (sin duplicados)
async function tokensAdmin() {
  const snap = await db.collection('fcmTokens').where('role', '==', 'admin').get();
  const tokens = snap.docs.map(d => d.data().token).filter(Boolean);
  return [...new Set(tokens)];
}

// Obtiene tokens FCM del taller (cuenta principal + sub-usuarios, sin duplicados)
async function tokensTaller(tallerId) {
  const snap = await db.collection('fcmTokens').where('tallerId', '==', tallerId).get();
  const tokens = snap.docs.map(d => d.data().token).filter(Boolean);
  return [...new Set(tokens)];
}

// Envía notificación push a una lista de tokens
async function enviar(tokens, notification, data = {}) {
  if (!tokens.length) return;
  const stringData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)])
  );
  for (let i = 0; i < tokens.length; i += 500) {
    const chunk = tokens.slice(i, i + 500);
    const res = await admin.messaging().sendEachForMulticast({
      tokens: chunk,
      notification,
      data: stringData,
      android: { priority: 'high' },
      webpush: {
        notification: { icon: '/pwa-192x192.png', badge: '/pwa-64x64.png' },
        fcmOptions: { link: '/' },
      },
    });
    res.responses.forEach((r, idx) => {
      if (r.success) {
        console.log(`[FCM] token[${idx}] enviado OK, messageId=${r.messageId}`);
      } else {
        console.error(`[FCM] token[${idx}] error: ${r.error?.code} — ${r.error?.message}`);
      }
    });
  }
}

// ── Nuevo pedido → notificar admins ────────────────────────────────
exports.onNuevoPedido = onDocumentCreated('pedidos/{pedidoId}', async (event) => {
  const pedido = event.data.data();
  const tokens = await tokensAdmin();
  await enviar(
    tokens,
    {
      title: `Nuevo pedido — ${pedido.tallerNombre || 'Taller'}`,
      body:  `${pedido.folio} · ${pedido.pieza || pedido.vehiculo || 'Solicitud nueva'}`,
    },
    { pedidoId: event.params.pedidoId, tipo: 'nuevo_pedido' }
  );
});

// ── Cambios en pedido → notificar según el evento ─────────────────
exports.onPedidoUpdate = onDocumentUpdated('pedidos/{pedidoId}', async (event) => {
  const before    = event.data.before.data();
  const after     = event.data.after.data();
  const pedidoId  = event.params.pedidoId;
  const tallerId  = after.tallerId;
  const ref       = after.numeroPO || after.folio; // PO si existe, folio como fallback

  console.log(`[onPedidoUpdate] pedidoId=${pedidoId} tallerId=${tallerId}`);
  console.log(`[onPedidoUpdate] estado: ${before.estado} → ${after.estado}`);
  const msgsBefore = before.mensajes || [];
  const msgsAfter  = after.mensajes  || [];
  console.log(`[onPedidoUpdate] mensajes: ${msgsBefore.length} → ${msgsAfter.length}`);

  // 1. Cambio de estado → taller
  if (before.estado !== after.estado) {
    const tokens = await tokensTaller(tallerId);
    await enviar(
      tokens,
      {
        title: `PO ${ref} actualizado`,
        body:  STATUS_LABELS[after.estado] || after.estado,
      },
      { pedidoId, tipo: 'cambio_estado', estado: after.estado }
    );
  }

  // 2. Nuevo mensaje
  if (msgsAfter.length > msgsBefore.length) {
    const nuevo = msgsAfter[msgsAfter.length - 1];
    const texto = nuevo.texto || (nuevo.attachment ? '📎 Archivo adjunto' : 'Mensaje nuevo');
    console.log(`[onPedidoUpdate] nuevo mensaje from="${nuevo.from}" texto="${texto}"`);

    if (nuevo.from === 'admin') {
      const tokens = await tokensTaller(tallerId);
      console.log(`[onPedidoUpdate] enviando a taller, tokens=${tokens.length}`);
      await enviar(
        tokens,
        { title: `Mensaje — PO ${ref}`, body: texto },
        { pedidoId, tipo: 'mensaje', remitente: 'admin' }
      );
    } else {
      const tokens = await tokensAdmin();
      console.log(`[onPedidoUpdate] enviando a admins, tokens=${tokens.length}`);
      await enviar(
        tokens,
        {
          title: `${after.tallerNombre || 'Taller'} — PO ${ref}`,
          body:  texto,
        },
        { pedidoId, tipo: 'mensaje', remitente: 'taller' }
      );
    }
  }

  // 3. Estimado nuevo enviado por admin → taller
  if (!before.estimado && after.estimado) {
    const tokens = await tokensTaller(tallerId);
    await enviar(
      tokens,
      {
        title: `Cotización disponible — PO ${ref}`,
        body:  'Tienes una cotización lista para revisar.',
      },
      { pedidoId, tipo: 'estimado_nuevo' }
    );
  }

  // 4. Taller responde estimado → admins
  const rBefore = before.estimado?.respuesta;
  const rAfter  = after.estimado?.respuesta;
  if (rBefore === 'pendiente' && rAfter && rAfter !== 'pendiente') {
    const tokens = await tokensAdmin();
    const verbo  = rAfter === 'aceptado' ? 'aceptó' : 'rechazó';
    await enviar(
      tokens,
      {
        title: `${after.tallerNombre || 'Taller'} ${verbo} la cotización`,
        body:  `PO ${ref}`,
      },
      { pedidoId, tipo: 'respuesta_estimado', respuesta: rAfter }
    );
  }
});
