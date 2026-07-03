import { useState, useEffect } from 'react';
import { db, storage } from './firebase';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, where, orderBy, serverTimestamp, arrayUnion, runTransaction, Timestamp,
  getDocs, writeBatch, getDoc, limit,
} from 'firebase/firestore';
import {
  ref, uploadBytes, getDownloadURL
} from 'firebase/storage';
import {
  createUserWithEmailAndPassword, getAuth
} from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { auth, firebaseConfig } from './firebase';
import { setDoc } from 'firebase/firestore';

// ── Pedidos en tiempo real ──────────────────────────────────────────
export function usePedidos(user) {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    if (!user) return;
    let q;
    if (user.role === 'admin') {
      q = query(collection(db, 'pedidos'), orderBy('fecha', 'desc'));
    } else {
      // Para sub-usuarios de taller, usar tallerId (puede diferir del uid)
      q = query(collection(db, 'pedidos'), where('tallerId', '==', user.tallerId || user.uid));
    }
    const unsub = onSnapshot(
      q,
      (snap) => setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error('usePedidos error:', err.code)
    );
    return unsub;
  }, [user]);

  return pedidos;
}

// ── Talleres en tiempo real ─────────────────────────────────────────
export function useTalleres(user) {
  const [talleres, setTalleres] = useState([]);
  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') {
      // El cliente solo puede leer su propio documento de taller
      // Para sub-usuarios, usar tallerId (puede diferir del uid)
      const unsub = onSnapshot(
        doc(db, 'talleres', user.tallerId || user.uid),
        (snap) => {
          if (snap.exists()) setTalleres([{ uid: snap.id, ...snap.data() }]);
        },
        (err) => console.error('useTalleres error:', err.code)
      );
      return unsub;
    }
    const unsub = onSnapshot(
      collection(db, 'talleres'),
      (snap) => setTalleres(snap.docs.map(d => ({ uid: d.id, ...d.data() }))),
      (err) => console.error('useTalleres error:', err.code)
    );
    return unsub;
  }, [user]);
  return talleres;
}

// ── Auditoría en tiempo real (solo superadmin) ───────────────────────
export function useAuditLogs(enabled) {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    if (!enabled) { setLogs([]); return; }
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(300));
    const unsub = onSnapshot(
      q,
      (snap) => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error('useAuditLogs error:', err.code)
    );
    return unsub;
  }, [enabled]);
  return logs;
}

// ── Crear pedido ────────────────────────────────────────────────────
export async function crearPedido(data) {
  const { archivo, fechaPersonalizada, ...rest } = data;
  const countersRef = doc(db, 'config', 'counters');
  const pedidoRef = doc(collection(db, 'pedidos'));

  const fechaValue = fechaPersonalizada
    ? Timestamp.fromDate(new Date(fechaPersonalizada + 'T12:00:00'))
    : serverTimestamp();

  let folio;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(countersRef);
    const next = (snap.exists() ? (snap.data().pedidos || 0) : 0) + 1;
    folio = `PP-${String(next).padStart(4, '0')}`;
    tx.set(pedidoRef, {
      ...rest,
      folio,
      fecha: fechaValue,
      estado: 'pendiente',
      estimado: null,
      mensajes: [],
      archivo: null,
    });
    tx.set(countersRef, { pedidos: next }, { merge: true });
  });

  if (archivo?.file) {
    const storageRef = ref(storage, `solicitudes/${pedidoRef.id}/${archivo.name}`);
    await uploadBytes(storageRef, archivo.file);
    const url = await getDownloadURL(storageRef);
    await updateDoc(pedidoRef, { archivo: { name: archivo.name, url } });
  }
}

