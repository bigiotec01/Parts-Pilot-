import { useState, useEffect } from 'react';
import { db, storage } from './firebase';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, where, orderBy, serverTimestamp, arrayUnion
} from 'firebase/firestore';
import {
  ref, uploadBytes, getDownloadURL
} from 'firebase/storage';
import {
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth } from './firebase';
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
      q = query(
        collection(db, 'pedidos'),
        where('tallerId', '==', user.uid),
        orderBy('fecha', 'desc')
      );
    }
    const unsub = onSnapshot(q, (snap) => {
      setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  return pedidos;
}

// ── Talleres en tiempo real ─────────────────────────────────────────
export function useTalleres(user) {
  const [talleres, setTalleres] = useState([]);
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'talleres'), (snap) => {
      setTalleres(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);
  return talleres;
}

// ── Crear pedido ────────────────────────────────────────────────────
export async function crearPedido(data) {
  await addDoc(collection(db, 'pedidos'), {
    ...data,
    fecha: serverTimestamp(),
    estado: 'pendiente',
    estimado: null,
    mensajes: [],
  });
}

// ── Cambiar estatus ─────────────────────────────────────────────────
export async function cambiarEstatus(pedidoId, estado, fechaEntrega) {
  const ref = doc(db, 'pedidos', pedidoId);
  const data = { estado };
  if (fechaEntrega !== undefined) data.fechaEntrega = fechaEntrega;
  await updateDoc(ref, data);
}

// ── Enviar estimado ─────────────────────────────────────────────────
export async function enviarEstimado(pedidoId, { monto, notas, archivo }) {
  let archivoData = null;
  if (archivo?.file) {
    const storageRef = ref(storage, `estimados/${pedidoId}/${archivo.name}`);
    await uploadBytes(storageRef, archivo.file);
    const url = await getDownloadURL(storageRef);
    archivoData = { name: archivo.name, url };
  }
  const nuevoEstimado = {
    monto,
    notas,
    archivo: archivoData,
    fecha: new Date().toISOString().split('T')[0],
    respuesta: 'pendiente',
  };
  await updateDoc(doc(db, 'pedidos', pedidoId), {
    estimado: nuevoEstimado,
    estado: 'cotizando',
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

// ── Eliminar taller (admin) ─────────────────────────────────────────
export async function eliminarTaller(uid) {
  await deleteDoc(doc(db, 'talleres', uid));
}

// ── Crear taller (admin) ────────────────────────────────────────────
export async function crearTaller({ nombre, contacto, telefono, email, usuario, password }) {
  // Crear usuario en Firebase Auth
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // Guardar perfil en Firestore
  await setDoc(doc(db, 'talleres', cred.user.uid), {
    nombre,
    contacto,
    telefono,
    email,
    usuario,
  });
}
