'use strict';

const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onRequest, onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const crypto = require('crypto');

const TAGLOGIC_KEY = defineSecret('TAGLOGIC_KEY');

admin.initializeApp();
const db = admin.firestore();

// ── Multi-tenant: identidad y empresas ──────────────────────────────
// Toda creación de usuarios (Auth + doc de perfil) pasa por aquí, nunca por el cliente,
// para poder validar en el servidor a qué empresa (tenant) pertenece quien la solicita.

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

async function generarSlugUnico(nombre) {
  const base = slugify(nombre) || 'empresa';
  let slug = base;
  let i = 2;
  while ((await db.collection('empresas').doc(slug).get()).exists) {
    slug = `${base}-${i}`;
    i += 1;
  }
  return slug;
}

function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
  return request.auth.uid;
}

async function requireSuperAdmin(request) {
  const uid = requireAuth(request);
  const snap = await db.collection('superadmins').doc(uid).get();
  if (!snap.exists) throw new HttpsError('permission-denied', 'Solo el Super Admin puede hacer esto.');
  return uid;
}

// Devuelve el doc admins/{uid} del llamante, validando que exista.
async function requireCallerAdmin(request) {
  const uid = requireAuth(request);
  const snap = await db.collection('admins').doc(uid).get();
  if (!snap.exists) throw new HttpsError('permission-denied', 'No tienes un perfil de administrador.');
  return { uid, ...snap.data() };
}

function assertPuedeGestionarEquipo(caller) {
  if (caller.rol === 'admin' || caller.permisos?.equipo === true) return;
  throw new HttpsError('permission-denied', 'No tienes permiso para gestionar el equipo.');
}

function assertPuedeGestionarTalleres(caller) {
  if (caller.rol === 'admin' || caller.permisos?.talleres === 'edit') return;
  throw new HttpsError('permission-denied', 'No tienes permiso para gestionar talleres.');
}

function validarEmailPassword(email, password) {
  if (!email || !String(email).includes('@')) throw new HttpsError('invalid-argument', 'Email inválido.');
  if (!password || String(password).length < 6) throw new HttpsError('invalid-argument', 'La contraseña debe tener al menos 6 caracteres.');
}