// ── Crear cotización (admin) ─────────────────────────────────────────
export async function crearCotizacion(data) {
  const { archivoEstimado, notasEstimado, fechaPersonalizada, ...rest } = data;
  const countersRef = doc(db, 'config', 'counters');
  const pedidoRef = doc(collection(db, 'pedidos'));

  const fechaValue = fechaPersonalizada
    ? Timestamp.fromDate(new Date(fechaPersonalizada + 'T12:00:00'))
    : serverTimestamp();

  let folio;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(countersRef);
    const next = (snap.exists() ? (snap.data().pedidos || 0) : 0) + 1;
    folio = `PP-${String(next).padStart(4, '0')}`;
    tx.set(pedidoRef, {
      ...rest,
      folio,
      fecha: fechaValue,
      estado: 'cotizando',
      tipo: 'pedido',
      estimado: {
        notas: notasEstimado || '',
        archivo: null,
        fecha: new Date().toISOString().split('T')[0],
        respuesta: 'pendiente',
      },
      mensajes: [],
      archivo: null,
    });
    tx.set(countersRef, { pedidos: next }, { merge: true });
  });

  if (archivoEstimado?.file) {
    const storageRef = ref(storage, `estimados/${pedidoRef.id}/${archivoEstimado.name}`);
    await uploadBytes(storageRef, archivoEstimado.file);
    const url = await getDownloadURL(storageRef);
    await updateDoc(pedidoRef, { 'estimado.archivo': { name: archivoEstimado.name, url } });
  }
}

// ── Auditoría de acciones de admin (solo superadmin puede leerla) ────
async function registrarAuditoria(pedidoId, accion, detalle) {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      adminUid: auth.currentUser?.uid || null,
      pedidoId,
      accion,
      detalle,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.error('registrarAuditoria error:', e.code || e.message);
  }
}

// ── Cambiar estatus ─────────────────────────────────────────────────
export async function cambiarEstatus(pedidoId, estado, fechaEntrega) {
  const ref = doc(db, 'pedidos', pedidoId);
  const data = { estado };
  if (fechaEntrega !== undefined) data.fechaEntrega = fechaEntrega;
  await updateDoc(ref, data);
  registrarAuditoria(pedidoId, 'estado', `Estado → ${estado}${fechaEntrega ? ` (entrega: ${fechaEntrega})` : ''}`);
}

// ── Enviar estimado ─────────────────────────────────────────────────
export async function enviarEstimado(pedidoId, { notas, archivo }) {
  let archivoData = null;
  if (archivo?.file) {
    const storageRef = ref(storage, `estimados/${pedidoId}/${archivo.name}`);
    await uploadBytes(storageRef, archivo.file);
    const url = await getDownloadURL(storageRef);
    archivoData = { name: archivo.name, url };
  } else if (archivo?.url) {
    archivoData = { name: archivo.name, url: archivo.url };
  }
  const nuevoEstimado = {
    notas,
    archivo: archivoData,
    fecha: new Date().toISOString().split('T')[0],
    respuesta: 'pendiente',
  };
  await updateDoc(doc(db, 'pedidos', pedidoId), {
    estimado: nuevoEstimado,
    estado: 'cotizando',
    tipo: 'pedido',
  });
  registrarAuditoria(pedidoId, 'estimado', 'Estimado enviado');
}

// ── Responder estimado ──────────────────────────────────────────────
export async function responderEstimado(pedidoId, respuesta) {
  const datos = { 'estimado.respuesta': respuesta };
  if (respuesta === 'aceptado') datos.estado = 'pedido_fabrica';
  await updateDoc(doc(db, 'pedidos', pedidoId), datos);
}

// ── Enviar mensaje de chat ──────────────────────────────────────────
export async function enviarMensaje(pedidoId, texto, from, adjunto) {
  let adjuntoData = null;
  if (adjunto?.file) {
    const storageRef = ref(storage, `chats/${pedidoId}/${Date.now()}_${adjunto.name}`);
    await uploadBytes(storageRef, adjunto.file);
    const url = await getDownloadURL(storageRef);
    adjuntoData = { name: adjunto.name, type: adjunto.type, url };
  }
  const mensaje = {
    from,
    texto,
    hora: new Date().toLocaleTimeString('es-PR', { hour: '2-digit', minute: '2-digit' }),
    ...(adjuntoData ? { attachment: adjuntoData } : {}),
  };
  await updateDoc(doc(db, 'pedidos', pedidoId), {
    mensajes: arrayUnion(mensaje),
  });
}

