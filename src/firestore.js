import { useState, useEffect } from 'react';
import { db, storage } from './firebase';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, where, orderBy, serverTimestamp, arrayUnion, runTransaction
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
      // Sin orderBy para evitar requerir indice compuesto en Firestore.
      // El orden se aplica en el cliente (ClientApp).
      q = query(collection(db, 'pedidos'), where('tallerId', '==', user.uid));
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
      const unsub = onSnapshot(
        doc(db, 'talleres', user.uid),
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
  const { archivo, ...rest } = data;
  const countersRef = doc(db, 'config', 'counters');
  const pedidoRef = doc(collection(db, 'pedidos'));

  let folio;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(countersRef);
    const next = (snap.exists() ? (snap.data().pedidos || 0) : 0) + 1;
    folio = `PP-${String(next).padStart(4, '0')}`;
    tx.set(pedidoRef, {
      ...rest,
      folio,
      fecha: serverTimestamp(),
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
