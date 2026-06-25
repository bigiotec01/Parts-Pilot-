import { useState, useEffect } from 'react';
import { db, storage } from './firebase';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, where, orderBy, serverTimestamp, arrayUnion, runTransaction, Timestamp
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

// ── Cambiar estatus ─────────────────────────────────────────────────
export async function cambiarEstatus(pedidoId, estado, fechaEntrega) {
  const ref = doc(db, 'pedidos', pedidoId);
  const data = { estado };
  if (fechaEntrega !== undefined) data.fechaEntrega = fechaEntrega;
  await updateDoc(ref, data);
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

// ── Notas internas (admin) ─────────────────────────────────────────
export async function actualizarNotasInternas(pedidoId, notas) {
  await updateDoc(doc(db, 'pedidos', pedidoId), { notasInternas: notas });
}

// ── Referencias PO / Orden (admin) ────────────────────────────────
export async function actualizarReferencias(pedidoId, { numeroPO, numeroOrden }) {
  await updateDoc(doc(db, 'pedidos', pedidoId), { numeroPO, numeroOrden });
}

// ── Eliminar pedido (admin) ─────────────────────────────────────────
export async function eliminarPedido(pedidoId) {
  await deleteDoc(doc(db, 'pedidos', pedidoId));
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

export async function guardarFCMToken(uid, token, role, tallerId = null) {
  await setDoc(doc(db, 'fcmTokens', uid), {
    token,
    uid,
    role,
    tallerId,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function eliminarFCMToken(uid) {
  try { await deleteDoc(doc(db, 'fcmTokens', uid)); } catch {}
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