// ── Eliminar mensaje de chat (admin) ────────────────────────────────
export async function eliminarMensaje(pedidoId, mensajesActuales, index) {
  const borrado = (mensajesActuales || [])[index];
  const mensajes = (mensajesActuales || []).filter((_, i) => i !== index);
  await updateDoc(doc(db, 'pedidos', pedidoId), { mensajes });
  const snippet = (borrado?.texto || (borrado?.attachment ? '[adjunto]' : '')).slice(0, 80);
  registrarAuditoria(pedidoId, 'mensaje_eliminado', `Mensaje de ${borrado?.from || '?'} eliminado: "${snippet}"`);
}

// ── Notas internas (admin) ─────────────────────────────────────────
export async function actualizarNotasInternas(pedidoId, notas) {
  await updateDoc(doc(db, 'pedidos', pedidoId), { notasInternas: notas });
  const snippet = (notas || '').slice(0, 80) + ((notas || '').length > 80 ? '…' : '');
  registrarAuditoria(pedidoId, 'notas', `Notas internas actualizadas: "${snippet}"`);
}

// ── Referencias PO / Orden (admin) ────────────────────────────────
export async function actualizarReferencias(pedidoId, { numeroPO, numeroOrden }) {
  await updateDoc(doc(db, 'pedidos', pedidoId), { numeroPO, numeroOrden });
  registrarAuditoria(pedidoId, 'referencias', `PO: ${numeroPO || '—'}, Orden: ${numeroOrden || '—'}`);
}

// ── Eliminar pedido (admin) ─────────────────────────────────────────
export async function eliminarPedido(pedidoId) {
  const snap = await getDoc(doc(db, 'pedidos', pedidoId));
  const data = snap.data();
  await deleteDoc(doc(db, 'pedidos', pedidoId));
  registrarAuditoria(pedidoId, 'pedido_eliminado', `Pedido eliminado: ${data?.folio || pedidoId} — ${data?.vehiculo || '—'}`);
}

// ── Actualizar taller (admin) ───────────────────────────────────────
export async function actualizarTaller(uid, datos) {
  await updateDoc(doc(db, 'talleres', uid), datos);
}

// ── Eliminar taller (admin) ─────────────────────────────────────────
export async function eliminarTaller(uid) {
  await deleteDoc(doc(db, 'talleres', uid));
}

// ── Sub-usuarios de talleres ────────────────────────────────────────
export function useTallerUsuarios(user) {
  const [tallerUsuarios, setTallerUsuarios] = useState([]);
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const unsub = onSnapshot(
      collection(db, 'tallerUsuarios'),
      snap => setTallerUsuarios(snap.docs.map(d => ({ uid: d.id, ...d.data() }))),
      err => console.error('useTallerUsuarios:', err.code)
    );
    return unsub;
  }, [user]);
  return tallerUsuarios;
}

