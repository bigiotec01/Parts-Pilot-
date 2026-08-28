export const MODULOS_PERM = [
  { id: 'pedidos',   label: 'Pedidos' },
  { id: 'estimados', label: 'Estimados' },
  { id: 'talleres',  label: 'Talleres' },
  { id: 'empresas',  label: 'Empresas' },
  { id: 'facturas',  label: 'Facturas' },
];

// Secciones del sidebar que el Super Admin puede activar/desactivar por empresa
// (tenant), según lo que esa empresa haya comprado del sistema. Debe reflejar los
// ids reales de AdminSidebar.jsx/AdminApp.jsx — y coincidir con MODULOS_TENANT_VALIDOS
// en functions/index.js.
export const MODULOS_TENANT = [
  { id: 'pedidos',   label: 'Pedidos' },
  { id: 'estimados', label: 'Estimados' },
  { id: 'mensajes',  label: 'Mensajes' },
  { id: 'talleres',  label: 'Talleres' },
  { id: 'empresas',  label: 'Empresas' },
  { id: 'historial', label: 'Historial' },
  { id: 'facturas',  label: 'Facturas' },
  { id: 'invoices',  label: 'Invoice' },
  { id: 'equipo',    label: 'Equipo' },
];

export const PERM_OPTS = [
  { val: 'none', label: 'Sin acceso', bg: 'rgba(239,68,68,0.10)',  color: '#ef4444' },
  { val: 'view', label: 'Solo ver',   bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  { val: 'edit', label: 'Editar',     bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
];
