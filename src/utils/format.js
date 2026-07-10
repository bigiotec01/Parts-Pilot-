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
/*  ADMIN FACTURAS                                                      */
/* ------------------------------------------------------------------ */