export async function crearTallerUsuario(tallerId, { nombre, email, password }) {
  const secondaryApp = initializeApp(firebaseConfig, `create-taller-user-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  let uid;
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    uid = cred.user.uid;
  } finally {
    await deleteApp(secondaryApp);
  }
  await setDoc(doc(db, 'tallerUsuarios', uid), { tallerId, nombre, email });
}

export async function eliminarTallerUsuario(uid) {
  await deleteDoc(doc(db, 'tallerUsuarios', uid));
}

export async function actualizarTallerUsuario(uid, data) {
  await updateDoc(doc(db, 'tallerUsuarios', uid), data);
}

// ── Equipo admin en tiempo real ─────────────────────────────────────
export function useAdminEquipo(user) {
  const [equipo, setEquipo] = useState([]);
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const unsub = onSnapshot(
      collection(db, 'admins'),
      snap => setEquipo(snap.docs.map(d => ({ uid: d.id, ...d.data() }))),
      err => console.error('useAdminEquipo:', err.code)
    );
    return unsub;
  }, [user]);
  return equipo;
}

export async function crearAdminUsuario({ nombre, email, password, permisos }) {
  const secondaryApp = initializeApp(firebaseConfig, `create-admin-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  let uid;
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    uid = cred.user.uid;
  } finally {
    await deleteApp(secondaryApp);
  }
  await setDoc(doc(db, 'admins', uid), { nombre, email, permisos });
}

export async function actualizarPermisosAdmin(uid, data) {
  await updateDoc(doc(db, 'admins', uid), data);
}

export async function eliminarAdminUsuario(uid) {
  await deleteDoc(doc(db, 'admins', uid));
}

// ── Facturas en tiempo real ─────────────────────────────────────────
export function useFacturas(user) {
  const [facturas, setFacturas] = useState([]);
  useEffect(() => {
    if (!user) return;
    let q;
    if (user.role === 'admin') {
      q = query(collection(db, 'facturas'), orderBy('createdAt', 'asc'));
    } else {
      q = query(collection(db, 'facturas'), where('tallerId', '==', user.tallerId || user.uid));
    }
    const unsub = onSnapshot(q,
      snap => setFacturas(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => console.error('useFacturas:', err.code)
    );
    return unsub;
  }, [user]);
  return facturas;
}

export async function agregarFactura(data) {
  await addDoc(collection(db, 'facturas'), { ...data, createdAt: serverTimestamp() });
}

export async function actualizarFactura(id, data) {
  await updateDoc(doc(db, 'facturas', id), data);
}

export async function eliminarFactura(id) {
  await deleteDoc(doc(db, 'facturas', id));
}

export async function archivarFactura(id, archivada = true) {
  await updateDoc(doc(db, 'facturas', id), { archivada });
}

// ── FCM Tokens ─────────────────────────────────────────────────────
// El ID del documento es el token mismo (sanitizado) para que un
// mismo dispositivo nunca tenga 2 entradas aunque cambien de cuenta.

export async function guardarFCMToken(uid, token, role, tallerId = null) {
  const tokenId = token.replace(/\//g, '_');
  // Borrar tokens viejos del mismo uid para que el dispositivo no quede con múltiples tokens activos
  const viejos = await getDocs(query(collection(db, 'fcmTokens'), where('uid', '==', uid)));
  const batch = writeBatch(db);
  viejos.docs.forEach(d => { if (d.id !== tokenId) batch.delete(d.ref); });
  batch.set(doc(db, 'fcmTokens', tokenId), { token, uid, role, tallerId, updatedAt: serverTimestamp() });
  await batch.commit();
}

export async function eliminarFCMToken(uid) {
  try {
    const snap = await getDocs(query(collection(db, 'fcmTokens'), where('uid', '==', uid)));
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  } catch {}
}

// ── Crear taller (admin) ────────────────────────────────────────────
export async function crearTaller({ nombre, contacto, telefono, email, usuario, password }) {
  let uid;

  if (email && password) {
    // Crea usuario en Auth usando app secundaria para no cerrar sesión del admin
    const secondaryApp = initializeApp(firebaseConfig, `create-taller-${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      uid = cred.user.uid;
    } finally {
      await deleteApp(secondaryApp);
    }
  } else {
    // Sin credenciales: solo registro en Firestore (sin acceso al portal)
    uid = `taller_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  await setDoc(doc(db, 'talleres', uid), {
    nombre,
    contacto: contacto || '',
    telefono: telefono || '',
    email: email || '',
    usuario: usuario || '',
  });
}
