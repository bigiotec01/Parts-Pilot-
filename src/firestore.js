import { useState, useEffect } from 'react';
import { db, storage, functions } from './firebase';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, where, orderBy, serverTimestamp, arrayUnion, runTransaction, Timestamp,
  getDocs, writeBatch, deleteField,
} from 'firebase/firestore';
import {
  ref, uploadBytes, getDownloadURL
} from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { setDoc } from 'firebase/firestore';

// ── Empresa (tenant) en tiempo real ─────────────────────────────────
// Doc puntual (get de un solo documento) — no sujeto a la limitación de
// consultas de lista que exige where(tenantId) explícito (ver usePedidos).
export function useEmpresa(tenantId) {
  const [empresa, setEmpresa] = useState(null);
  useEffect(() => {
    setEmpresa(null);
    if (!tenantId) return;
    const unsub = onSnapshot(
      doc(db, 'empresas', tenantId),
      (snap) => setEmpresa(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      (err) => console.error('useEmpresa error:', err.code)
    );
    return unsub;
  }, [tenantId]);
  return empresa;
}

export async function actualizarMarcasFactura(marcas) {
  const fn = httpsCallable(functions, 'actualizarMarcasFactura');
  const { data } = await fn({ marcas });
  return data.marcas;
}

// ── Pedidos en tiempo real ──────────────────────────────────────────
export function usePedidos(user) {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    setPedidos([]); // limpia datos de una sesión/cuenta anterior antes de suscribirse a la nueva
    if (!user) return;
    let q;
    if (user.role === 'admin') {
      // La regla exige tenantId explícito en la query: sin este where(), Firestore no puede
      // evaluar tenantActiva()/isAdminOfTenant() en una consulta de lista y niega TODO el resultado
      // (no filtra documento por documento — "las reglas no son un filtro", falla todo o nada).
      q = query(collection(db, 'pedidos'), where('tenantId', '==', user.tenantId), orderBy('fecha', 'desc'));
    } else {
      // Para sub-usuarios de taller, usar tallerId (puede diferir del uid)
      q = query(collection(db, 'pedidos'), where('tallerId', '==', user.tallerId || user.uid), where('tenantId', '==', user.tenantId));
    }
    const unsub = onSnapshot(
      q,
      (snap) => {
        let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Miembro con acceso restringido a talleres específicos: la regla ya lo exige en el
        // servidor, esto solo evita que aparezcan en la lista mientras carga/si hay caché.
        if (user.role === 'admin' && Array.isArray(user.tallerIds)) {
          docs = docs.filter(p => user.tallerIds.includes(p.tallerId));
        }
        setPedidos(docs);
      },
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
    setTalleres([]); // limpia datos de una sesión/cuenta anterior antes de suscribirse a la nueva
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
      // where(tenantId) es obligatorio: la regla evalúa isAdminOfTenant(resource.data.tenantId)
      // vía get(), y una consulta de lista sin ese campo filtrado niega el resultado completo.
      query(collection(db, 'talleres'), where('tenantId', '==', user.tenantId)),
      (snap) => {
        let docs = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
        if (Array.isArray(user.tallerIds)) {
          docs = docs.filter(t => user.tallerIds.includes(t.uid));
        }
        setTalleres(docs);
      },
      (err) => console.error('useTalleres error:', err.code)
    );
    return unsub;
  }, [user]);
  return talleres;
}

// Sube una lista de archivos { name, file } a Storage y devuelve [{ name, url }].
// Se antepone timestamp+índice al nombre para evitar colisiones cuando se
// suben varios archivos con el mismo nombre en la misma carpeta.
async function subirArchivos(carpeta, archivos) {
  const subidos = [];
  for (let i = 0; i < archivos.length; i++) {
    const archivo = archivos[i];
    if (!archivo?.file) continue;
    const storageRef = ref(storage, `${carpeta}/${Date.now()}_${i}_${archivo.name}`);
    await uploadBytes(storageRef, archivo.file);
    const url = await getDownloadURL(storageRef);
    subidos.push({ name: archivo.name, type: archivo.type, url });
  }
  return subidos;
}