// Crea una empresa (tenant) nueva con su administrador principal. Solo el Super Admin.
exports.crearEmpresa = onCall(async (request) => {
  await requireSuperAdmin(request);
  const { nombreEmpresa, nombreAdmin, email, password } = request.data || {};
  if (!nombreEmpresa) throw new HttpsError('invalid-argument', 'Falta el nombre de la empresa.');
  if (!nombreAdmin) throw new HttpsError('invalid-argument', 'Falta el nombre del administrador.');
  validarEmailPassword(email, password);

  const tenantId = await generarSlugUnico(nombreEmpresa);
  // Clave propia para integraciones externas (Tag Logic), aislada por empresa.
  const tagLogicApiKey = crypto.randomBytes(24).toString('hex');

  const userRecord = await admin.auth().createUser({ email, password, displayName: nombreAdmin });
  try {
    await db.collection('empresas').doc(tenantId).create({
      nombre: nombreEmpresa,
      slug: tenantId,
      estado: 'activa',
      adminPrincipalUid: userRecord.uid,
      tagLogicApiKey,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await db.collection('admins').doc(userRecord.uid).set({
      nombre: nombreAdmin, email, tenantId, rol: 'admin', tallerIds: null,
    });
  } catch (e) {
    await admin.auth().deleteUser(userRecord.uid).catch(() => {});
    throw e;
  }

  return { tenantId, uid: userRecord.uid, tagLogicApiKey };
});

// Activa o suspende una empresa. Solo el Super Admin.
exports.actualizarEstadoEmpresa = onCall(async (request) => {
  await requireSuperAdmin(request);
  const { tenantId, estado } = request.data || {};
  if (!tenantId || !['activa', 'suspendida'].includes(estado)) {
    throw new HttpsError('invalid-argument', 'Faltan datos válidos (tenantId, estado).');
  }
  await db.collection('empresas').doc(tenantId).update({ estado });
  return { ok: true };
});

// Borra PERMANENTEMENTE una empresa: cuentas de Auth y todos sus documentos
// (admins, talleres, tallerUsuarios, pedidos, facturas, facturaBackups, fcmTokens).
// Irreversible. Exige que el llamante escriba el tenantId exacto como confirmación.
// Solo el Super Admin, y nunca sobre Mana Auto.
exports.eliminarEmpresaPermanente = onCall(async (request) => {
  await requireSuperAdmin(request);
  const { tenantId, confirmar } = request.data || {};
  if (!tenantId) throw new HttpsError('invalid-argument', 'Falta tenantId.');
  if (tenantId === 'mana-auto') throw new HttpsError('permission-denied', 'Mana Auto no se puede eliminar desde aquí.');
  if (confirmar !== tenantId) {
    throw new HttpsError('invalid-argument', 'Debes escribir el id exacto de la empresa para confirmar.');
  }

  const [adminsSnap, talleresSnap, tallerUsuariosSnap, pedidosSnap, facturasSnap, backupsSnap, fcmSnap] =
    await Promise.all([
      db.collection('admins').where('tenantId', '==', tenantId).get(),
      db.collection('talleres').where('tenantId', '==', tenantId).get(),
      db.collection('tallerUsuarios').where('tenantId', '==', tenantId).get(),
      db.collection('pedidos').where('tenantId', '==', tenantId).get(),
      db.collection('facturas').where('tenantId', '==', tenantId).get(),
      db.collection('facturaBackups').where('tenantId', '==', tenantId).get(),
      db.collection('fcmTokens').where('tenantId', '==', tenantId).get(),
    ]);

  // Cuentas de Auth: admins + tallerUsuarios (siempre tienen cuenta) + talleres con cuenta real
  // (los talleres sin acceso al portal tienen un uid sintético "taller_...", sin usuario Auth).
  const uids = [
    ...adminsSnap.docs.map(d => d.id),
    ...talleresSnap.docs.filter(d => !d.id.startsWith('taller_')).map(d => d.id),
    ...tallerUsuariosSnap.docs.map(d => d.id),
  ];
  await Promise.all(uids.map((uid) => admin.auth().deleteUser(uid).catch(() => {})));

  // Subcolección items de cada backup, antes que el doc padre.
  for (const backupDoc of backupsSnap.docs) {
    const itemsSnap = await db.collection('facturaBackups').doc(backupDoc.id).collection('items').get();
    for (const grupo of chunkArr(itemsSnap.docs, 400)) {
      const batch = db.batch();
      grupo.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  const allDocs = [
    ...adminsSnap.docs, ...talleresSnap.docs, ...tallerUsuariosSnap.docs,
    ...pedidosSnap.docs, ...facturasSnap.docs, ...backupsSnap.docs, ...fcmSnap.docs,
  ];
  for (const grupo of chunkArr(allDocs, 400)) {
    const batch = db.batch();
    grupo.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  await db.doc(`empresas/${tenantId}/counters/pedidos`).delete().catch(() => {});
  await db.collection('empresas').doc(tenantId).delete();

  return { ok: true, documentosEliminados: allDocs.length, cuentasAuthEliminadas: uids.length };
});

// Crea un miembro del equipo dentro de la misma empresa del llamante.
exports.crearMiembroEquipo = onCall(async (request) => {
  const caller = await requireCallerAdmin(request);
  assertPuedeGestionarEquipo(caller);
  const { nombre, email, password, permisos, tallerIds } = request.data || {};
  if (!nombre) throw new HttpsError('invalid-argument', 'Falta el nombre.');
  validarEmailPassword(email, password);

  const userRecord = await admin.auth().createUser({ email, password, displayName: nombre });
  try {
    await db.collection('admins').doc(userRecord.uid).set({
      nombre, email, tenantId: caller.tenantId, rol: 'miembro',
      permisos: permisos || {}, tallerIds: Array.isArray(tallerIds) ? tallerIds : null,
    });
  } catch (e) {
    await admin.auth().deleteUser(userRecord.uid).catch(() => {});
    throw e;
  }
  return { uid: userRecord.uid, tenantId: caller.tenantId };
});

// Crea un taller (cliente) dentro de la empresa del llamante.
exports.crearTallerCF = onCall(async (request) => {
  const caller = await requireCallerAdmin(request);
  assertPuedeGestionarTalleres(caller);
  const { nombre, contacto, telefono, email, usuario, password } = request.data || {};
  if (!nombre) throw new HttpsError('invalid-argument', 'Falta el nombre del taller.');

  let uid;
  if (email && password) {
    validarEmailPassword(email, password);
    const userRecord = await admin.auth().createUser({ email, password, displayName: nombre });
    uid = userRecord.uid;
  } else {
    uid = `taller_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  await db.collection('talleres').doc(uid).set({
    nombre, contacto: contacto || '', telefono: telefono || '',
    email: email || '', usuario: usuario || '', tenantId: caller.tenantId,
  });
  return { uid, tenantId: caller.tenantId };
});

// Crea un sub-usuario de un taller que ya pertenece a la empresa del llamante.
exports.crearTallerUsuarioCF = onCall(async (request) => {
  const caller = await requireCallerAdmin(request);
  assertPuedeGestionarTalleres(caller);
  const { tallerId, nombre, email, password } = request.data || {};
  if (!tallerId || !nombre) throw new HttpsError('invalid-argument', 'Faltan datos (tallerId, nombre).');
  validarEmailPassword(email, password);

  const tallerSnap = await db.collection('talleres').doc(tallerId).get();
  if (!tallerSnap.exists || tallerSnap.data().tenantId !== caller.tenantId) {
    throw new HttpsError('permission-denied', 'Ese taller no pertenece a tu empresa.');
  }

  const userRecord = await admin.auth().createUser({ email, password, displayName: nombre });
  try {
    await db.collection('tallerUsuarios').doc(userRecord.uid).set({
      tallerId, nombre, email, tenantId: caller.tenantId,
    });
  } catch (e) {
    await admin.auth().deleteUser(userRecord.uid).catch(() => {});
    throw e;
  }
  return { uid: userRecord.uid };
});

// ── Migración única: Mana Auto pasa a ser el primer tenant ──────────
// Callable en vez de script local porque este entorno no tiene credenciales
// de service account para firebase-admin fuera de Cloud Functions.
// Modo dryRun (por defecto): solo cuenta cuántos documentos tocaría, sin escribir nada.
// Con { dryRun: false } ejecuta el backfill real, una sola vez (falla si ya se corrió).
const TENANT_ID_MANA_AUTO = 'mana-auto';
const MIGRATION_ADMIN_EMAIL = 'bigio_tec@me.com';

function chunkArr(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

exports.migrarManaAuto = onCall(async (request) => {
  const uid = requireAuth(request);

  const yaExiste = await db.collection('empresas').doc(TENANT_ID_MANA_AUTO).get();
  if (yaExiste.exists) {
    throw new HttpsError('failed-precondition', 'La migración a Mana Auto ya se ejecutó antes.');
  }

  const callerSnap = await db.collection('admins').doc(uid).get();
  if (!callerSnap.exists) {
    throw new HttpsError('permission-denied', 'Solo la cuenta admin original de Mana Auto puede ejecutar esto.');
  }
  if ((request.auth.token.email || '').toLowerCase() !== MIGRATION_ADMIN_EMAIL.toLowerCase()) {
    throw new HttpsError('permission-denied', 'Solo la cuenta original de Mana Auto puede ejecutar esta migración.');
  }

  const [adminsSnap, talleresSnap, tallerUsuariosSnap, pedidosSnap, facturasSnap, backupsSnap, fcmSnap, countersSnap] =
    await Promise.all([
      db.collection('admins').get(),
      db.collection('talleres').get(),
      db.collection('tallerUsuarios').get(),
      db.collection('pedidos').get(),
      db.collection('facturas').get(),
      db.collection('facturaBackups').get(),
      db.collection('fcmTokens').get(),
      db.doc('config/counters').get(),
    ]);

  const reporte = {
    admins: adminsSnap.size,
    talleres: talleresSnap.size,
    tallerUsuarios: tallerUsuariosSnap.size,
    pedidos: pedidosSnap.size,
    facturas: facturasSnap.size,
    facturaBackups: backupsSnap.size,
    fcmTokens: fcmSnap.size,
    counterPedidosActual: countersSnap.exists ? (countersSnap.data().pedidos || 0) : 0,
  };

  const dryRun = request.data?.dryRun !== false;
  if (dryRun) return { dryRun: true, reporte };

  const ops = [];
  ops.push({ ref: db.collection('empresas').doc(TENANT_ID_MANA_AUTO), data: {
    nombre: 'Mana Auto', slug: TENANT_ID_MANA_AUTO, estado: 'activa',
    adminPrincipalUid: uid, createdAt: admin.firestore.FieldValue.serverTimestamp(),
  } });
  ops.push({ ref: db.collection('superadmins').doc(uid), data: {
    nombre: callerSnap.data().nombre || '', email: MIGRATION_ADMIN_EMAIL,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  } });

  adminsSnap.docs.forEach((d) => {
    const data = d.data();
    const esDuenoLegado = !('permisos' in data);
    ops.push({ ref: d.ref, data: {
      tenantId: TENANT_ID_MANA_AUTO,
      rol: esDuenoLegado ? 'admin' : 'miembro',
      tallerIds: esDuenoLegado ? null : (data.tallerIds ?? null),
    } });
  });
  talleresSnap.docs.forEach((d) => ops.push({ ref: d.ref, data: { tenantId: TENANT_ID_MANA_AUTO } }));
  tallerUsuariosSnap.docs.forEach((d) => ops.push({ ref: d.ref, data: { tenantId: TENANT_ID_MANA_AUTO } }));
  pedidosSnap.docs.forEach((d) => ops.push({ ref: d.ref, data: { tenantId: TENANT_ID_MANA_AUTO } }));
  facturasSnap.docs.forEach((d) => ops.push({ ref: d.ref, data: { tenantId: TENANT_ID_MANA_AUTO } }));
  backupsSnap.docs.forEach((d) => ops.push({ ref: d.ref, data: { tenantId: TENANT_ID_MANA_AUTO } }));
  fcmSnap.docs.forEach((d) => ops.push({ ref: d.ref, data: { tenantId: TENANT_ID_MANA_AUTO } }));

  ops.push({ ref: db.doc(`empresas/${TENANT_ID_MANA_AUTO}/counters/pedidos`), data: {
    pedidos: reporte.counterPedidosActual,
  } });

  for (const grupo of chunkArr(ops, 400)) {
    const batch = db.batch();
    grupo.forEach(({ ref, data }) => batch.set(ref, data, { merge: true }));
    await batch.commit();
  }

  return { dryRun: false, reporte, ok: true };
});

// ── Diagnóstico temporal: por qué un taller no ve sus pedidos/facturas ──
// Solo lectura, restringido al Super Admin de plataforma. Busca el taller por nombre
// (o por uid si se pasa tallerId) y reporta el estado real de tenantId/tallerId en
// sus documentos relacionados, para detectar desalineaciones sin acceso directo a la DB.
exports.diagnosticoTaller = onCall(async (request) => {
  await requireSuperAdmin(request);
  const { nombreTaller, tallerId } = request.data || {};
  if (!nombreTaller && !tallerId) {
    throw new HttpsError('invalid-argument', 'Falta nombreTaller o tallerId.');
  }

  let talleresSnap;
  if (tallerId) {
    const d = await db.collection('talleres').doc(tallerId).get();
    talleresSnap = { docs: d.exists ? [d] : [] };
  } else {
    talleresSnap = await db.collection('talleres')
      .where('nombre', '==', nombreTaller).get();
  }

  const resultados = [];
  for (const tDoc of talleresSnap.docs) {
    const tallerData = tDoc.data();
    const uid = tDoc.id;

    const [pedidosSnap, facturasSnap, subUsuariosSnap] = await Promise.all([
      db.collection('pedidos').where('tallerId', '==', uid).get(),
      db.collection('facturas').where('tallerId', '==', uid).get(),
      db.collection('tallerUsuarios').where('tallerId', '==', uid).get(),
    ]);

    let empresaEstado = null;
    if (tallerData.tenantId) {
      const eSnap = await db.collection('empresas').doc(tallerData.tenantId).get();
      empresaEstado = eSnap.exists ? eSnap.data().estado : `NO EXISTE empresas/${tallerData.tenantId}`;
    }

    resultados.push({
      taller: { uid, nombre: tallerData.nombre, tenantId: tallerData.tenantId ?? '(sin campo tenantId)' },
      empresaEstado,
      pedidos: {
        total: pedidosSnap.size,
        tenantIdsDistintos: [...new Set(pedidosSnap.docs.map(d => d.data().tenantId ?? '(sin tenantId)'))],
      },
      facturas: {
        total: facturasSnap.size,
        tenantIdsDistintos: [...new Set(facturasSnap.docs.map(d => d.data().tenantId ?? '(sin tenantId)'))],
      },
      subUsuarios: subUsuariosSnap.docs.map(d => ({
        uid: d.id, tenantId: d.data().tenantId ?? '(sin tenantId)', tallerId: d.data().tallerId,
      })),
    });
  }

  return { encontrados: resultados.length, resultados };
});

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

const topicAdmins = (tenantId) => `pp_admins_${(tenantId || TENANT_ID_MANA_AUTO).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
const topicTaller  = (id) => `pp_taller_${id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

// Devuelve 1 token por uid (el más reciente según updatedAt) — evita duplicados en mismo dispositivo
function tokensPorUid(snap) {
  const byUid = {};
  snap.docs.forEach(d => {
    const data = d.data();
    const uid = data.uid || d.id;
    const ts = data.updatedAt?.toMillis?.() ?? 0;
    if (!byUid[uid] || ts > byUid[uid].ts) byUid[uid] = { token: data.token, ts };
  });
  return Object.values(byUid).map(e => e.token).filter(Boolean);
}

// Suscribe los tokens de admins DE ESTA EMPRESA al topic y retorna el topic.
// Sin where('role', '==', 'admin') combinado (evitaría un índice compuesto): se filtra en memoria.
async function suscribirAdmins(tenantId) {
  const topic = topicAdmins(tenantId);
  const snap = await db.collection('fcmTokens').where('tenantId', '==', tenantId || TENANT_ID_MANA_AUTO).get();
  const soloAdmins = { docs: snap.docs.filter(d => d.data().role === 'admin') };
  const tokens = tokensPorUid(soloAdmins);
  if (tokens.length) await admin.messaging().subscribeToTopic(tokens, topic);
  console.log(`[Topic] ${tokens.length} tokens admin (${tenantId}) → ${topic}`);
  return topic;
}

// Suscribe todos los tokens del taller al topic y retorna el topic
async function suscribirTaller(tallerId) {
  const topic = topicTaller(tallerId);
  const snap  = await db.collection('fcmTokens').where('tallerId', '==', tallerId).get();
  const tokens = tokensPorUid(snap);
  if (tokens.length) await admin.messaging().subscribeToTopic(tokens, topic);
  console.log(`[Topic] ${tokens.length} tokens taller → ${topic}`);
  return topic;
}

// Envía a un topic como mensaje data-only (sin campo notification).
// Esto evita que iOS muestre la notificación dos veces:
// una desde el payload APNs y otra desde el handler onBackgroundMessage del SW.
async function enviar(topic, notification, data = {}) {
  const stringData = Object.fromEntries(
    Object.entries({ ...data, title: notification.title || '', body: notification.body || '' })
      .map(([k, v]) => [k, String(v)])
  );
  const msgId = await admin.messaging().send({
    topic,
    data: stringData,
    android: {
      priority: 'high',
      notification: {
        // Solo para Android nativo: muestra la notificación en el system tray
        title: notification.title,
        body:  notification.body,
        icon:  'ic_notification',
      },
    },
    apns: {
      payload: { aps: { 'content-available': 1 } },
    },
    webpush: {
      fcmOptions: { link: '/' },
    },
  });
  console.log(`[FCM] topic=${topic} OK, messageId=${msgId}`);
}

// Garantiza que una notificación se envíe exactamente una vez aunque la función se ejecute doble.
// key debe ser única por evento lógico (ej: "{pedidoId}_msg_5").
async function enviarOnce(key, topic, notification, data = {}) {
  const ref = db.collection('notifSent').doc(key);
  try {
    await ref.create({ ts: admin.firestore.FieldValue.serverTimestamp() });
  } catch (e) {
    if (e.code === 6 || e.code === 'already-exists') {
      console.log(`[notifSent] duplicado ignorado key=${key}`);
      return;
    }
    throw e;
  }
  await enviar(topic, notification, data);
}

// ── Nuevo pedido → notificar admins ────────────────────────────────
exports.onNuevoPedido = onDocumentCreated('pedidos/{pedidoId}', async (event) => {
  const pedido    = event.data.data();
  const pedidoId  = event.params.pedidoId;
  const topic = await suscribirAdmins(pedido.tenantId);
  await enviarOnce(
    `${pedidoId}_nuevo`,
    topic,
    {
      title: `Nuevo pedido — ${pedido.tallerNombre || 'Taller'}`,
      body:  `${pedido.folio} · ${pedido.pieza || pedido.vehiculo || 'Solicitud nueva'}`,
    },
    { pedidoId, tipo: 'nuevo_pedido' }
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
    await enviarOnce(
      `${pedidoId}_estado_${after.estado}`,
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
      await enviarOnce(
        `${pedidoId}_msg_${msgsAfter.length}`,
        topic,
        { title: `Mensaje — PO ${ref}`, body: texto },
        { pedidoId, tipo: 'mensaje', remitente: 'admin' }
      );
    } else {
      const topicAdm = await suscribirAdmins(after.tenantId);
      await enviarOnce(
        `${pedidoId}_msg_${msgsAfter.length}`,
        topicAdm,
        { title: `${after.tallerNombre || 'Taller'} — PO ${ref}`, body: texto },
        { pedidoId, tipo: 'mensaje', remitente: 'taller' }
      );
    }
  }

  // 3. Estimado nuevo → taller
  if (!before.estimado && after.estimado) {
    const topic = await suscribirTaller(tallerId);
    await enviarOnce(
      `${pedidoId}_estimado_nuevo`,
      topic,
      { title: `Cotización disponible — PO ${ref}`, body: 'Tienes una cotización lista para revisar.' },
      { pedidoId, tipo: 'estimado_nuevo' }
    );
  }

  // 4. Taller responde estimado → admins
  const rBefore = before.estimado?.respuesta;
  const rAfter  = after.estimado?.respuesta;
  if (rBefore === 'pendiente' && rAfter && rAfter !== 'pendiente') {
    const topicAdm = await suscribirAdmins(after.tenantId);
    const verbo = rAfter === 'aceptado' ? 'aceptó' : 'rechazó';
    await enviarOnce(
      `${pedidoId}_respuesta_${rAfter}`,
      topicAdm,
      { title: `${after.tallerNombre || 'Taller'} ${verbo} la cotización`, body: `PO ${ref}` },
      { pedidoId, tipo: 'respuesta_estimado', respuesta: rAfter }
    );
  }
});

// ── Autenticación de Tag Logic por empresa ───────────────────────────
// Acepta la clave global legada (TAGLOGIC_KEY, hoy usada por Mana Auto — no se rota
// para no romper su integración ya configurada) O una clave propia por empresa
// (empresas/{tenantId}.tagLogicApiKey), generada automáticamente al crear cada empresa nueva.
// Devuelve el tenantId dueño de la clave, o null si no es válida.
async function validarTagLogicKey(providedKey) {
  if (!providedKey) return null;
  if (providedKey === TAGLOGIC_KEY.value()) return TENANT_ID_MANA_AUTO;
  const snap = await db.collection('empresas').where('tagLogicApiKey', '==', providedKey).limit(1).get();
  return snap.empty ? null : snap.docs[0].id;
}

// ── Ingesta de pedidos externos (Tag Logic) ─────────────────────────
// Recibe una orden de piezas desde Tag Logic y la guarda como solicitud.
exports.ingestTagLogic = onRequest({ secrets: [TAGLOGIC_KEY] }, async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'usa POST' });
    const tenantIdDeLaKey = await validarTagLogicKey(req.get('x-api-key'));
    if (!tenantIdDeLaKey) return res.status(401).json({ error: 'no autorizado' });

    const b = req.body || {};
    if (!b.ref || !b.taller?.id) return res.status(400).json({ error: 'faltan ref o taller.id' });

    const id  = `taglogic_${b.ref}`;
    const ref = db.collection('pedidos').doc(id);
    const archivos = (b.fotos || []).map(f => ({ name: f.name || 'foto', type: 'image/jpeg', url: f.url }));

    // El pedido hereda el tenantId del taller destino, para que sea visible bajo las reglas multi-tenant.
    const tallerSnap = await db.collection('talleres').doc(b.taller.id).get();
    const tenantId = tallerSnap.exists ? (tallerSnap.data().tenantId || null) : null;
    // La clave usada debe pertenecer a la MISMA empresa que el taller destino —
    // evita que la clave de una empresa cree pedidos a nombre de talleres de otra.
    if (tenantId !== tenantIdDeLaKey) {
      return res.status(403).json({ error: 'el taller no pertenece a la empresa de esta clave' });
    }

    const folio = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists) {
        // Reenvío (suplemento): refresca lo visible, respeta folio/estado/estimado/chat.
        tx.set(ref, {
          vehiculo: b.vehiculo || '', pieza: b.pieza || '', notas: b.notas || '', archivos,
          tag: b.tag || null, piezas: b.piezas || [],
          vehiculoDetalle: b.vehiculoDetalle || null, reclamacion: b.reclamacion || null,
          enlaceTagLogic: b.enlaceTagLogic || '',
        }, { merge: true });
        return snap.data().folio;
      }
      // Primer insert: folio PP-XXXX, contador propio de la empresa del taller.
      const counterRef = db.doc(`empresas/${tenantId}/counters/pedidos`);
      const cs = await tx.get(counterRef);
      const next = ((cs.exists ? cs.data().pedidos : 0) || 0) + 1;
      const nuevoFolio = `PP-${String(next).padStart(4, '0')}`;
      tx.set(counterRef, { pedidos: next }, { merge: true });
      tx.set(ref, {
        origen: 'taglogic', ref: b.ref, tag: b.tag || null,
        tipo: 'solicitud',
        tallerId: b.taller.id, tallerNombre: b.taller.nombre || '', tenantId,
        vehiculo: b.vehiculo || '', pieza: b.pieza || '', notas: b.notas || '',
        archivos, estado: 'pendiente', estimado: null, mensajes: [],
        fecha: admin.firestore.FieldValue.serverTimestamp(),
        folio: nuevoFolio,
        piezas: b.piezas || [], vehiculoDetalle: b.vehiculoDetalle || null,
        reclamacion: b.reclamacion || null, enlaceTagLogic: b.enlaceTagLogic || '',
      });
      return nuevoFolio;
    });

    return res.json({ ok: true, folio, id });
  } catch (e) {
    console.error('ingestTagLogic', e);
    return res.status(500).json({ error: e.message });
  }
});

// ── Estado de un pedido para Tag Logic ──────────────────────────────
// Devuelve estado + cotización + adjuntos de un pedido de Tag Logic.
exports.pedidoEstado = onRequest({ secrets: [TAGLOGIC_KEY] }, async (req, res) => {
  const tenantIdDeLaKey = await validarTagLogicKey(req.get('x-api-key'));
  if (!tenantIdDeLaKey) return res.status(401).json({ error: 'no autorizado' });
  const ref = req.query.ref || (req.body && req.body.ref);
  if (!ref) return res.status(400).json({ error: 'falta ref' });

  const snap = await db.collection('pedidos').doc(`taglogic_${ref}`).get();
  if (!snap.exists) return res.json({ found: false });

  const p = snap.data();
  if (p.tenantId !== tenantIdDeLaKey) return res.status(403).json({ error: 'no autorizado para este pedido' });
  const est = p.estimado || null;
  return res.json({
    found: true,
    folio: p.folio || null,
    estado: p.estado || null,
    numeroPO: p.numeroPO || null,
    estimado: est ? {
      notas: est.notas || '', fecha: est.fecha || '', respuesta: est.respuesta || '',
      archivos: (est.archivos || []).map(a => ({ name: a.name || 'documento', url: a.url })),
    } : null,
    mensajes: (p.mensajes || []).map(m => ({
      from: m.from, texto: m.texto || '', hora: m.hora || '',
      attachment: m.attachment ? { name: m.attachment.name, url: m.attachment.url } : null,
    })),
  });
});
