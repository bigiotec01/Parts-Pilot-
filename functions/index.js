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

const TOPIC_ADMINS = 'pp_admins_v1';
const topicTaller  = (id) => `pp_taller_${id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

// Suscribe todos los tokens de admins al topic y retorna la cantidad
async function suscribirAdmins() {
  const snap = await db.collection('fcmTokens').where('role', '==', 'admin').get();
  const tokens = [...new Set(snap.docs.map(d => d.data().token).filter(Boolean))];
  if (tokens.length) await admin.messaging().subscribeToTopic(tokens, TOPIC_ADMINS);
  console.log(`[Topic] ${tokens.length} tokens admin → ${TOPIC_ADMINS}`);
  return tokens.length;
}

// Suscribe todos los tokens del taller al topic y retorna el topic
async function suscribirTaller(tallerId) {
  const topic = topicTaller(tallerId);
  const snap  = await db.collection('fcmTokens').where('tallerId', '==', tallerId).get();
  const tokens = [...new Set(snap.docs.map(d => d.data().token).filter(Boolean))];
  if (tokens.length) await admin.messaging().subscribeToTopic(tokens, topic);
  console.log(`[Topic] ${tokens.length} tokens taller → ${topic}`);
  return topic;
}

// Envía a un topic — FCM garantiza 1 entrega por dispositivo aunque tenga varios tokens
async function enviar(topic, notification, data = {}) {
  const stringData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)])
  );
  const msgId = await admin.messaging().send({
    topic,
    notification,
    data: stringData,
    android: { priority: 'high' },
    webpush: {
      notification: {
        icon:     '/pwa-192x192.png',
        badge:    '/pwa-64x64.png',
        tag:      data.pedidoId || 'pp-notif',
        renotify: false,
      },
      fcmOptions: { link: '/' },
    },
  });
  console.log(`[FCM] topic=${topic} OK, messageId=${msgId}`);
}

// ── Nuevo pedido → notificar admins ────────────────────────────────
exports.onNuevoPedido = onDocumentCreated('pedidos/{pedidoId}', async (event) => {
  const pedido = event.data.data();
  await suscribirAdmins();
  await enviar(
    TOPIC_ADMINS,
    {
      title: `Nuevo pedido — ${pedido.tallerNombre || 'Taller'}`,
      body:  `${pedido.folio} · ${pedido.pieza || pedido.vehiculo || 'Solicitud nueva'}`,
    },
    { pedidoId: event.params.pedidoId, tipo: 'nuevo_pedido' }
  );
});

// ── Cambios en pedido ───────────────────────────────────────────────
exports.onPedidoUpdate = onDocumentUpdated('pedidos/{pedidoId}', async (event) => {
  const before   = event.data.before.data();
  const after    = event.data.after.data();
  const pedidoId = event.params.pedidoId;
  const tallerId = after.tallerId;
  const ref      = after.numeroPO || after.folio;

  console.log(`[onPedidoUpdate] pedidoId=${pedidoId} tallerId=${tallerId}`);
  const msgsBefore = before.mensajes || [];
  const msgsAfter  = after.mensajes  || [];
  console.log(`[onPedidoUpdate] estado: ${before.estado}→${after.estado} msgs: ${msgsBefore.length}→${msgsAfter.length}`);

  // 1. Cambio de estado → taller
  if (before.estado !== after.estado) {
    const topic = await suscribirTaller(tallerId);
    await enviar(
      topic,
      { title: `PO ${ref} actualizado`, body: STATUS_LABELS[after.estado] || after.estado },
      { pedidoId, tipo: 'cambio_estado', estado: after.estado }
    );
  }

  // 2. Nuevo mensaje
  if (msgsAfter.length > msgsBefore.length) {
    const nuevo = msgsAfter[msgsAfter.length - 1];
    const texto = nuevo.texto || (nuevo.attachment ? '📎 Archivo adjunto' : 'Mensaje nuevo');
    console.log(`[onPedidoUpdate] mensaje from="${nuevo.from}" texto="${texto}"`);

    if (nuevo.from === 'admin') {
      const topic = await suscribirTaller(tallerId);
      await enviar(
        topic,
        { title: `Mensaje — PO ${ref}`, body: texto },
        { pedidoId, tipo: 'mensaje', remitente: 'admin' }
      );
    } else {
      await suscribirAdmins();
      await enviar(
        TOPIC_ADMINS,
        { title: `${after.tallerNombre || 'Taller'} — PO ${ref}`, body: texto },
        { pedidoId, tipo: 'mensaje', remitente: 'taller' }
      );
    }
  }

  // 3. Estimado nuevo → taller
  if (!before.estimado && after.estimado) {
    const topic = await suscribirTaller(tallerId);
    await enviar(
      topic,
      { title: `Cotización disponible — PO ${ref}`, body: 'Tienes una cotización lista para revisar.' },
      { pedidoId, tipo: 'estimado_nuevo' }
    );
  }

  // 4. Taller responde estimado → admins
  const rBefore = before.estimado?.respuesta;
  const rAfter  = after.estimado?.respuesta;
  if (rBefore === 'pendiente' && rAfter && rAfter !== 'pendiente') {
    await suscribirAdmins();
    const verbo = rAfter === 'aceptado' ? 'aceptó' : 'rechazó';
    await enviar(
      TOPIC_ADMINS,
      { title: `${after.tallerNombre || 'Taller'} ${verbo} la cotización`, body: `PO ${ref}` },
      { pedidoId, tipo: 'respuesta_estimado', respuesta: rAfter }
    );
  }
});
