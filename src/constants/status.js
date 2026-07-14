import {
  Package, Truck, CheckCircle2, Clock, FileText, PackageCheck, Hourglass
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
};

export const STATUS_CONFIG_LIGHT = {
  pendiente:        { ...STATUS_CONFIG.pendiente,        bg: 'rgba(148,163,184,0.12)', tx: '#64748B' },
  cotizando:        { ...STATUS_CONFIG.cotizando,        bg: '#EFF6FF',  dot: '#2563EB', tx: '#2563EB' },
  pedido_fabrica:   { ...STATUS_CONFIG.pedido_fabrica,   bg: '#F5F3FF',  dot: '#7C3AED', tx: '#7C3AED' },
  ordenadas:        { ...STATUS_CONFIG.ordenadas,        bg: '#DCE7F6',  dot: '#2B6CB0', tx: '#2B6CB0' },
  esperando_piezas: { ...STATUS_CONFIG.esperando_piezas, bg: '#FFF7ED',  dot: '#C2410C', tx: '#C2410C' },
  en_transito:      { ...STATUS_CONFIG.en_transito,      bg: '#FEFCE8',  dot: '#A16207', tx: '#A16207' },
  recibido:         { ...STATUS_CONFIG.recibido,         bg: '#ECFDF5',  dot: '#059669', tx: '#059669' },
  entregado:        { ...STATUS_CONFIG.entregado,        bg: '#F0FDFA',  dot: '#0D9488', tx: '#0D9488' },
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
