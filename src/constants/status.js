import {
  Package, Truck, CheckCircle2, Clock, FileText, PackageCheck, Hourglass, XCircle
} from 'lucide-react';

export const STATUS_ORDER = ['pendiente', 'cotizando', 'pedido_fabrica', 'ordenadas', 'esperando_piezas', 'en_transito', 'recibido', 'entregado'];

export const STATUS_CONFIG = {
  pendiente:        { label: 'Pendiente de cotizar', short: 'Pendiente',  dot: '#94a3b8', bg: 'rgba(148,163,184,0.15)', tx: '#94a3b8', icon: Clock },
  cotizando:        { label: 'Cotización enviada',   short: 'Cotizando',  dot: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  tx: '#60a5fa', icon: FileText },
  pedido_fabrica:   { label: 'Por ordenar',          short: 'Por ordenar',dot: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', tx: '#a78bfa', icon: Package },
  ordenadas:        { label: 'Piezas ordenadas',     short: 'Ordenadas',  dot: '#6366f1', bg: 'rgba(99,102,241,0.15)', tx: '#818cf8', icon: PackageCheck },
  esperando_piezas: { label: 'Esperando piezas',     short: 'Esperando piezas', dot: '#f59e0b', bg: 'rgba(245,158,11,0.15)', tx: '#f59e0b', icon: Hourglass },
  en_transito:      { label: 'En tránsito',          short: 'En camino',  dot: '#eab308', bg: 'rgba(234,179,8,0.15)',  tx: '#eab308', icon: Truck },
  recibido:         { label: 'Recibido en Tienda',   short: 'En Tienda',  dot: '#10b981', bg: 'rgba(16,185,129,0.15)', tx: '#34d399', icon: Package },
  entregado:        { label: 'Orden Completa',       short: 'Completa',   dot: '#14b8a6', bg: 'rgba(20,184,166,0.15)', tx: '#2dd4bf', icon: CheckCircle2 },
  // Terminal, fuera de STATUS_ORDER a propósito: no forma parte de la línea de progreso
  // normal de un pedido (Kanban/stepper), solo se usa para el badge en Historial.
  rechazado:        { label: 'Estimado rechazado',   short: 'Rechazado',  dot: '#ef4444', bg: 'rgba(239,68,68,0.15)',  tx: '#ef4444', icon: XCircle },
};

// Modo claro: píldoras de fondo pastel con texto oscuro del mismo tono, para
// que el estado se lea de un vistazo sin perder contraste.
export const STATUS_CONFIG_LIGHT = {
  pendiente:        { ...STATUS_CONFIG.pendiente,        bg: '#EEF1F5', dot: '#64748B', tx: '#334155' },
  cotizando:        { ...STATUS_CONFIG.cotizando,        bg: '#DBEAFE', dot: '#2563EB', tx: '#1E40AF' },
  pedido_fabrica:   { ...STATUS_CONFIG.pedido_fabrica,   bg: '#EDE9FE', dot: '#7C3AED', tx: '#5B21B6' },
  ordenadas:        { ...STATUS_CONFIG.ordenadas,        bg: '#E0E7FF', dot: '#4F46E5', tx: '#3730A3' },
  esperando_piezas: { ...STATUS_CONFIG.esperando_piezas, bg: '#FFEDD5', dot: '#EA580C', tx: '#9A3412' },
  en_transito:      { ...STATUS_CONFIG.en_transito,      bg: '#FEF3C7', dot: '#D97706', tx: '#92400E' },
  recibido:         { ...STATUS_CONFIG.recibido,         bg: '#D1FAE5', dot: '#059669', tx: '#065F46' },
  entregado:        { ...STATUS_CONFIG.entregado,        bg: '#CCFBF1', dot: '#0D9488', tx: '#115E59' },
  rechazado:        { ...STATUS_CONFIG.rechazado,        bg: '#FEE2E2', dot: '#DC2626', tx: '#991B1B' },
};

/* ── Avance rápido de estado ── */
// Solo se puede "avanzar" con un clic desde estados operativos internos;
// 'pendiente' y 'cotizando' dependen de acciones externas (cotizar / respuesta del taller).
const ADVANCEABLE = ['pedido_fabrica', 'ordenadas', 'esperando_piezas', 'en_transito', 'recibido'];

export function getNextStatus(estado) {
  if (!ADVANCEABLE.includes(estado)) return null;
  const idx = STATUS_ORDER.indexOf(estado);
  return STATUS_ORDER[idx + 1] || null;
}

/* ── Tema ── */