// ── Crear pedido ────────────────────────────────────────────────────
export async function crearPedido(data) {
  const { archivos, fechaPersonalizada, tenantId, ...rest } = data;
  const countersRef = doc(db, 'empresas', tenantId, 'counters', 'pedidos');
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
      tenantId,
      folio,
      fecha: fechaValue,
      estado: 'pendiente',
      estimado: null,
      mensajes: [],
      archivos: [],
    });
    tx.set(countersRef, { pedidos: next }, { merge: true });
  });

  if (archivos?.length) {
    const subidos = await subirArchivos(`solicitudes/${pedidoRef.id}`, archivos);
    if (subidos.length) await updateDoc(pedidoRef, { archivos: subidos });
  }
}

// ── Crear cotización (admin) ─────────────────────────────────────────
export async function crearCotizacion(data) {
  const { archivosEstimado, notasEstimado, fechaPersonalizada, tenantId, ...rest } = data;
  const countersRef = doc(db, 'empresas', tenantId, 'counters', 'pedidos');
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
      tenantId,
      folio,
      fecha: fechaValue,
      estado: 'cotizando',
      tipo: 'pedido',
      estimado: {
        notas: notasEstimado || '',
        archivos: [],
        fecha: new Date().toISOString().split('T')[0],
        respuesta: 'pendiente',
      },
      mensajes: [],
      archivos: [],
    });
    tx.set(countersRef, { pedidos: next }, { merge: true });
  });

  if (archivosEstimado?.length) {
    const subidos = await subirArchivos(`estimados/${pedidoRef.id}`, archivosEstimado);
    if (subidos.length) await updateDoc(pedidoRef, { 'estimado.archivos': subidos });
  }
}

// ── Cambiar estatus ─────────────────────────────────────────────────
export async function cambiarEstatus(pedidoId, estado, fechaEntrega) {
  const ref = doc(db, 'pedidos', pedidoId);
  const data = { estado };
  if (fechaEntrega !== undefined) data.fechaEntrega = fechaEntrega === '' ? deleteField() : fechaEntrega;
  await updateDoc(ref, data);
}

// ── Enviar estimado ─────────────────────────────────────────────────
export async function enviarEstimado(pedidoId, { notas, archivos }) {
  const lista = archivos || [];
  // Los que ya tenían url (archivos previos conservados al editar) se mantienen tal cual;
  // los nuevos (con .file) se suben a Storage.
  const yaSubidos = lista.filter(a => a?.url && !a?.file).map(a => ({ name: a.name, type: a.type || null, url: a.url }));
  const nuevos = await subirArchivos(`estimados/${pedidoId}`, lista.filter(a => a?.file));
  const nuevoEstimado = {
    notas,
    archivos: [...yaSubidos, ...nuevos],
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
  if (respuesta === 'aceptado') {
    datos.estado = 'pedido_fabrica';
    datos.tipo = 'pedido';
  }
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
  const mensajes = (mensajesActuales || []).filter((_, i) => i !== index);
  await updateDoc(doc(db, 'pedidos', pedidoId), { mensajes });
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
    setTallerUsuarios([]); // limpia datos de una sesión/cuenta anterior antes de suscribirse a la nueva
    if (!user || user.role !== 'admin') return;
    const unsub = onSnapshot(
      query(collection(db, 'tallerUsuarios'), where('tenantId', '==', user.tenantId)),
      snap => setTallerUsuarios(snap.docs.map(d => ({ uid: d.id, ...d.data() }))),
      err => console.error('useTallerUsuarios:', err.code)
    );
    return unsub;
  }, [user]);
  return tallerUsuarios;
}

export async function crearTallerUsuario(tallerId, { nombre, email, password }) {
  const fn = httpsCallable(functions, 'crearTallerUsuarioCF');
  await fn({ tallerId, nombre, email, password });
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
    setEquipo([]); // limpia datos de una sesión/cuenta anterior antes de suscribirse a la nueva
    if (!user || user.role !== 'admin') return;
    const unsub = onSnapshot(
      query(collection(db, 'admins'), where('tenantId', '==', user.tenantId)),
      snap => setEquipo(snap.docs.map(d => ({ uid: d.id, ...d.data() }))),
      err => console.error('useAdminEquipo:', err.code)
    );
    return unsub;
  }, [user]);
  return equipo;
}

