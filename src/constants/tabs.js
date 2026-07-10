import {
  FileText, Plus, LayoutDashboard, ClipboardList, Users, History, UserCircle, ClipboardCheck
} from 'lucide-react';

export const ADMIN_TABS = [
  { id: 'dashboard',   label: 'Resumen',           icon: LayoutDashboard },
  { id: 'pedidos',     label: 'Pedidos',            icon: ClipboardList },
  { id: 'estimados',   label: 'Estimados',          icon: FileText },
  { id: 'talleres',    label: 'Talleres',           icon: Users },
  { id: 'nuevo',       label: 'Nuevo pedido',       icon: Plus },
  { id: 'cotizacion',  label: 'Nueva cotización',   icon: ClipboardCheck },
];

export const CLIENT_TABS = [
  { id: 'pedidos',   label: 'Mis pedidos',       icon: ClipboardList },
  { id: 'historial', label: 'Historial',          icon: History },
  { id: 'estimados', label: 'Estimados',          icon: FileText },
  { id: 'nueva',     label: 'Solicitar Estimado', icon: Plus },
  { id: 'perfil',    label: 'Mi Perfil',          icon: UserCircle },
];

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */
