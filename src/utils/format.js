// Quita marcadores de markdown (**negrita**, *cursiva*) de texto escrito por
// usuarios en campos libres, ya que la app no tiene un renderer de markdown
// y esos asteriscos se veían literalmente en pantalla.
export function cleanText(text) {
  if (!text) return text;
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
}

// Suaviza texto escrito TODO EN MAYÚSCULAS (común en notas del admin/TagLogic) a
// formato oración, sin tocar el dato guardado — solo cambia cómo se muestra.
// Si el texto ya viene con mezcla de mayúsculas/minúsculas, se deja tal cual.
export function humanize(text) {
  if (!text) return text;
  const letras = text.replace(/[^a-zA-ZÀ-ÿ]/g, '');
  if (!letras || letras !== letras.toUpperCase()) return text;
  return text.charAt(0) + text.slice(1).toLowerCase();
}

// Normaliza el campo de archivos adjuntos: soporta tanto el arreglo nuevo
// (`archivos`) como el objeto único de pedidos/cotizaciones antiguos (`archivo`),
// para que la UI no tenga que preocuparse por el formato del documento.
export function filesOf(legacy, plural) {
  if (Array.isArray(plural)) return plural;
  return legacy ? [legacy] : [];
}

export function formatDate(d) {
  if (!d) return '—';
  // Firestore Timestamp tiene .toDate(), string no
  const date = d?.toDate ? d.toDate() : new Date(d + 'T00:00:00');
  if (isNaN(date)) return '—';
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Días transcurridos desde una fecha (Firestore Timestamp o Date) hasta hoy.
// null si no hay fecha o es inválida — el llamador decide cómo omitirlo.
export function daysSince(d) {
  if (!d) return null;
  const date = d?.toDate ? d.toDate() : new Date(d);
  if (isNaN(date)) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

/* ------------------------------------------------------------------ */
/*  COMPONENTES COMPARTIDOS                                            */
/* ------------------------------------------------------------------ */

export function fmtCur(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDateDisp(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

/* ------------------------------------------------------------------ */
/*  ESTIMACIÓN DE FECHA DE ENTREGA                                     */
/* ------------------------------------------------------------------ */

// Promedio (en días) entre fecha de registro y fecha de entrega de pedidos
// ya entregados, para sugerir una fecha automáticamente. null si no hay histórico suficiente.
export function avgDeliveryLeadDays(pedidos) {
  const toMs = f => f?.toDate ? f.toDate().getTime() : new Date(f + 'T00:00:00').getTime();
  const dias = (pedidos || [])
    .filter(p => p.estado === 'entregado' && p.fecha && p.fechaEntrega)
    .map(p => (toMs(p.fechaEntrega) - toMs(p.fecha)) / 86400000)
    .filter(d => Number.isFinite(d) && d >= 0 && d <= 90);
  if (dias.length < 3) return null;
  return Math.round(dias.reduce((a, b) => a + b, 0) / dias.length);
}

// Sugiere una fecha de entrega (YYYY-MM-DD) a partir de hoy, usando el promedio
// histórico si existe, o un valor por defecto razonable según el estado.
export function suggestDeliveryDate(estado, avgLeadDays) {
  const DEFAULTS = { en_transito: 3, recibido: 1 };
  const dias = avgLeadDays ?? DEFAULTS[estado] ?? 3;
  const d = new Date();
  d.setDate(d.getDate() + Math.max(1, dias));
  return d.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/*  ADMIN FACTURAS                                                      */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Antigüedad / "hoy"                                                 */
/* ------------------------------------------------------------------ */

// Acepta Timestamp de Firestore, Date, 'YYYY-MM-DD' (fecha local) o ISO.
export function toDateAny(d) {
  if (!d) return null;
  if (d?.toDate) return d.toDate();
  if (d instanceof Date) return isNaN(d) ? null : d;
  const s = String(d);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : new Date(s);
  return isNaN(date) ? null : date;
}

export function esHoy(d) {
  const date = toDateAny(d);
  if (!date) return false;
  return date.toDateString() === new Date().toDateString();
}

// Cuánto lleva esperando algo, con un color según urgencia:
// verde (≤1 día), ámbar (2–3 días), rojo (más de 3 días).
export function antiguedad(d) {
  const date = toDateAny(d);
  if (!date) return null;
  const horas = Math.max(0, (Date.now() - date.getTime()) / 3600000);
  const dias = Math.floor(horas / 24);
  const texto = horas < 1 ? 'hace un momento'
    : horas < 24 ? `hace ${Math.floor(horas)} h`
    : dias === 1 ? 'hace 1 día' : `hace ${dias} días`;
  const tono = dias <= 1 ? { color: '#059669', bg: 'rgba(16,185,129,0.12)' }
    : dias <= 3 ? { color: '#d97706', bg: 'rgba(245,158,11,0.14)' }
    : { color: '#dc2626', bg: 'rgba(239,68,68,0.12)' };
  return { texto, dias, ...tono };
}
