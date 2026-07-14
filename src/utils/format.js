// Quita marcadores de markdown (**negrita**, *cursiva*) de texto escrito por
// usuarios en campos libres, ya que la app no tiene un renderer de markdown
// y esos asteriscos se veían literalmente en pantalla.
export function cleanText(text) {
  if (!text) return text;
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
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