export async function crearAdminUsuario({ nombre, email, password, permisos, tallerIds }) {
  const fn = httpsCallable(functions, 'crearMiembroEquipo');
  await fn({ nombre, email, password, permisos, tallerIds });
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
    setFacturas([]); // limpia datos de una sesión/cuenta anterior antes de suscribirse a la nueva
    if (!user) return;
    let q;
    if (user.role === 'admin') {
      // Ver el comentario equivalente en usePedidos: la regla necesita tenantId en la query.
      q = query(collection(db, 'facturas'), where('tenantId', '==', user.tenantId), orderBy('createdAt', 'asc'));
    } else {
      q = query(collection(db, 'facturas'), where('tallerId', '==', user.tallerId || user.uid), where('tenantId', '==', user.tenantId));
    }
    const unsub = onSnapshot(q,
      snap => {
        let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (user.role === 'admin' && Array.isArray(user.tallerIds)) {
          docs = docs.filter(f => user.tallerIds.includes(f.tallerId));
        }
        setFacturas(docs);
      },
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

// ── Backups de facturas (solo superadmin) ────────────────────────────
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function useFacturaBackups(enabled, tenantId) {
  const [backups, setBackups] = useState([]);
  useEffect(() => {
    if (!enabled || !tenantId) { setBackups([]); return; }
    // Sin orderBy en la query (evita depender de un índice compuesto) — se ordena al vuelo.
    const q = query(collection(db, 'facturaBackups'), where('tenantId', '==', tenantId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => (b.fecha?.toMillis?.() || 0) - (a.fecha?.toMillis?.() || 0));
        setBackups(docs);
      },
      (err) => console.error('useFacturaBackups error:', err.code)
    );
    return unsub;
  }, [enabled, tenantId]);
  return backups;
}

export async function crearBackupFacturas(facturas, tenantId) {
  const backupRef = doc(collection(db, 'facturaBackups'));
  // El doc padre se crea PRIMERO (con tenantId): la regla de la subcolección items
  // necesita poder leerlo para saber a qué empresa pertenece.
  await setDoc(backupRef, { fecha: serverTimestamp(), count: facturas.length, tenantId });
  for (const grupo of chunk(facturas, 400)) {
    const batch = writeBatch(db);
    grupo.forEach(f => {
      const { id, ...data } = f;
      batch.set(doc(db, 'facturaBackups', backupRef.id, 'items', id), data);
    });
    await batch.commit();
  }
  return backupRef.id;
}

// Restaura un backup: reemplaza las facturas actuales DE ESTE TENANT por las del backup elegido.
// Nunca toca facturas de otras empresas.
export async function restaurarBackupFacturas(backupId, tenantId) {
  const [itemsSnap, actualesSnap] = await Promise.all([
    getDocs(collection(db, 'facturaBackups', backupId, 'items')),
    getDocs(query(collection(db, 'facturas'), where('tenantId', '==', tenantId))),
  ]);

  for (const grupo of chunk(actualesSnap.docs, 400)) {
    const batch = writeBatch(db);
    grupo.forEach(d => batch.delete(doc(db, 'facturas', d.id)));
    await batch.commit();
  }

  for (const grupo of chunk(itemsSnap.docs, 400)) {
    const batch = writeBatch(db);
    // Se fuerza tenantId aunque el backup sea de antes del refactor multi-tenant.
    grupo.forEach(d => batch.set(doc(db, 'facturas', d.id), { ...d.data(), tenantId }));
    await batch.commit();
  }
}

export async function eliminarBackupFacturas(backupId) {
  const itemsSnap = await getDocs(collection(db, 'facturaBackups', backupId, 'items'));
  for (const grupo of chunk(itemsSnap.docs, 400)) {
    const batch = writeBatch(db);
    grupo.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
  await deleteDoc(doc(db, 'facturaBackups', backupId));
}

// ── FCM Tokens ─────────────────────────────────────────────────────
// El ID del documento es el token mismo (sanitizado) para que un
// mismo dispositivo nunca tenga 2 entradas aunque cambien de cuenta.

export async function guardarFCMToken(uid, token, role, tallerId = null, tenantId = null) {
  const tokenId = token.replace(/\//g, '_');
  // Borrar tokens viejos del mismo uid para que el dispositivo no quede con múltiples tokens activos
  const viejos = await getDocs(query(collection(db, 'fcmTokens'), where('uid', '==', uid)));
  const batch = writeBatch(db);
  viejos.docs.forEach(d => { if (d.id !== tokenId) batch.delete(d.ref); });
  batch.set(doc(db, 'fcmTokens', tokenId), { token, uid, role, tallerId, tenantId, updatedAt: serverTimestamp() });
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
  const fn = httpsCallable(functions, 'crearTallerCF');
  await fn({ nombre, contacto, telefono, email, usuario, password });
}
