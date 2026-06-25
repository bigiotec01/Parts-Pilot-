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

// Obtiene tokens FCM de todos los admins
async function tokensAdmin() {
  const snap = await db.collection('fcmTokens').where('role', '==', 'admin').get();
  return snap.docs.map(d => d.data().token).filter(Boolean);
}

// Obtiene tokens FCM del taller (cuenta principal + sub-usuarios)
async function tokensTaller(tallerId) {
  const snap = await db.collection('fcmTokens').where('tallerId', '==', tallerId).get();
  return snap.docs.map(d => d.data().token).filter(Boolean);
}

// Envía notificación push a una lista de tokens
async function enviar(tokens, notification, data = {}) {
  if (!tokens.length) return;
  const stringData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)])
  );
  // FCM acepta máximo 500 tokens por batch
  for (let i = 0; i < tokens.length; i += 500) {
    const chunk = tokens.slice(i, i + 500);
    await admin.messaging().sendEachForMulticast({
      tokens: chunk,
      notification,
      data: stringData,
      android: { priority: 'high' },
      webpush: {
        notification: { icon: '/pwa-192x192.png', badge: '/pwa-64x64.png' },
        fcmOptions: { link: '/' },
      },
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

  // 1. Cambio de estado → taller
  if (before.estado !== after.estado) {
    const tokens = await tokensTaller(tallerId);
    await enviar(
      tokens,
      {
        title: `Pedido ${after.folio} actualizado`,
        body:  STATUS_LABELS[after.estado] || after.estado,
      },
      { pedidoId, tipo: 'cambio_estado', estado: after.estado }
    );
  }

  // 2. Nuevo mensaje
  const msgsBefore = before.mensajes || [];
  const msgsAfter  = after.mensajes  || [];
  if (msgsAfter.length > msgsBefore.length) {
    const nuevo = msgsAfter[msgsAfter.length - 1];
    const texto = nuevo.texto || (nuevo.attachment ? '📎 Archivo adjunto' : 'Mensaje nuevo');

    if (nuevo.from === 'admin') {
      // Admin escribió → avisar al taller
      const tokens = await tokensTaller(tallerId);
      await enviar(
        tokens,
        { title: `Mensaje en pedido ${after.folio}`, body: texto },
        { pedidoId, tipo: 'mensaje', from: 'admin' }
      );
    } else {
      // Taller escribió → avisar a admins
      const tokens = await tokensAdmin();
      await enviar(
        tokens,
        {
          title: `${after.tallerNombre || 'Taller'} — ${after.folio}`,
          body:  texto,
        },
        { pedidoId, tipo: 'mensaje', from: 'taller' }
      );
    }
  }

  // 3. Estimado nuevo enviado por admin → taller
  if (!before.estimado && after.estimado) {
    const tokens = await tokensTaller(tallerId);
    await enviar(
      tokens,
      {
        title: `Cotización disponible — ${after.folio}`,
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
        body:  `Pedido ${after.folio}`,
      },
      { pedidoId, tipo: 'respuesta_estimado', respuesta: rAfter }
    );
  }
});
