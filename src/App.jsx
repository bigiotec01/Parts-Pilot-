import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  CarFront, Package, Truck, CheckCircle2, Clock, FileText, LogOut, Plus, Search,
  Building2, Phone, X, ThumbsUp, ThumbsDown, ChevronRight, AlertCircle,
  LayoutDashboard, ClipboardList, Users, Calendar, Send, Eye, EyeOff, MessageSquare, Paperclip, Mail,
  Printer, Trash2, Pencil, History, UserCircle, CheckCheck, StickyNote, NotebookPen,
  PackageCheck, Hourglass, ClipboardCheck, Bell, Receipt
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  DATOS DE EJEMPLO (en una app real, esto viviría en tu base datos)  */
/* ------------------------------------------------------------------ */

// Firebase maneja autenticación y datos - ver useAuth.js y firestore.js

const STATUS_ORDER = ['pendiente', 'cotizando', 'pedido_fabrica', 'ordenadas', 'esperando_piezas', 'en_transito', 'recibido', 'entregado'];

const STATUS_CONFIG = {
  pendiente:        { label: 'Pendiente de cotizar', short: 'Pendiente',  dot: '#94a3b8', bg: '#f1f3f5', tx: '#5b626e', icon: Clock },
  cotizando:        { label: 'Cotización enviada',   short: 'Cotizando',  dot: '#3b82f6', bg: '#eef4ff', tx: '#2563eb', icon: FileText },
  pedido_fabrica:   { label: 'Por ordenar',           short: 'Por ordenar', dot: '#8b5cf6', bg: '#f4effe', tx: '#7c3aed', icon: Package },
  ordenadas:        { label: 'Piezas ordenadas',     short: 'Ordenadas',  dot: '#6366f1', bg: '#eef0fe', tx: '#4f46e5', icon: PackageCheck },
  esperando_piezas: { label: 'Esperando piezas',     short: 'Esperando',  dot: '#f59e0b', bg: '#fef6e9', tx: '#b7791f', icon: Hourglass },
  en_transito:      { label: 'En tránsito',          short: 'En camino',  dot: '#eab308', bg: '#fdfae8', tx: '#a16207', icon: Truck },
  recibido:         { label: 'Recibido en Tienda',   short: 'En Tienda',  dot: '#10b981', bg: '#eafaf2', tx: '#059669', icon: Package },
  entregado:        { label: 'Orden Completa',       short: 'Completa',   dot: '#14b8a6', bg: '#e9faf7', tx: '#0d9488', icon: CheckCircle2 },
};

/* ------------------------------------------------------------------ */
/*  ACTIVIDAD — resaltado de tarjetas con cambios no vistos            */
/* ------------------------------------------------------------------ */

function lsActivityKey(role, orderId) { return `pp_act_${role}_${orderId}`; }

function saveOrderSeen(role, order) {
  try {
    localStorage.setItem(lsActivityKey(role, order.id), JSON.stringify({
      estado:     order.estado,
      respuesta:  order.estimado?.respuesta || '',
      estNotas:   order.estimado?.notas || '',
      adminMsgs:  (order.mensajes || []).filter(m => m.from === 'admin').length,
      tallerMsgs: (order.mensajes || []).filter(m => m.from === 'taller').length,
    }));
  } catch {}
}

function hasNewActivity(role, order) {
  try {
    const raw = localStorage.getItem(lsActivityKey(role, order.id));
    if (!raw) {
      // Sin baseline: resaltar si hay mensajes del otro lado o respuesta al estimado
      if (role === 'admin') {
        const tallerMsgs = (order.mensajes || []).filter(m => m.from === 'taller').length;
        if (tallerMsgs > 0) return true;
        if (order.estimado?.respuesta && order.estimado.respuesta !== 'pendiente') return true;
      }
      // Para taller: no resaltar en primer render (evita ruido en primera carga)
      saveOrderSeen(role, order);
      return false;
    }
    const seen = JSON.parse(raw);
    if (role === 'taller') {
      if (seen.estado   !== order.estado)                       return true;
      if (seen.estNotas !== (order.estimado?.notas || ''))      return true;
      const adminMsgs = (order.mensajes || []).filter(m => m.from === 'admin').length;
      if (adminMsgs > seen.adminMsgs)                           return true;
    } else {
      if (seen.respuesta !== (order.estimado?.respuesta || '')) return true;
      const tallerMsgs = (order.mensajes || []).filter(m => m.from === 'taller').length;
      if (tallerMsgs > seen.tallerMsgs)                         return true;
    }
  } catch {}
  return false;
}

const PEDIDOS_INICIAL = [
  { id: 'OP-2026-001', tallerId: 1, vehiculo: 'Toyota Corolla 2020', pieza: 'Fascia delantera', notas: '', fecha: '2026-05-20', estado: 'entregado',
    estimado: { notas: 'Pieza original, incluye soportes nuevos.', fecha: '2026-05-21', respuesta: 'aceptado' } },

  { id: 'OP-2026-002', tallerId: 1, vehiculo: 'Nissan Versa 2019', pieza: 'Faro delantero derecho', notas: 'Cliente requiere pieza original, no genérica.', fecha: '2026-06-05', estado: 'en_transito',
    estimado: { notas: 'Disponible en almacén CDMX, llega en 2 días.', fecha: '2026-06-06', respuesta: 'aceptado' },
    mensajes: [
      { from: 'taller', texto: 'Buenas, ¿ya se sabe cuándo llega el faro?', hora: 'Ayer, 10:15 a.m.' },
      { from: 'admin', texto: 'Sí, va en tránsito desde CDMX, llega mañana por la tarde.', hora: 'Ayer, 10:22 a.m.' },
      { from: 'taller', texto: 'Perfecto, gracias por el seguimiento.', hora: 'Ayer, 10:23 a.m.' },
    ] },

  { id: 'OP-2026-003', tallerId: 1, vehiculo: 'Toyota Hilux 2022', pieza: 'Defensa trasera', notas: '', fecha: '2026-06-10', estado: 'cotizando',
    estimado: { notas: 'Pieza original importada, tiempo de entrega 10 días hábiles.', fecha: '2026-06-11', respuesta: 'pendiente' },
    mensajes: [
      { from: 'admin', texto: 'Te envié el estimado de la defensa, quedo atento a tu respuesta.', hora: 'Ayer, 4:40 p.m.' },
    ] },

  { id: 'OP-2026-004', tallerId: 2, vehiculo: 'Honda CR-V 2021', pieza: 'Espejo lateral izquierdo c/ direccional', notas: '', fecha: '2026-06-08', estado: 'recibido',
    estimado: { notas: '', fecha: '2026-06-09', respuesta: 'aceptado' } },

  { id: 'OP-2026-005', tallerId: 2, vehiculo: 'Mazda 3 2020', pieza: 'Cofre', notas: 'Verificar color antes de pintar.', fecha: '2026-06-12', estado: 'pedido_fabrica',
    estimado: { notas: 'Pedido especial a fábrica, tiempo estimado 15 días.', fecha: '2026-06-12', respuesta: 'aceptado' } },

  { id: 'OP-2026-006', tallerId: 3, vehiculo: 'Chevrolet Aveo 2018', pieza: 'Parrilla frontal', notas: 'Urgente, cliente espera el auto.', fecha: '2026-06-13', estado: 'pendiente',
    estimado: null,
    mensajes: [
      { from: 'taller', texto: 'Es urgente, el cliente está esperando el auto. ¿Cuándo me pueden dar el estimado?', hora: 'Hoy, 9:05 a.m.' },
    ] },

  { id: 'OP-2026-007', tallerId: 2, vehiculo: 'Toyota Camry 2023', pieza: 'Puerta delantera derecha', notas: '', fecha: '2026-06-14', estado: 'cotizando',
    estimado: { notas: 'Pieza con pintura de fábrica color blanco perlado, confirmar código.', fecha: '2026-06-14', respuesta: 'pendiente' } },

  { id: 'OP-2026-008', tallerId: 3, vehiculo: 'Kia Rio 2021', pieza: 'Faro trasero izquierdo', notas: '', fecha: '2026-05-28', estado: 'entregado',
    estimado: { notas: '', fecha: '2026-05-29', respuesta: 'aceptado' } },
];

const ADMIN_TABS = [
  { id: 'dashboard',   label: 'Resumen',           icon: LayoutDashboard },
  { id: 'pedidos',     label: 'Pedidos',            icon: ClipboardList },
  { id: 'estimados',   label: 'Estimados',          icon: FileText },
  { id: 'talleres',    label: 'Talleres',           icon: Users },
  { id: 'nuevo',       label: 'Nuevo pedido',       icon: Plus },
  { id: 'cotizacion',  label: 'Nueva cotización',   icon: ClipboardCheck },
];

const CLIENT_TABS = [
  { id: 'pedidos',   label: 'Mis pedidos',       icon: ClipboardList },
  { id: 'historial', label: 'Historial',          icon: History },
  { id: 'estimados', label: 'Estimados',          icon: FileText },
  { id: 'nueva',     label: 'Solicitar Estimado', icon: Plus },
  { id: 'perfil',    label: 'Mi Perfil',          icon: UserCircle },
];

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */



function formatDate(d) {
  if (!d) return '—';
  // Firestore Timestamp tiene .toDate(), string no
  const date = d?.toDate ? d.toDate() : new Date(d + 'T00:00:00');
  if (isNaN(date)) return '—';
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ------------------------------------------------------------------ */
/*  COMPONENTES COMPARTIDOS                                            */
/* ------------------------------------------------------------------ */

function AdminSidebar({ activeTab, onChange, solicitudesCount, pedidosCount, onLogout, canView, canEdit, canManageEquipo }) {
  const primaryItems = [
    { id: 'dashboard',                     label: 'Resumen',    icon: LayoutDashboard },
    canView('pedidos')   && { id: 'pedidos',    label: 'Pedidos',    icon: ClipboardList, badge: pedidosCount },
    canView('estimados') && { id: 'estimados',  label: 'Estimados',  icon: FileText, badge: solicitudesCount, accent: true },
    canView('talleres')  && { id: 'talleres',   label: 'Talleres',   icon: Users },
    canView('pedidos')   && { id: 'historial',  label: 'Historial',  icon: History },
  ].filter(Boolean);
  const secondaryItems = [
    canEdit('pedidos')   && { id: 'nuevo',      label: 'Nuevo pedido',    icon: Plus },
    canEdit('estimados') && { id: 'cotizacion', label: 'Nueva cotización', icon: ClipboardCheck },
    canView('facturas')  && { id: 'facturas',   label: 'Facturas',         icon: Receipt },
    canManageEquipo      && { id: 'equipo',     label: 'Equipo',           icon: Users },
  ].filter(Boolean);

  const NavBtn = ({ id, label, icon: Icon, badge, accent }) => {
    const active = activeTab === id;
    return (
      <button
        onClick={() => onChange(id)}
        className={`w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-[10px] text-[13.5px] font-semibold mb-0.5 transition-colors ${!active ? 'hover:bg-[#1f2228]' : ''}`}
        style={{ background: active ? '#e8632f' : 'transparent', color: active ? '#fff' : '#9aa1ad' }}
      >
        <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.8} />
        {label}
        {badge > 0 && (
          <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-[7px] leading-tight"
            style={{ background: active ? 'rgba(255,255,255,.2)' : (accent ? '#e8632f' : '#2a2e36'), color: active ? '#fff' : (accent ? '#fff' : '#9aa1ad') }}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="w-[252px] flex-shrink-0 flex flex-col sticky top-0 h-screen" style={{ background: '#141619' }}>
      <div className="px-5 py-[22px] flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(160deg, #e8632f, #c9491c)', boxShadow: '0 6px 16px -6px rgba(201,73,28,.6)' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 2.5 21 19.5 12 15.2 3 19.5 12 2.5Z" fill="#fff"/></svg>
        </div>
        <div>
          <div className="font-extrabold text-[15.5px] leading-none whitespace-nowrap" style={{ color: '#fff', letterSpacing: '-.01em' }}>Parts Pilot</div>
          <div className="mt-1 text-[10.5px] font-bold uppercase" style={{ color: '#6a7180', letterSpacing: '.04em' }}>Admin</div>
        </div>
      </div>

      <div className="px-3 flex-1 overflow-y-auto">
        <div className="text-[10.5px] font-bold uppercase px-2.5 py-2 mb-1" style={{ color: '#565d6b', letterSpacing: '.08em' }}>Operación</div>
        {primaryItems.map(item => <NavBtn key={item.id} {...item} />)}
        <div className="my-3" style={{ borderTop: '1px solid #1e2127' }} />
        {secondaryItems.map(item => <NavBtn key={item.id} {...item} />)}
      </div>

      <div className="p-3.5">
        <div className="rounded-[13px] p-3 flex items-center gap-2.5" style={{ background: '#1c1f25' }}>
          <div className="w-9 h-9 rounded-[9px] flex items-center justify-center text-[13px] font-bold flex-shrink-0" style={{ background: 'linear-gradient(150deg, #3a3f49, #272b32)', color: '#d6dae0' }}>AD</div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-bold truncate" style={{ color: '#e8eaee' }}>Administrador</div>
            <div className="text-[11px] truncate" style={{ color: '#6a7180' }}>admin</div>
          </div>
          <button onClick={onLogout} className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center flex-shrink-0 hover:bg-[#30343c] transition-colors" style={{ background: '#262a31', color: '#8a909c' }} title="Cerrar sesión">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function AdminTopbar({ pageTitle, pageSub, solicitudesCount, onGoToNuevo }) {
  return (
    <header className="h-[70px] flex-shrink-0 flex items-center gap-[18px] px-[30px] sticky top-0 z-20 border-b" style={{ background: 'rgba(244,245,247,.88)', backdropFilter: 'blur(8px)', borderColor: '#e7e9ed' }}>
      <div className="min-w-0">
        <h1 className="text-[19px] font-bold leading-tight" style={{ color: '#181b21', letterSpacing: '-.02em' }}>{pageTitle}</h1>
        <p className="text-[12.5px] font-medium" style={{ color: '#767d8a' }}>{pageSub}</p>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 pointer-events-none" style={{ color: '#9aa1ad' }} />
          <input placeholder="Buscar pedido, vehículo, folio…" className="pl-9 pr-3 py-[9px] rounded-[10px] text-[13px] border outline-none transition-[width] focus:w-[280px] focus:border-[#e8632f] focus:ring-2 focus:ring-[#e8632f]/10" style={{ width: 240, background: '#fff', borderColor: '#e3e5ea', color: '#181b21' }} />
        </div>
        <div className="relative">
          <button className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center border hover:bg-stone-50 transition-colors" style={{ background: '#fff', borderColor: '#e3e5ea', color: '#5b626e' }} title="Notificaciones">
            <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} />
          </button>
          {solicitudesCount > 0 && <span className="absolute top-2 right-2.5 w-[7px] h-[7px] rounded-full border-2 border-white" style={{ background: '#e8632f' }} />}
        </div>
        <button onClick={onGoToNuevo} className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-[#2a2e36]" style={{ background: '#181b21' }}>
          <Plus className="w-4 h-4" strokeWidth={2.2} /> Nuevo pedido
        </button>
      </div>
    </header>
  );
}

function Header({ title, subtitle, userLabel, onLogout, maxWidth = 'max-w-6xl' }) {
  return (
    <header className="bg-stone-900 text-white safe-top">
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
            <CarFront className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-base sm:text-lg leading-tight truncate">{title}</h1>
            <p className="text-xs text-stone-400 truncate">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="hidden sm:inline text-sm text-stone-300">{userLabel}</span>
          <button onClick={onLogout} className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 transition-colors" title="Cerrar sesión">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function NavTabs({ tabs, active, onChange, maxWidth = 'max-w-6xl' }) {
  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-10">
      <div className={`${maxWidth} mx-auto px-2 sm:px-4 flex gap-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${isActive ? 'border-orange-500 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function StatusBadge({ estado }) {
  const cfg = STATUS_CONFIG[estado];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.tx }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.short}
    </span>
  );
}

function StatusStepper({ estado }) {
  const currentIndex = STATUS_ORDER.indexOf(estado);
  const pct = Math.round((currentIndex / (STATUS_ORDER.length - 1)) * 100);
  const cfg = STATUS_CONFIG[estado];
  return (
    <div>
      {/* Barra de progreso compacta para móvil */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-semibold" style={{ color: cfg.tx }}>{cfg.short}</span>
        <span className="text-[11px]" style={{ color: '#9aa1ad' }}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: '#e8eaed' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cfg.dot }} />
      </div>
      {/* Stepper scrollable */}
      <div style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}>
      <div className="flex items-start" style={{ minWidth: 'max-content' }}>
        {STATUS_ORDER.map((status, i) => {
          const cfg = STATUS_CONFIG[status];
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          const active = isDone || isCurrent;
          return (
            <div key={status} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5 w-14 sm:w-16">
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{
                    background: active ? cfg.dot : '#e3e6ea',
                    boxShadow: isCurrent ? `0 0 0 4px ${cfg.bg}` : 'none',
                  }}
                />
                <span
                  className="text-[9.5px] text-center leading-tight"
                  style={{ color: isCurrent ? '#181b21' : '#aab0b9', fontWeight: isCurrent ? 700 : 500 }}
                >
                  {cfg.short}
                </span>
              </div>
              {i < STATUS_ORDER.length - 1 && (
                <div
                  className="h-0.5 w-6 sm:w-10 -mt-4"
                  style={{ background: isDone ? cfg.dot : '#e8eaed' }}
                />
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

function OrderCard({ order, taller, showTaller, onClick, unreadCount = 0, activityRole }) {
  const hasActivity = activityRole ? hasNewActivity(activityRole, order) : false;
  const hasNewIds = order.numeroPO || order.numeroOrden;
  const cardTitle = !hasNewIds ? (order.referencia || order.vehiculo) : order.vehiculo;
  const cardSub = !hasNewIds && order.referencia ? order.vehiculo : null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-[15px] p-[17px] border transition-all hover:border-[#e8632f] hover:shadow-[0_8px_24px_-14px_rgba(24,27,33,.3)] relative"
      style={{ background: '#fff', borderColor: hasActivity ? '#e8632f' : '#e7e9ed', boxShadow: hasActivity ? '0 0 0 2px rgba(232,99,47,.12)' : 'none' }}
    >
      {hasActivity && (
        <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#e8632f' }} />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: '#e8632f' }} />
        </span>
      )}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-[14.5px] truncate" style={{ color: '#181b21' }}>{cardTitle}</h3>
            {unreadCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0" style={{ background: '#fdeee7', color: '#c9491c' }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#e8632f' }} />
                {unreadCount} nuevo{unreadCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {cardSub && <p className="text-[12.5px] mt-0.5 truncate" style={{ color: '#767d8a' }}>{cardSub}</p>}
          {order.pieza && !cardSub && <p className="text-[12.5px] mt-0.5 truncate" style={{ color: '#767d8a' }}>{order.pieza}</p>}
          {hasNewIds && (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {order.numeroPO && <span className="text-[11px] px-2 py-0.5 rounded-md font-medium" style={{ background: '#eef4ff', color: '#2563eb', border: '1px solid #dbe7fe' }}>PO# {order.numeroPO}</span>}
              {order.numeroOrden && <span className="text-[11px] px-2 py-0.5 rounded-md font-medium" style={{ background: '#f4effe', color: '#7c3aed', border: '1px solid #e9d5ff' }}>Orden {order.numeroOrden}</span>}
            </div>
          )}
        </div>
        <StatusBadge estado={order.estado} />
      </div>
      <div className="flex items-center justify-between gap-2 pt-3" style={{ borderTop: '1px dashed #e7e9ed' }}>
        <div className="flex items-center gap-3 text-[11.5px] min-w-0" style={{ color: '#8a909c' }}>
          <span className="font-mono font-semibold" style={{ color: '#5b626e' }}>{order.folio || order.id?.slice(0, 8)}</span>
          {showTaller && taller && (
            <span className="flex items-center gap-1 truncate"><Building2 className="w-3.5 h-3.5 flex-shrink-0" />{taller.nombre}</span>
          )}
          <span className="flex items-center gap-1 flex-shrink-0"><Calendar className="w-3 h-3 flex-shrink-0" />{formatDate(order.fecha)}</span>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0 text-[11.5px]" style={{ color: '#8a909c' }}>
          {order.mensajes?.length > 0 && <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{order.mensajes.length}</span>}
          {order.estimado?.respuesta === 'pendiente' && <span className="flex items-center gap-1 font-semibold" style={{ color: '#b7791f' }}><Clock className="w-3.5 h-3.5" />Esperando</span>}
          {showTaller && order.notasInternas && <StickyNote className="w-3.5 h-3.5" style={{ color: '#aab0b9' }} />}
        </div>
      </div>
      {order.fechaEntrega && (
        <div className="mt-2 flex items-center gap-1 text-[11.5px] font-semibold" style={{ color: '#2563eb' }}>
          <Truck className="w-3.5 h-3.5 flex-shrink-0" /> Entrega est.: {formatDate(order.fechaEntrega)}
        </div>
      )}
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" style={{ background: 'rgba(20,22,26,.5)' }} onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl h-[92vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="w-10 h-1 rounded-full bg-stone-200" /></div>
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10" style={{ borderColor: '#eef0f2' }}>
          <h2 className="font-mono tracking-wider text-sm truncate pr-4" style={{ color: '#767d8a' }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 flex-shrink-0"><X className="w-5 h-5" style={{ color: '#767d8a' }} /></button>
        </div>
        <div className="p-6 flex-1">{children}</div>
      </div>
    </div>
  );
}

function OrderDrawer({ order, title, onClose, detailContent, chatProps }) {
  const messageCount = (order.mensajes || []).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(20,22,26,.5)', animation: 'ppFade .2s ease both' }}
        onClick={onClose}
      />
      <div
        className="relative w-full flex flex-col"
        style={{
          maxWidth: 980,
          maxHeight: '90vh',
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 40px 80px -20px rgba(0,0,0,.35)',
          animation: 'ppRise .28s cubic-bezier(.2,.8,.2,1) both',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-7 py-5 flex-shrink-0" style={{ borderBottom: '1px solid #eef0f2' }}>
          <div className="flex items-center gap-4 min-w-0">
            <div>
              <div className="font-mono text-[12px] font-semibold mb-0.5" style={{ color: '#9aa1ad' }}>
                {order.folio || order.id?.slice(0, 8)}
              </div>
              <h2 className="text-[20px] font-bold leading-tight" style={{ color: '#181b21', letterSpacing: '-.02em' }}>
                {title}
              </h2>
              {order.pieza && (
                <p className="text-[13px] mt-0.5" style={{ color: '#767d8a' }}>{order.pieza}</p>
              )}
            </div>
            <StatusBadge estado={order.estado} />
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-[10px] border flex items-center justify-center flex-shrink-0 hover:bg-stone-50 transition-colors"
            style={{ borderColor: '#e7e9ed', color: '#767d8a' }}
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Body: 2 columnas */}
        <div className="flex-1 overflow-hidden flex min-h-0">
          {/* Columna izquierda — detalle */}
          <div className="flex-1 overflow-y-auto p-7" style={{ borderRight: '1px solid #eef0f2' }}>
            {detailContent}
          </div>

          {/* Columna derecha — mensajes */}
          <div className="flex flex-col" style={{ width: 360, flexShrink: 0 }}>
            <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #eef0f2' }}>
              <p className="text-[13px] font-bold flex items-center gap-2" style={{ color: '#181b21' }}>
                <MessageSquare className="w-4 h-4" strokeWidth={1.8} />
                Mensajes
                {messageCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#f1f3f5', color: '#5b626e' }}>
                    {messageCount}
                  </span>
                )}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <OrderChat order={order} {...chatProps} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderSheet({ order, title, onClose, detailContent, chatProps }) {
  const [tab, setTab] = useState('detalle');
  const messageCount = (order.mensajes || []).length;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0" style={{ background: 'rgba(20,22,26,.45)', animation: 'ppFade .2s ease both' }} onClick={onClose} />
      <div className="pp-scroll absolute bottom-0 left-0 right-0 max-h-[88%] overflow-y-auto overflow-x-hidden rounded-t-[28px] flex flex-col" style={{ background: '#fff', animation: 'ppSheet .3s cubic-bezier(.2,.8,.2,1) both', WebkitOverflowScrolling: 'touch' }}>
        <div className="sticky top-0 bg-white z-10 px-5 pt-3 pb-4 border-b" style={{ borderColor: '#eef0f2' }}>
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: '#e3e6ea' }} />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-mono text-[11.5px] font-semibold" style={{ color: '#9aa1ad' }}>{order.folio || order.id?.slice(0,8)}</div>
              <h2 className="text-[17px] font-bold mt-0.5" style={{ color: '#181b21', letterSpacing: '-.01em' }}>{title}</h2>
              {order.pieza && <p className="text-[12.5px]" style={{ color: '#767d8a' }}>{order.pieza}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-[9px] border flex items-center justify-center flex-shrink-0" style={{ borderColor: '#e7e9ed', color: '#767d8a' }}><X className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-4 mt-3">
            {[['detalle','Detalle'], ['chat','Mensajes']].map(([id, lbl]) => (
              <button key={id} onClick={() => setTab(id)} className={`py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${tab === id ? 'border-[#e8632f] text-[#181b21]' : 'border-transparent text-[#9aa1ad]'}`}>
                {id === 'chat' && <MessageSquare className="w-4 h-4" />}{lbl}
                {id === 'chat' && messageCount > 0 && <span className="text-[10px] rounded-full px-1.5 py-0.5" style={{ background: '#f1f3f5', color: '#5b626e' }}>{messageCount}</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="p-5 pb-8" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
          {tab === 'detalle' ? detailContent : <OrderChat order={order} {...chatProps} />}
        </div>
      </div>
    </div>
  );
}

function ChatAttachment({ attachment, isMine }) {
  if (!attachment) return null;
  if (attachment.type?.startsWith('image/')) {
    return <img src={attachment.url} alt={attachment.name} className="rounded-lg max-w-full max-h-48 object-cover" />;
  }
  return (
    <a
      href={attachment.url} target="_blank" rel="noreferrer"
      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors ${isMine ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-200'}`}
    >
      <FileText className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm truncate">{attachment.name}</span>
    </a>
  );
}

function OrderChat({ order, role, otherPartyName, onSendMessage }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const mensajes = order.mensajes || [];

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setChatError('');
    try {
      await onSendMessage(order.id, text.trim());
      setText('');
    } catch (err) {
      setChatError('No se pudo enviar: ' + (err.message || err.code));
    } finally {
      setSending(false);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setChatError('');
    try {
      await onSendMessage(order.id, '', { name: file.name, type: file.type, file });
    } catch (err) {
      setChatError('No se pudo adjuntar: ' + (err.message || err.code));
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full min-h-[320px]">
      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {mensajes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 text-sm px-6">
            <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
            Aún no hay mensajes en este pedido.<br />Escribe el primero o adjunta una foto / PDF.
          </div>
        ) : mensajes.map((m, i) => {
          const isMine = m.from === role;
          return (
            <div key={i} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              {!isMine && <span className="text-[11px] mb-0.5 px-1" style={{ color: '#aab0b9' }}>{otherPartyName}</span>}
              <div
                className="max-w-[82%] rounded-[14px] px-3.5 py-2.5 text-[13px] leading-snug space-y-1.5"
                style={{
                  background: isMine ? '#181b21' : '#f1f3f5',
                  color: isMine ? '#fff' : '#181b21',
                  borderBottomRightRadius: isMine ? 5 : 14,
                  borderBottomLeftRadius: isMine ? 14 : 5,
                }}
              >
                {m.attachment && <ChatAttachment attachment={m.attachment} isMine={isMine} />}
                {m.texto && <p>{m.texto}</p>}
              </div>
              <span className="text-[10.5px] mt-1 px-1" style={{ color: '#aab0b9' }}>{m.hora}</span>
            </div>
          );
        })}
      </div>
      {chatError && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {chatError}
        </div>
      )}
      <form onSubmit={handleSend} className="flex items-center gap-2 pt-3 mt-2 border-t border-stone-100">
        <label className="bg-stone-100 hover:bg-stone-200 text-stone-500 p-2.5 rounded-lg transition-colors flex-shrink-0 cursor-pointer" title="Adjuntar foto o PDF">
          <Paperclip className="w-4 h-4" />
          <input type="file" accept="image/*,application/pdf" onChange={handleFile} className="hidden" />
        </label>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Escribe un mensaje..." className={`${inputClass} flex-1`} disabled={sending} />
        <button type="submit" disabled={sending} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white p-2.5 rounded-lg transition-colors flex-shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

function OrderModal({ order, title, onClose, detailContent, chatProps }) {
  const [tab, setTab] = useState('detalle');
  const messageCount = (order.mensajes || []).length;

  return (
    <Modal title={title} onClose={onClose}>
      <div className="flex gap-1 mb-4 border-b border-stone-100 -mt-1">
        <button
          onClick={() => setTab('detalle')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'detalle' ? 'border-orange-500 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
        >
          Detalle
        </button>
        <button
          onClick={() => setTab('chat')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${tab === 'chat' ? 'border-orange-500 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
        >
          <MessageSquare className="w-4 h-4" /> Mensajes
          {messageCount > 0 && <span className="bg-stone-200 text-stone-600 text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">{messageCount}</span>}
        </button>
      </div>
      {tab === 'detalle' ? detailContent : <OrderChat order={order} {...chatProps} />}
    </Modal>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="text-[12.5px] font-semibold block mb-1.5" style={{ color: '#4a505c' }}>{label}</label>
      {children}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-[11px] p-3" style={{ background: '#f8f9fa' }}>
      <p className="text-[11px] mb-0.5" style={{ color: '#9aa1ad' }}>{label}</p>
      <p className="text-[13.5px] font-semibold truncate" style={{ color: '#181b21' }}>{value}</p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-14" style={{ color: '#9aa1ad' }}>
      <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

const inputClass = "w-full px-3.5 py-[11px] rounded-[11px] border border-[#e3e5ea] text-[16px] outline-none transition-all focus:border-[#e8632f] focus:ring-2 focus:ring-[#e8632f]/10 bg-white text-[#181b21]";

/* ------------------------------------------------------------------ */
/*  LOGIN                                                              */
/* ------------------------------------------------------------------ */

function LoginScreen({ onLogin, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email.trim(), password.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'radial-gradient(900px 600px at 70% -10%, #23262e 0%, #14161a 55%, #101115 100%)' }}>
      <div className="w-full max-w-[400px]" style={{ animation: 'ppRise .5s ease both' }}>
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center rounded-[16px] mb-[18px]" style={{ width: 60, height: 60, background: 'linear-gradient(160deg, #e8632f, #c9491c)', boxShadow: '0 12px 30px -8px rgba(201,73,28,.55)' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M12 2.5 21 19.5 12 15.2 3 19.5 12 2.5Z" fill="#fff"/></svg>
          </div>
          <h1 className="font-extrabold text-[26px] tracking-tight" style={{ color: '#fff', letterSpacing: '-.02em' }}>Parts Pilot</h1>
          <p className="mt-1.5 text-[13.5px] font-medium" style={{ color: '#8a909c' }}>Portal de pedidos · Departamento de Piezas</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[18px] p-7 space-y-4" style={{ background: '#fff', boxShadow: '0 30px 60px -20px rgba(0,0,0,.5)' }}>
          <FormField label="Correo electrónico">
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="tu@correo.com" className={inputClass} required />
          </FormField>
          <FormField label="Contraseña">
            <div className="relative">
              <input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="••••••" className={`${inputClass} pr-10`} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9aa1ad' }}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>
          {error && (
            <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-[11px]" style={{ background: '#fdecec', color: '#dc2626' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          <button type="submit" className="w-full py-[13px] rounded-[11px] text-white font-bold text-[14.5px] transition-all hover:brightness-105" style={{ background: 'linear-gradient(160deg, #e8632f, #cf4d1d)', boxShadow: '0 10px 22px -10px rgba(201,73,28,.7)' }}>
            Iniciar sesión
          </button>
        </form>

        <p className="text-center mt-6 text-[11.5px] leading-loose" style={{ color: '#6b7280' }}>
          © 2026 Parts Pilot · Todos los derechos reservados.<br />
          Soporte: <a href="mailto:Bigio_tec@me.com" style={{ color: '#9aa0ab' }}>Bigio_tec@me.com</a>
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  VISTA ADMINISTRADOR                                                */
/* ------------------------------------------------------------------ */

function StatCard({ label, value, icon: Icon, iconBg, iconColor, chipLabel, chipBg, chipColor, highlight }) {
  return (
    <div className="rounded-[15px] p-[18px]" style={{ background: '#fff', border: `1px solid ${highlight ? '#f3d9cb' : '#e7e9ed'}` }}>
      <div className="flex items-center justify-between mb-3.5">
        <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center" style={{ background: iconBg, color: iconColor }}>
          <Icon className="w-[19px] h-[19px]" strokeWidth={1.8} />
        </div>
        {chipLabel && <span className="text-[11px] font-bold px-2 py-0.5 rounded-[7px]" style={{ background: chipBg, color: chipColor }}>{chipLabel}</span>}
      </div>
      <p className="text-[30px] font-extrabold leading-none" style={{ color: '#181b21', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em' }}>{value}</p>
      <p className="text-[12.5px] font-medium mt-1.5" style={{ color: '#767d8a' }}>{label}</p>
    </div>
  );
}

function DashboardChart({ pedidos }) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: d.toLocaleDateString('es-MX', { month: 'short' }), year: d.getFullYear(), month: d.getMonth(), total: 0, entregados: 0 };
  });
  pedidos.forEach(p => {
    const d = p.fecha?.toDate ? p.fecha.toDate() : new Date(p.fecha);
    const m = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
    if (m) { m.total++; if (p.estado === 'entregado') m.entregados++; }
  });
  const max = Math.max(...months.map(m => m.total), 1);
  const H = 150;
  return (
    <div className="mt-5">
      <div className="flex items-end gap-3.5" style={{ height: H }}>
        {months.map((m, i) => {
          const totalPx = (m.total / max) * H;
          const donePx = m.total > 0 ? (m.entregados / m.total) * totalPx : 0;
          const procPx = totalPx - donePx;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              {m.total > 0 && <span className="text-[11.5px] font-bold" style={{ color: '#9aa1ad' }}>{m.total}</span>}
              <div className="w-full max-w-[46px] rounded-[7px] overflow-hidden flex flex-col justify-end" style={{ height: totalPx || 0 }}>
                {procPx > 0 && <div style={{ background: '#e8632f', height: procPx }} />}
                {donePx > 0 && <div style={{ background: '#14b8a6', height: donePx }} />}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-3.5 mt-2">
        {months.map((m, i) => <div key={i} className="flex-1 text-center text-[11.5px] font-semibold capitalize" style={{ color: '#767d8a' }}>{m.label}</div>)}
      </div>
      <div className="flex items-center gap-4 mt-3">
        <span className="flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: '#5b626e' }}><span className="w-2.5 h-2.5 rounded-[3px] inline-block" style={{ background: '#e8632f' }} />En proceso</span>
        <span className="flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: '#5b626e' }}><span className="w-2.5 h-2.5 rounded-[3px] inline-block" style={{ background: '#14b8a6' }} />Completados</span>
      </div>
    </div>
  );
}

function AdminDashboard({ pedidos, solicitudes, talleres, getTaller, onSelect, onGoToPedidos, onGoToEstimados, onGoToNuevo, onShowReporte }) {
  const total = pedidos.length;
  const enProceso = pedidos.filter(p => ['cotizando', 'pedido_fabrica', 'en_transito', 'recibido'].includes(p.estado)).length;
  const toMs = f => f?.toDate ? f.toDate().getTime() : new Date(f).getTime();
  const recientes = [...pedidos].sort((a, b) => toMs(b.fecha) - toMs(a.fecha)).slice(0, 6);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Solicitudes nuevas" value={solicitudes.length} icon={FileText} iconBg="#fdeee7" iconColor="#c9491c" chipLabel="Atención" chipBg="#fdeee7" chipColor="#c9491c" highlight />
        <StatCard label="En proceso" value={enProceso} icon={Clock} iconBg="#eef0fe" iconColor="#4f46e5" chipLabel="+2" chipBg="#eef0fe" chipColor="#4f46e5" />
        <StatCard label="Total pedidos" value={total} icon={ClipboardList} iconBg="#f1f3f5" iconColor="#5b626e" chipLabel="Año" chipBg="#f1f3f5" chipColor="#767d8a" />
        <StatCard label="Talleres activos" value={talleres.length} icon={Building2} iconBg="#e9faf7" iconColor="#0d9488" chipLabel="Todos" chipBg="#e9faf7" chipColor="#0d9488" />
      </div>

      {/* Chart + atención */}
      <div className="grid xl:grid-cols-[1.7fr_1fr] gap-4">
        <div className="rounded-[16px] p-6 border" style={{ background: '#fff', borderColor: '#e7e9ed' }}>
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: '#181b21' }}>Volumen de pedidos</h2>
              <p className="text-[12.5px]" style={{ color: '#767d8a' }}>Últimos 6 meses</p>
            </div>
          </div>
          <DashboardChart pedidos={[...pedidos, ...solicitudes]} />
        </div>

        <div className="rounded-[16px] p-6 border flex flex-col" style={{ background: '#fff', borderColor: '#e7e9ed' }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[15px] font-bold" style={{ color: '#181b21' }}>Requiere atención</h2>
            {solicitudes.length > 0 && <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-[7px]" style={{ background: '#fdeee7', color: '#c9491c' }}>{solicitudes.length}</span>}
          </div>
          <p className="text-[12.5px] mb-3" style={{ color: '#767d8a' }}>Solicitudes esperando estimado</p>
          <div className="flex flex-col gap-2.5 flex-1">
            {solicitudes.slice(0, 3).map(p => (
              <button key={p.id} onClick={() => onSelect(p.id)} className="w-full text-left rounded-[12px] p-3 flex gap-2.5 items-center border transition-colors hover:border-[#e8632f] hover:bg-white" style={{ background: '#fbfbfc', borderColor: '#ebedf0' }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{ background: '#e8632f' }} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold truncate" style={{ color: '#181b21' }}>{p.vehiculo}</div>
                  <div className="text-[11.5px] truncate" style={{ color: '#767d8a' }}>{getTaller(p.tallerId)?.nombre} · {p.pieza || p.notas?.slice(0,30)}</div>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#b6bcc5' }} />
              </button>
            ))}
            {solicitudes.length === 0 && <p className="text-[13px] py-4 text-center" style={{ color: '#9aa1ad' }}>Sin solicitudes pendientes</p>}
          </div>
          <button onClick={onGoToEstimados} className="mt-3 w-full py-[9px] rounded-[10px] text-[12.5px] font-semibold border transition-colors hover:bg-stone-50" style={{ borderColor: '#e3e5ea', color: '#4a505c' }}>Ver todos los estimados</button>
        </div>
      </div>

      {/* Tabla recientes */}
      <div className="rounded-[16px] overflow-hidden border" style={{ background: '#fff', borderColor: '#e7e9ed' }}>
        <div className="flex items-center justify-between px-6 py-[18px]">
          <h2 className="text-[15px] font-bold" style={{ color: '#181b21' }}>Pedidos recientes</h2>
          <button onClick={onGoToPedidos} className="flex items-center gap-1 text-[13px] font-bold transition-colors hover:opacity-80" style={{ color: '#c9491c' }}>Ver todos <ChevronRight className="w-4 h-4" /></button>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderTop: '1px solid #eef0f2' }}>
              {['Folio','Taller','Vehículo / Pieza','Estado','Fecha'].map((h, i) => (
                <th key={h} className={`text-left py-3 text-[10.5px] font-bold uppercase ${i === 0 ? 'px-6' : 'px-3'} ${i === 4 ? 'text-right pr-6' : ''} ${i >= 2 && i <= 2 ? 'hidden sm:table-cell' : ''}`} style={{ color: '#9aa1ad', letterSpacing: '.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recientes.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-sm" style={{ color: '#9aa1ad' }}>Sin pedidos aún.</td></tr>}
            {recientes.map(p => (
              <tr key={p.id} onClick={() => onSelect(p.id)} className="cursor-pointer transition-colors hover:bg-[#fafbfc]" style={{ borderTop: '1px solid #f1f2f4', background: hasNewActivity('admin', p) ? '#fff8f5' : undefined }}>

                <td className="py-3.5 px-6 font-mono text-[12.5px] font-semibold whitespace-nowrap" style={{ color: '#181b21' }}>{p.folio || p.id.slice(0,8)}</td>
                <td className="py-3.5 px-3 text-[13px] max-w-[150px] truncate" style={{ color: '#4a505c' }}>{getTaller(p.tallerId)?.nombre || '—'}</td>
                <td className="py-3.5 px-3 hidden sm:table-cell">
                  <div className="text-[13px] font-semibold" style={{ color: '#181b21' }}>{p.vehiculo || '—'}</div>
                  {p.pieza && <div className="text-[11.5px]" style={{ color: '#8a909c' }}>{p.pieza}</div>}
                </td>
                <td className="py-3.5 px-3"><StatusBadge estado={p.estado} /></td>
                <td className="py-3.5 pr-6 text-right text-[12.5px] whitespace-nowrap" style={{ color: '#8a909c' }}>{formatDate(p.fecha)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminPedidos({ pedidos, talleres, getTaller, filterTaller, setFilterTaller, filterEstado, setFilterEstado, search, setSearch, onSelect, onExport }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por vehículo, referencia o folio..." className={`${inputClass} pl-9`} />
        </div>
        <select value={filterTaller} onChange={e => setFilterTaller(e.target.value)} className={`${inputClass} bg-white sm:w-56`}>
          <option value="todos">Todos los talleres</option>
          {talleres.map(t => <option key={t.uid} value={t.uid}>{t.nombre}</option>)}
        </select>
        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className={`${inputClass} bg-white sm:w-52`}>
          <option value="todos">Todos los estados</option>
          {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
        <button onClick={onExport} className="flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex-shrink-0">
          <Printer className="w-4 h-4" /> Reporte
        </button>
      </div>

      {pedidos.length === 0 ? (
        <EmptyState text="No hay pedidos que coincidan con los filtros." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {pedidos.map(p => <OrderCard key={p.id} order={p} taller={getTaller(p.tallerId)} showTaller onClick={() => onSelect(p.id)} activityRole="admin" />)}
        </div>
      )}
    </div>
  );
}

function TallerSubUsuarios({ tallerId, usuarios, onCrear, onEliminar, onActualizar }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const miembros = usuarios.filter(u => u.tallerId === tallerId);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.password) return;
    setSaving(true); setError('');
    try {
      await onCrear(tallerId, { nombre: form.nombre.trim(), email: form.email.trim(), password: form.password });
      setForm({ nombre: '', email: '', password: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use' ? 'Ese correo ya está registrado.' : 'Error: ' + err.message);
    } finally { setSaving(false); }
  };

  const handleSaveEdit = async (uid) => {
    if (!editNombre.trim()) return;
    setSaving(true);
    try {
      await onActualizar(uid, { nombre: editNombre.trim() });
      setEditId(null);
    } finally { setSaving(false); }
  };

  return (
    <div className="mt-3 pt-3" style={{ borderTop: '1px dashed #e7e9ed' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase" style={{ color: '#9aa1ad', letterSpacing: '.06em' }}>
          Usuarios ({miembros.length + 1})
        </span>
        <button onClick={() => { setShowForm(s => !s); setError(''); setEditId(null); }}
          className="flex items-center gap-1 text-[11.5px] font-semibold hover:opacity-80 transition-opacity"
          style={{ color: '#e8632f' }}>
          <Plus className="w-3 h-3" strokeWidth={2.5} /> Agregar
        </button>
      </div>

      {/* Cuenta principal */}
      <div className="flex items-center gap-2 py-1.5 px-2 rounded-[8px] mb-1" style={{ background: '#f8f9fa' }}>
        <div className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: 'linear-gradient(150deg, #e8632f, #c9491c)', color: '#fff' }}>P</div>
        <span className="text-[12px] font-semibold flex-1" style={{ color: '#181b21' }}>Cuenta principal</span>
        <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-[6px]" style={{ background: '#fdeee7', color: '#c9491c' }}>Admin taller</span>
      </div>

      {/* Sub-usuarios */}
      {miembros.map(u => (
        <div key={u.uid} className="mb-1">
          {editId === u.uid ? (
            /* Edición inline */
            <div className="flex items-center gap-2 py-1.5 px-2 rounded-[8px]" style={{ background: '#fff', border: '1px solid #e8632f' }}>
              <input
                value={editNombre}
                onChange={e => setEditNombre(e.target.value)}
                className="flex-1 text-[12px] px-2 py-1 rounded-[7px] border outline-none focus:border-[#e8632f]"
                style={{ borderColor: '#e3e5ea' }}
                autoFocus
              />
              <button onClick={() => handleSaveEdit(u.uid)} disabled={saving} className="w-6 h-6 rounded-[6px] flex items-center justify-center text-white text-[11px] font-bold" style={{ background: '#10b981' }}>✓</button>
              <button onClick={() => setEditId(null)} className="w-6 h-6 rounded-[6px] flex items-center justify-center border text-[11px]" style={{ borderColor: '#e3e5ea', color: '#5b626e' }}>✕</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-1.5 px-2 rounded-[8px]" style={{ background: '#f8f9fa' }}>
              <div className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: 'linear-gradient(150deg, #f3f4f6, #e8eaed)', color: '#4a505c' }}>
                {(u.nombre || u.email || '?')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold truncate" style={{ color: '#181b21' }}>{u.nombre}</div>
                <div className="text-[11px] truncate" style={{ color: '#8a909c' }}>{u.email}</div>
              </div>
              <button onClick={() => { setEditId(u.uid); setEditNombre(u.nombre || ''); }}
                className="w-6 h-6 rounded-[6px] flex items-center justify-center hover:bg-[#fdeee7] transition-colors flex-shrink-0" style={{ color: '#aab0b9' }}>
                <Pencil className="w-3 h-3" />
              </button>
              <button onClick={() => { if (window.confirm(`¿Eliminar a ${u.nombre}?`)) onEliminar(u.uid); }}
                className="w-6 h-6 rounded-[6px] flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0" style={{ color: '#aab0b9' }}>
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Formulario nuevo sub-usuario */}
      {showForm && (
        <form onSubmit={handleCreate} className="mt-2 p-3 rounded-[11px] space-y-2 border" style={{ background: '#fff', borderColor: '#e7e9ed' }}>
          <p className="text-[11.5px] font-bold" style={{ color: '#181b21' }}>Nuevo usuario</p>
          <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre" className={inputClass} required />
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Correo electrónico" className={inputClass} required />
          <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Contraseña (mín. 6)" className={inputClass} required minLength={6} />
          {error && <p className="text-[12px] px-3 py-2 rounded-[9px]" style={{ background: '#fdecec', color: '#dc2626' }}>{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-[9px] text-white text-[12.5px] font-bold hover:brightness-105 disabled:opacity-60" style={{ background: 'linear-gradient(160deg, #e8632f, #cf4d1d)' }}>
              {saving ? 'Creando…' : 'Crear usuario'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="px-3 py-2 rounded-[9px] border text-[12.5px] font-semibold hover:bg-stone-50" style={{ borderColor: '#e3e5ea', color: '#5b626e' }}>✕</button>
          </div>
        </form>
      )}
    </div>
  );
}

function AdminTalleres({ talleres, pedidos, tallerUsuarios, onVerPedidos, onCreateTaller, onDeleteTaller, onUpdateTaller, onCrearSubUsuario, onEliminarSubUsuario, onActualizarSubUsuario }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', contacto: '', telefono: '', email: '', usuario: '', password: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const handleEditChange = (field, value) => setEditForm(f => ({ ...f, [field]: value }));

  const startEdit = (t) => {
    setEditingId(t.uid);
    setEditForm({ nombre: t.nombre || '', contacto: t.contacto || '', telefono: t.telefono || '', email: t.email || '', usuario: t.usuario || '' });
    setEditError('');
  };

  const handleUpdate = async () => {
    if (!editForm.nombre.trim()) return;
    setEditSaving(true);
    setEditError('');
    try {
      await onUpdateTaller(editingId, editForm);
      setEditingId(null);
    } catch (err) {
      setEditError('Error al actualizar: ' + err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const generarPassword = () => {
    handleChange('password', Math.random().toString(36).slice(-8));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    const usuario = form.usuario.trim().toLowerCase();
    if (usuario && talleres.some(t => t.usuario?.toLowerCase() === usuario)) {
      setError('Ese usuario ya existe, elige otro.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onCreateTaller({ ...form, usuario });
      setForm({ nombre: '', contacto: '', telefono: '', email: '', usuario: '', password: '' });
      setShowForm(false);
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Ese correo ya está registrado. Usa otro correo.');
      } else if (err.code === 'permission-denied') {
        setError('Sin permisos para crear talleres. Verifica las reglas de Firestore.');
      } else {
        setError('Error al crear el taller: ' + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const initials = (n) => (n || '').split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold" style={{ color: '#181b21' }}>Talleres registrados</h2>
          <p className="text-[12.5px]" style={{ color: '#767d8a' }}>{talleres.length} taller{talleres.length !== 1 ? 'es' : ''} en el sistema</p>
        </div>
        <button
          onClick={() => { setShowForm(s => !s); setError(''); }}
          className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold text-white transition-colors hover:brightness-105"
          style={{ background: 'linear-gradient(160deg, #e8632f, #cf4d1d)', boxShadow: '0 8px 18px -8px rgba(201,73,28,.5)' }}
        >
          <Plus className="w-4 h-4" strokeWidth={2.2} /> Nuevo taller
        </button>
      </div>

      {done && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-[11px] text-[13px] font-semibold" style={{ background: '#eafaf2', color: '#059669' }}>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Taller registrado correctamente.
        </div>
      )}

      {/* Formulario nuevo taller */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-[16px] p-6 border space-y-4" style={{ background: '#fff', borderColor: '#e7e9ed' }}>
          <p className="text-[14px] font-bold" style={{ color: '#181b21' }}>Nuevo taller</p>
          <FormField label="Nombre del taller">
            <input value={form.nombre} onChange={e => handleChange('nombre', e.target.value)} placeholder="ej. Hojalatería y Pintura Martínez" className={inputClass} required />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Contacto">
              <input value={form.contacto} onChange={e => handleChange('contacto', e.target.value)} placeholder="Nombre del encargado" className={inputClass} />
            </FormField>
            <FormField label="Teléfono">
              <input value={form.telefono} onChange={e => handleChange('telefono', e.target.value)} placeholder="555-000-0000" className={inputClass} />
            </FormField>
          </div>
          <FormField label="Correo electrónico">
            <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="ej. taller@correo.com" className={inputClass} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Usuario (opcional)">
              <input value={form.usuario} onChange={e => handleChange('usuario', e.target.value)} placeholder="ej. martinez" className={`${inputClass} font-mono`} />
            </FormField>
            <FormField label="Contraseña (opcional)">
              <div className="flex gap-2">
                <input value={form.password} onChange={e => handleChange('password', e.target.value)} placeholder="••••••" className={`${inputClass} font-mono`} />
                <button type="button" onClick={generarPassword} className="px-3 rounded-[11px] border text-[12px] font-semibold whitespace-nowrap transition-colors hover:bg-stone-50" style={{ borderColor: '#e3e5ea', color: '#5b626e' }}>
                  Generar
                </button>
              </div>
            </FormField>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-[13px] px-3 py-2.5 rounded-[11px]" style={{ background: '#fdecec', color: '#dc2626' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="flex-1 py-[11px] rounded-[11px] text-white font-bold text-[13.5px] transition-all hover:brightness-105 disabled:opacity-60" style={{ background: 'linear-gradient(160deg, #e8632f, #cf4d1d)' }}>
              {saving ? 'Creando…' : 'Crear taller'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="px-5 py-[11px] rounded-[11px] border text-[13.5px] font-semibold transition-colors hover:bg-stone-50" style={{ borderColor: '#e3e5ea', color: '#5b626e' }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Grid de talleres */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {talleres.map(t => {
          const pedidosTaller = pedidos.filter(p => p.tallerId === t.uid);
          const activos = pedidosTaller.filter(p => p.estado !== 'entregado').length;

          if (editingId === t.uid) {
            return (
              <div key={t.uid} className="rounded-[15px] border p-5 space-y-3" style={{ background: '#fff', borderColor: '#e8632f', boxShadow: '0 0 0 3px rgba(232,99,47,.08)' }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[13.5px] font-bold" style={{ color: '#181b21' }}>Editar taller</p>
                  <button onClick={() => setEditingId(null)} className="w-7 h-7 rounded-[7px] flex items-center justify-center hover:bg-stone-100 transition-colors" style={{ color: '#9aa1ad' }}><X className="w-4 h-4" /></button>
                </div>
                <FormField label="Nombre"><input value={editForm.nombre} onChange={e => handleEditChange('nombre', e.target.value)} className={inputClass} /></FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Contacto"><input value={editForm.contacto} onChange={e => handleEditChange('contacto', e.target.value)} className={inputClass} /></FormField>
                  <FormField label="Teléfono"><input value={editForm.telefono} onChange={e => handleEditChange('telefono', e.target.value)} className={inputClass} /></FormField>
                </div>
                <FormField label="Correo"><input type="email" value={editForm.email} onChange={e => handleEditChange('email', e.target.value)} className={inputClass} /></FormField>
                <FormField label="Usuario"><input value={editForm.usuario} onChange={e => handleEditChange('usuario', e.target.value)} className={`${inputClass} font-mono`} /></FormField>
                {editError && <div className="flex items-center gap-2 text-[13px] px-3 py-2 rounded-[11px]" style={{ background: '#fdecec', color: '#dc2626' }}><AlertCircle className="w-4 h-4 flex-shrink-0" />{editError}</div>}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleUpdate} disabled={editSaving} className="flex-1 py-[10px] rounded-[11px] text-white text-[13px] font-bold transition-all hover:brightness-105 disabled:opacity-60" style={{ background: 'linear-gradient(160deg, #e8632f, #cf4d1d)' }}>
                    {editSaving ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button onClick={() => setEditingId(null)} className="px-4 py-[10px] rounded-[11px] border text-[13px] font-semibold transition-colors hover:bg-stone-50" style={{ borderColor: '#e3e5ea', color: '#5b626e' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={t.uid} className="rounded-[15px] border p-[18px]" style={{ background: '#fff', borderColor: '#e7e9ed' }}>
              {/* Cabecera */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[15px] font-extrabold flex-shrink-0" style={{ background: 'linear-gradient(150deg, #f3f4f6, #e8eaed)', color: '#4a505c' }}>
                  {initials(t.nombre)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-bold truncate" style={{ color: '#181b21' }}>{t.nombre}</h3>
                  <p className="text-[12px]" style={{ color: '#8a909c' }}>{t.contacto}</p>
                </div>
              </div>

              {/* Datos de contacto */}
              <div className="space-y-1.5 mb-4">
                {t.telefono && (
                  <p className="flex items-center gap-2 text-[12.5px]" style={{ color: '#5b626e' }}>
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#aab0b9' }} />{t.telefono}
                  </p>
                )}
                {t.email && (
                  <p className="flex items-center gap-2 text-[12.5px] truncate" style={{ color: '#5b626e' }}>
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#aab0b9' }} />{t.email}
                  </p>
                )}
              </div>

              {/* Pie */}
              <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px dashed #e7e9ed' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11.5px]" style={{ color: '#8a909c' }}>
                    Usuario: <span className="font-mono font-semibold" style={{ color: '#5b626e' }}>{t.usuario || '—'}</span>
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[7px]" style={{ background: activos > 0 ? '#fef6e9' : '#f1f3f5', color: activos > 0 ? '#b7791f' : '#767d8a' }}>
                    {activos} activos
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => onVerPedidos(t.uid)} className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-[12px] font-bold transition-colors hover:bg-[#fdeee7]" style={{ color: '#c9491c' }}>
                    Ver <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => startEdit(t)} className="w-7 h-7 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[#fdeee7] hover:text-[#e8632f]" style={{ color: '#aab0b9' }} title="Editar">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { if (window.confirm(`¿Eliminar el taller "${t.nombre}"? Esta acción no se puede deshacer.`)) onDeleteTaller(t.uid); }} className="w-7 h-7 rounded-[8px] flex items-center justify-center transition-colors hover:bg-red-50 hover:text-red-500" style={{ color: '#aab0b9' }} title="Eliminar">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sub-usuarios del taller */}
              <TallerSubUsuarios
                tallerId={t.uid}
                usuarios={tallerUsuarios}
                onCrear={onCrearSubUsuario}
                onEliminar={onEliminarSubUsuario}
                onActualizar={onActualizarSubUsuario}
              />
            </div>
          );
        })}
      </div>

      {talleres.length === 0 && !showForm && (
        <div className="text-center py-16" style={{ color: '#9aa1ad' }}>
          <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No hay talleres registrados aún.</p>
        </div>
      )}
    </div>
  );
}

function AdminNuevoPedido({ talleres, onCreate }) {
  const [form, setForm] = useState({ tallerId: talleres[0]?.uid ?? '', vehiculo: '', notas: '' });
  const [numeroPO, setNumeroPO] = useState('');
  const [numeroOrden, setNumeroOrden] = useState('');
  const [fechaPersonalizada, setFechaPersonalizada] = useState('');
  const [done, setDone] = useState(false);

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ ...form, numeroPO: numeroPO.trim(), numeroOrden: numeroOrden.trim(), fechaPersonalizada });
    setForm({ tallerId: talleres[0]?.uid ?? '', vehiculo: '', notas: '' });
    setNumeroPO('');
    setNumeroOrden('');
    setFechaPersonalizada('');
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="font-semibold text-stone-900 mb-1 text-lg">Registrar nuevo pedido</h2>
      <p className="text-sm text-stone-500 mb-4">Crea el folio a nombre de un taller. Aparecerá de inmediato en su portal.</p>
      {done && (
        <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Pedido registrado correctamente.
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-5 space-y-4">
        <FormField label="Taller">
          <select value={form.tallerId} onChange={e => handleChange('tallerId', e.target.value)} className={`${inputClass} bg-white`} required>
            {talleres.map(t => <option key={t.uid} value={t.uid}>{t.nombre}</option>)}
          </select>
        </FormField>
        <FormField label="Vehículo">
          <input value={form.vehiculo} onChange={e => handleChange('vehiculo', e.target.value)} placeholder="ej. Toyota Corolla 2020" className={inputClass} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="No. PO (opcional)">
            <input value={numeroPO} onChange={e => setNumeroPO(e.target.value)} placeholder="ej. 48213" className={inputClass} />
          </FormField>
          <FormField label="No. Orden (opcional)">
            <input value={numeroOrden} onChange={e => setNumeroOrden(e.target.value)} placeholder="ej. T-7890" className={inputClass} />
          </FormField>
        </div>
        <FormField label="Notas (opcional)">
          <textarea value={form.notas} onChange={e => handleChange('notas', e.target.value)} rows={3} placeholder="Detalles adicionales..." className={`${inputClass} resize-none`} />
        </FormField>
        <FormField label="Fecha del pedido (opcional)">
          <input type="date" value={fechaPersonalizada} onChange={e => setFechaPersonalizada(e.target.value)} className={inputClass} />
          <p className="text-xs text-stone-400 mt-1">Vacío = fecha de hoy. Útil para importar órdenes antiguas.</p>
        </FormField>
        <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition-colors">
          Registrar pedido
        </button>
      </form>
    </div>
  );
}

function AdminNuevaCotizacion({ talleres, onCreate }) {
  const [form, setForm] = useState({ tallerId: talleres[0]?.uid ?? '', vehiculo: '', notas: '' });
  const [numeroPO, setNumeroPO] = useState('');
  const [numeroOrden, setNumeroOrden] = useState('');
  const [fechaPersonalizada, setFechaPersonalizada] = useState('');
  const [notasEstimado, setNotasEstimado] = useState('');
  const [archivoEstimado, setArchivoEstimado] = useState(null);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivoEstimado({ name: file.name, type: file.type, url: URL.createObjectURL(file), file });
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await onCreate({ ...form, numeroPO: numeroPO.trim(), numeroOrden: numeroOrden.trim(), fechaPersonalizada, notasEstimado, archivoEstimado });
      setForm({ tallerId: talleres[0]?.uid ?? '', vehiculo: '', notas: '' });
      setNumeroPO('');
      setNumeroOrden('');
      setFechaPersonalizada('');
      setNotasEstimado('');
      setArchivoEstimado(null);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      setError('Error al crear: ' + (err.message || err.code));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="font-semibold text-stone-900 mb-1 text-lg">Nueva cotización</h2>
      <p className="text-sm text-stone-500 mb-4">Crea una cotización con estimado incluido. Aparecerá en el portal del taller para que la acepte o rechace.</p>
      {done && (
        <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Cotización creada y enviada al taller.
        </div>
      )}
      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-5 space-y-4">
        <FormField label="Taller">
          <select value={form.tallerId} onChange={e => handleChange('tallerId', e.target.value)} className={`${inputClass} bg-white`} required>
            {talleres.map(t => <option key={t.uid} value={t.uid}>{t.nombre}</option>)}
          </select>
        </FormField>
        <FormField label="Vehículo">
          <input value={form.vehiculo} onChange={e => handleChange('vehiculo', e.target.value)} placeholder="ej. Toyota Corolla 2020" className={inputClass} required />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="No. PO (opcional)">
            <input value={numeroPO} onChange={e => setNumeroPO(e.target.value)} placeholder="ej. 48213" className={inputClass} />
          </FormField>
          <FormField label="No. Orden (opcional)">
            <input value={numeroOrden} onChange={e => setNumeroOrden(e.target.value)} placeholder="ej. T-7890" className={inputClass} />
          </FormField>
        </div>
        <FormField label="Notas de la cotización">
          <textarea value={notasEstimado} onChange={e => setNotasEstimado(e.target.value)} rows={3} placeholder="Precio, tiempo de entrega, condiciones..." className={`${inputClass} resize-none`} />
        </FormField>
        <FormField label="PDF del estimado (opcional)">
          {archivoEstimado ? (
            <div className="flex items-center justify-between gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
              <a href={archivoEstimado.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-stone-700 truncate hover:underline">
                <FileText className="w-4 h-4 flex-shrink-0" /><span className="truncate">{archivoEstimado.name}</span>
              </a>
              <button type="button" onClick={() => setArchivoEstimado(null)} className="text-stone-400 hover:text-red-500 flex-shrink-0"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 border border-dashed border-stone-300 rounded-lg px-3 py-2.5 text-sm text-stone-500 hover:border-orange-300 hover:text-orange-600 cursor-pointer transition-colors bg-white">
              <Paperclip className="w-4 h-4" /> Adjuntar PDF
              <input type="file" accept="application/pdf" onChange={handleFile} className="hidden" />
            </label>
          )}
        </FormField>
        <FormField label="Notas internas (opcional)">
          <textarea value={form.notas} onChange={e => handleChange('notas', e.target.value)} rows={2} placeholder="Observaciones adicionales..." className={`${inputClass} resize-none`} />
        </FormField>
        <FormField label="Fecha del pedido (opcional)">
          <input type="date" value={fechaPersonalizada} onChange={e => setFechaPersonalizada(e.target.value)} className={inputClass} />
          <p className="text-xs text-stone-400 mt-1">Vacío = fecha de hoy. Útil para importar órdenes antiguas.</p>
        </FormField>
        <button type="submit" disabled={sending} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
          <Send className="w-4 h-4" /> {sending ? 'Creando…' : 'Crear y enviar cotización'}
        </button>
      </form>
    </div>
  );
}

function AdminOrderDetail({ order, taller, onChangeStatus, onSendEstimate, onDeleteOrder, onUpdateNotes, onUpdateReferencias }) {
  // Estado local — nada se guarda hasta presionar "Actualizar"
  const [estado, setEstado]             = useState(order.estado);
  const [fechaEntrega, setFechaEntrega] = useState(order.fechaEntrega || '');
  const [numeroPO, setNumeroPO]         = useState(order.numeroPO ?? '');
  const [numeroOrden, setNumeroOrden]   = useState(order.numeroOrden ?? '');
  const [notasInt, setNotasInt]         = useState(order.notasInternas ?? '');
  // Estimado (sección separada)
  const [notasEstimado, setNotasEstimado] = useState(order.estimado?.notas ?? '');
  const [archivo, setArchivo]           = useState(order.estimado?.archivo ?? null);
  // UI state
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [sending, setSending]           = useState(false);
  const [sent, setSent]                 = useState(false);
  const [sendError, setSendError]       = useState('');
  const [showEmail, setShowEmail]       = useState(false);
  const [copied, setCopied]             = useState(false);

  // Sincroniza estado local cuando se abre un pedido diferente
  useEffect(() => {
    setEstado(order.estado);
    setFechaEntrega(order.fechaEntrega || '');
    setNumeroPO(order.numeroPO ?? '');
    setNumeroOrden(order.numeroOrden ?? '');
    setNotasInt(order.notasInternas ?? '');
    setNotasEstimado(order.estimado?.notas ?? '');
    setArchivo(order.estimado?.archivo ?? null);
  }, [order.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Botón único — guarda estado, fecha, PO, orden y notas de una vez
  const handleActualizar = async () => {
    setSaving(true);
    try {
      await onChangeStatus(order.id, estado, fechaEntrega || undefined);
      await onUpdateReferencias(order.id, { numeroPO: numeroPO.trim(), numeroOrden: numeroOrden.trim() });
      await onUpdateNotes(order.id, notasInt);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  };

  const handleSendEstimate = async () => {
    setSending(true); setSendError('');
    try {
      await onSendEstimate(order.id, { notas: notasEstimado, archivo });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      setSendError('Error al enviar: ' + (err.message || err.code));
    } finally { setSending(false); }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivo({ name: file.name, type: file.type, url: URL.createObjectURL(file), file });
    e.target.value = '';
  };

  const buildEmailContent = () => {
    const subject = `Estimado · ${order.referencia || order.vehiculo}`;
    const lineas = [`Hola ${taller.contacto || ''},`, '', `Te compartimos el estimado para tu pedido (${order.vehiculo}):`, ''];
    if (notasEstimado) lineas.push(`Notas: ${notasEstimado}`);
    lineas.push('', 'Puedes ver el detalle completo, fotos y archivos desde Parts Pilot.');
    if (archivo) lineas.push('', `No olvides adjuntar el PDF "${archivo.name}" a este correo.`);
    lineas.push('', 'Saludos.');
    return { subject, body: lineas.join('\n') };
  };

  const handleCopyEmail = () => {
    const { subject, body } = buildEmailContent();
    navigator.clipboard.writeText(`Para: ${taller.email}\nAsunto: ${subject}\n\n${body}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="space-y-4">
      {/* Taller + estado actual */}
      <div className="flex items-center gap-3 rounded-[13px] p-3" style={{ background: '#f8f9fa' }}>
        <div className="w-10 h-10 rounded-[10px] border flex items-center justify-center font-bold text-[14px] flex-shrink-0" style={{ background: '#fff', borderColor: '#e7e9ed', color: '#4a505c' }}>
          {(taller?.nombre || '?').split(' ').filter(w => w.length > 2).slice(0,2).map(w => w[0]).join('').toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-bold truncate" style={{ color: '#181b21' }}>{taller?.nombre}</div>
          <div className="text-[12px]" style={{ color: '#8a909c' }}>{taller?.contacto}</div>
        </div>
        <StatusBadge estado={estado} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ── Columna izquierda ── */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <InfoItem label="Fecha" value={formatDate(order.fecha)} />
            <InfoItem label="Folio" value={order.folio || order.id.slice(0,8)} />
          </div>

          <FormField label="Estado del pedido">
            <select value={estado} onChange={e => setEstado(e.target.value)} className={`${inputClass} bg-white`}>
              {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
            </select>
          </FormField>

          {['pedido_fabrica','ordenadas','esperando_piezas','en_transito','recibido','entregado'].includes(estado) && (
            <FormField label="Fecha estimada de entrega">
              <input type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} className={inputClass} />
              {fechaEntrega && <p className="text-[11px] mt-1" style={{ color: '#2563eb' }}>El taller verá esta fecha en su portal.</p>}
            </FormField>
          )}

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
            <FormField label="No. PO"><input value={numeroPO} onChange={e => setNumeroPO(e.target.value)} placeholder="ej. 48213" className={inputClass} /></FormField>
            <FormField label="No. Orden"><input value={numeroOrden} onChange={e => setNumeroOrden(e.target.value)} placeholder="ej. T-7890" className={inputClass} /></FormField>
          </div>

          {order.notas && (
            <div className="rounded-[12px] p-3" style={{ background: '#fef9ec', border: '1px solid #f6ead0' }}>
              <p className="text-[10.5px] font-bold uppercase mb-1" style={{ color: '#b7791f', letterSpacing: '.05em' }}>Notas del taller</p>
              <p className="text-[13px] leading-relaxed" style={{ color: '#7c5a14' }}>{order.notas}</p>
            </div>
          )}

          {order.archivo && (
            <div className="rounded-[12px] p-3" style={{ background: '#f8f9fa' }}>
              <p className="text-[10.5px] font-bold uppercase mb-2" style={{ color: '#9aa1ad', letterSpacing: '.05em' }}>Archivo del taller</p>
              {order.archivo.type?.startsWith('image/') || order.archivo.url?.match(/\.(jpg|jpeg|png|webp|gif)/i) ? (
                <a href={order.archivo.url} target="_blank" rel="noreferrer"><img src={order.archivo.url} alt={order.archivo.name} className="rounded-lg max-h-36 object-cover" style={{ border: '1px solid #e7e9ed' }} /></a>
              ) : (
                <a href={order.archivo.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-[10px] px-3 py-2 text-[13px] border transition-colors hover:border-[#e8632f] hover:text-[#c9491c]" style={{ background: '#fff', borderColor: '#e7e9ed', color: '#4a505c' }}>
                  <FileText className="w-4 h-4 flex-shrink-0" /><span className="truncate">{order.archivo.name}</span>
                </a>
              )}
            </div>
          )}

          <div className="rounded-[12px] p-3" style={{ background: '#f8f9fa' }}>
            <p className="text-[10.5px] font-bold uppercase mb-3" style={{ color: '#9aa1ad', letterSpacing: '.06em' }}>Progreso</p>
            <StatusStepper estado={estado} />
          </div>

          <div className="rounded-[12px] p-3" style={{ background: '#f8f9fa' }}>
            <p className="text-[10.5px] font-bold uppercase mb-2 flex items-center gap-1.5" style={{ color: '#9aa1ad', letterSpacing: '.05em' }}>
              <StickyNote className="w-3.5 h-3.5" /> Notas internas
            </p>
            <textarea value={notasInt} onChange={e => setNotasInt(e.target.value)} placeholder="Solo visibles para el admin…" rows={3}
              className="w-full text-[13px] rounded-[10px] p-2.5 resize-none border outline-none focus:ring-2 focus:ring-[#e8632f]/10 focus:border-[#e8632f]"
              style={{ background: '#fff', borderColor: '#e3e5ea', color: '#181b21' }} />
          </div>

          {saved && <div className="flex items-center gap-2 px-3 py-2.5 rounded-[11px] text-[13px] font-semibold" style={{ background: '#eafaf2', color: '#059669' }}><CheckCircle2 className="w-4 h-4" /> Cambios guardados.</div>}
          <button onClick={handleActualizar} disabled={saving} className="w-full py-[13px] rounded-[11px] text-white font-bold text-[14px] hover:brightness-105 disabled:opacity-60 transition-all" style={{ background: 'linear-gradient(160deg, #e8632f, #cf4d1d)', boxShadow: '0 8px 18px -8px rgba(201,73,28,.5)' }}>
            {saving ? 'Guardando…' : 'Actualizar'}
          </button>
        </div>

        {/* ── Columna derecha: Estimado ── */}
        <div className="space-y-3">
          <div className="rounded-[13px] p-4 space-y-3 border" style={{ borderColor: '#e7e9ed' }}>
            <p className="text-[10.5px] font-bold uppercase flex items-center gap-1.5" style={{ color: '#9aa1ad', letterSpacing: '.05em' }}>
              <Send className="w-3.5 h-3.5" /> Estimado
            </p>
            {order.estimado?.respuesta === 'pendiente' && <div className="flex items-center gap-2 text-[13px] px-3 py-2 rounded-[10px]" style={{ background: '#fef6e9', color: '#b7791f' }}><Clock className="w-4 h-4 flex-shrink-0" /> Esperando respuesta del taller…</div>}
            {order.estimado?.respuesta && order.estimado.respuesta !== 'pendiente' && (
              <div className="flex items-center gap-2 text-[13px] px-3 py-2 rounded-[10px]" style={{ background: order.estimado.respuesta === 'aceptado' ? '#eafaf2' : '#fdecec', color: order.estimado.respuesta === 'aceptado' ? '#059669' : '#dc2626' }}>
                {order.estimado.respuesta === 'aceptado' ? <ThumbsUp className="w-4 h-4 flex-shrink-0" /> : <ThumbsDown className="w-4 h-4 flex-shrink-0" />}
                El taller {order.estimado.respuesta === 'aceptado' ? 'aceptó' : 'rechazó'} este estimado.
              </div>
            )}
            {sent && <div className="flex items-center gap-2 text-[13px] px-3 py-2 rounded-[10px]" style={{ background: '#eafaf2', color: '#059669' }}><CheckCircle2 className="w-4 h-4" /> Estimado enviado.</div>}
            {sendError && <div className="flex items-center gap-2 text-[13px] px-3 py-2 rounded-[10px]" style={{ background: '#fdecec', color: '#dc2626' }}><AlertCircle className="w-4 h-4" />{sendError}</div>}
            <FormField label="Notas para el taller">
              <textarea value={notasEstimado} onChange={e => setNotasEstimado(e.target.value)} rows={3} placeholder="Tiempo de entrega, condiciones, precio…" className={`${inputClass} resize-none`} />
            </FormField>
            <FormField label="PDF del estimado (opcional)">
              {archivo ? (
                <div className="flex items-center justify-between gap-2 rounded-[10px] px-3 py-2 border" style={{ background: '#fff', borderColor: '#e7e9ed' }}>
                  <a href={archivo.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[13px] truncate hover:underline" style={{ color: '#4a505c' }}>
                    <FileText className="w-4 h-4 flex-shrink-0" /><span className="truncate">{archivo.name}</span>
                  </a>
                  <button type="button" onClick={() => setArchivo(null)} style={{ color: '#aab0b9' }}><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border-dashed border rounded-[10px] px-3 py-2.5 text-[13px] cursor-pointer transition-colors hover:border-[#e8632f] hover:text-[#c9491c]" style={{ borderColor: '#d3d6db', color: '#8a909c' }}>
                  <Paperclip className="w-4 h-4" /> Adjuntar PDF
                  <input type="file" accept="application/pdf" onChange={handleFile} className="hidden" />
                </label>
              )}
            </FormField>
            <button onClick={handleSendEstimate} disabled={sending} className="w-full py-[11px] rounded-[11px] text-white font-bold text-[13px] hover:brightness-105 disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: '#181b21' }}>
              <Send className="w-4 h-4" /> {sending ? 'Enviando…' : order.estimado ? 'Actualizar estimado' : 'Enviar estimado al taller'}
            </button>
          </div>

          {taller?.email && (
            <div className="space-y-2">
              <button type="button" onClick={() => setShowEmail(v => !v)} className="w-full py-[9px] rounded-[10px] text-[13px] font-semibold border flex items-center justify-center gap-2 hover:bg-stone-50 transition-colors" style={{ borderColor: '#e3e5ea', color: '#5b626e' }}>
                <Mail className="w-4 h-4" /> Correo a {taller.email}
              </button>
              {showEmail && (() => {
                const subject = `Estimado · ${order.referencia || order.vehiculo}`;
                const body = [`Hola ${taller.contacto || ''},`, '', `Estimado para: ${order.vehiculo}`, notasEstimado ? `Notas: ${notasEstimado}` : '', '', 'Puedes verlo en Parts Pilot.', '', 'Saludos.'].filter((l, i) => !(i === 3 && !notasEstimado)).join('\n');
                return (
                  <div className="rounded-[12px] p-3 border space-y-2 text-[13px]" style={{ background: '#f8f9fa', borderColor: '#e7e9ed' }}>
                    <div><span className="font-semibold" style={{ color: '#767d8a' }}>Para: </span><span style={{ color: '#181b21' }}>{taller.email}</span></div>
                    <div><span className="font-semibold" style={{ color: '#767d8a' }}>Asunto: </span><span style={{ color: '#181b21' }}>{subject}</span></div>
                    <textarea readOnly value={body} rows={4} className="w-full text-[12px] rounded-[10px] p-2 resize-none outline-none border" style={{ background: '#fff', borderColor: '#e7e9ed', color: '#5b626e' }} />
                    <button type="button" onClick={() => navigator.clipboard.writeText(`Para: ${taller.email}\nAsunto: ${subject}\n\n${body}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); })} className="w-full py-2 rounded-[10px] text-white text-[13px] font-semibold flex items-center justify-center gap-2" style={{ background: '#181b21' }}>
                      {copied ? <><CheckCircle2 className="w-4 h-4" /> ¡Copiado!</> : <><Paperclip className="w-4 h-4" /> Copiar correo</>}
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          <button type="button" onClick={() => { if (window.confirm('¿Eliminar este pedido? Esta acción no se puede deshacer.')) onDeleteOrder(order.id); }}
            className="w-full flex items-center justify-center gap-2 text-[13px] py-2.5 rounded-[10px] border border-dashed transition-colors hover:bg-red-50 hover:text-red-500" style={{ color: '#aab0b9', borderColor: '#f0b8b8' }}>
            <Trash2 className="w-4 h-4" /> Eliminar pedido
          </button>
        </div>
      </div>
    </div>
  );
}

function ReporteModal({ pedidos, talleres, onClose }) {
  const ACTIVOS = ['pendiente', 'cotizando', 'pedido_fabrica', 'en_transito', 'recibido'];
  const activos = [...pedidos]
    .filter(p => ACTIVOS.includes(p.estado))
    .sort((a, b) => {
      const t = f => f?.toDate ? f.toDate().getTime() : new Date(f + 'T00:00:00').getTime();
      return t(a.fecha) - t(b.fecha);
    });
  const getTaller = id => talleres.find(t => t.uid === id);

  const handlePrint = () => {
    const toStr = f => {
      if (!f) return '—';
      const d = f?.toDate ? f.toDate() : new Date(f + 'T00:00:00');
      return isNaN(d) ? '—' : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    };
    const rows = activos.map((p, i) => `
      <tr style="background:${i % 2 === 0 ? '#ffffff' : '#fafaf9'}">
        <td>${i + 1}</td>
        <td style="font-family:monospace;font-size:10px;color:#78716c">${p.id.slice(0, 12)}</td>
        <td><strong>${(p.referencia || '—').replace(/</g, '&lt;')}</strong></td>
        <td>${(getTaller(p.tallerId)?.nombre || '—').replace(/</g, '&lt;')}</td>
        <td>${(p.vehiculo || '—').replace(/</g, '&lt;')}</td>
        <td>${STATUS_CONFIG[p.estado]?.label || p.estado}</td>
        <td>${toStr(p.fecha)}</td>
        <td style="color:#1d4ed8;font-weight:600">${toStr(p.fechaEntrega)}</td>
        <td style="color:#57534e;font-size:10px">${(p.notas || '').replace(/</g, '&lt;')}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="es"><head>
      <meta charset="utf-8">
      <title>Parts Pilot — Reporte ${new Date().toLocaleDateString('es-MX')}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;font-size:11px;margin:0;padding:24px;color:#1c1917}
        header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px;padding-bottom:12px;border-bottom:2px solid #1c1917}
        h1{font-size:20px;font-weight:bold;margin:0}
        .sub{color:#78716c;font-size:11px;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;font-size:10.5px}
        thead th{background:#1c1917;color:#fff;text-align:left;padding:7px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
        td{padding:6px 10px;border-bottom:1px solid #e7e5e4;vertical-align:top}
        tfoot td{font-weight:bold;border-top:2px solid #1c1917;padding-top:8px;background:#fafaf9}
        @media print{@page{size:landscape;margin:1.2cm}body{padding:0}}
      </style>
    </head><body>
      <header>
        <div><h1>Parts Pilot</h1><div style="color:#78716c;font-size:11px">Reporte de Pedidos en Proceso</div></div>
        <div style="color:#78716c;font-size:11px;text-align:right">${new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </header>
      <p class="sub">${activos.length} pedidos activos (excluye Orden Completa)</p>
      <table>
        <thead><tr><th>#</th><th>Folio</th><th>Referencia / Orden</th><th>Taller</th><th>Vehículo</th><th>Estado</th><th>Fecha Reg.</th><th>Entrega Est.</th><th>Notas</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="9">Total: ${activos.length} pedidos activos</td></tr></tfoot>
      </table>
    </body></html>`;

    const w = window.open('', '_blank', 'width=1100,height=750');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  return (
    <Modal title="Reporte · Pedidos en Proceso" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-500">
            <span className="font-semibold text-stone-800">{activos.length}</span> pedidos activos — excluye Orden Completa
          </p>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-stone-800 hover:bg-stone-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-stone-800 text-white text-[10px] uppercase tracking-wider">
                <th className="text-left px-3 py-2.5 font-medium">#</th>
                <th className="text-left px-3 py-2.5 font-medium">Referencia</th>
                <th className="text-left px-3 py-2.5 font-medium">Taller</th>
                <th className="text-left px-3 py-2.5 font-medium">Vehículo</th>
                <th className="text-left px-3 py-2.5 font-medium">Estado</th>
                <th className="text-left px-3 py-2.5 font-medium whitespace-nowrap">Fecha Reg.</th>
                <th className="text-left px-3 py-2.5 font-medium whitespace-nowrap">Entrega Est.</th>
                <th className="text-left px-3 py-2.5 font-medium">Notas</th>
              </tr>
            </thead>
            <tbody>
              {activos.map((p, i) => (
                <tr key={p.id} className={`border-b border-stone-100 ${i % 2 === 0 ? 'bg-white' : 'bg-stone-50'}`}>
                  <td className="px-3 py-2 text-stone-400">{i + 1}</td>
                  <td className="px-3 py-2 font-semibold text-stone-800">{p.referencia || <span className="text-stone-300 font-normal">—</span>}</td>
                  <td className="px-3 py-2 text-stone-600">{getTaller(p.tallerId)?.nombre || '—'}</td>
                  <td className="px-3 py-2 text-stone-600">{p.vehiculo || '—'}</td>
                  <td className="px-3 py-2"><StatusBadge estado={p.estado} /></td>
                  <td className="px-3 py-2 text-stone-500 whitespace-nowrap">{formatDate(p.fecha)}</td>
                  <td className="px-3 py-2 font-semibold whitespace-nowrap">
                    {p.fechaEntrega ? <span className="text-blue-600">{formatDate(p.fechaEntrega)}</span> : <span className="text-stone-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-stone-500 max-w-[140px] truncate">{p.notas || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {activos.length === 0 && <div className="py-10 text-center text-stone-400 text-sm">No hay pedidos activos en este momento.</div>}
        </div>
      </div>
    </Modal>
  );
}

function AdminEstimados({ solicitudes, getTaller, onSelect }) {
  if (solicitudes.length === 0) return (
    <div className="text-center py-14" style={{ color: '#9aa1ad' }}>
      <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
      <p className="text-sm">No hay estimados pendientes.</p>
    </div>
  );

  const sinEstimado = solicitudes.filter(p => p.estado === 'pendiente' || p.tipo === 'solicitud');
  const cotizando   = solicitudes.filter(p => p.estado === 'cotizando');

  const Card = ({ p }) => {
    const taller = getTaller(p.tallerId);
    const isCotizando = p.estado === 'cotizando';
    const hasAct = hasNewActivity('admin', p);
    return (
      <button key={p.id} onClick={() => onSelect(p.id)} className="w-full text-left rounded-[15px] p-[17px] border transition-all hover:border-[#e8632f] hover:shadow-[0_8px_24px_-14px_rgba(201,73,28,.4)] relative" style={{ background: '#fff', borderColor: hasAct ? '#e8632f' : isCotizando ? '#dbe7fe' : '#f3d9cb', boxShadow: hasAct ? '0 0 0 2px rgba(232,99,47,.12)' : 'none' }}>
      {hasAct && (
        <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#e8632f' }} />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: '#e8632f' }} />
        </span>
      )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11.5px] flex items-center gap-1 mb-1 truncate" style={{ color: '#8a909c' }}>
              <Building2 className="w-3 h-3 flex-shrink-0" />{taller?.nombre || '—'}
            </p>
            <h3 className="text-[14.5px] font-bold truncate" style={{ color: '#181b21' }}>{p.vehiculo}</h3>
            {p.pieza && <p className="text-[12.5px] mt-0.5" style={{ color: '#767d8a' }}>{p.pieza}</p>}
          </div>
          {isCotizando ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0" style={{ background: '#eef4ff', color: '#2563eb' }}>
              <FileText className="w-3 h-3" /> Cotizando
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0" style={{ background: '#fdeee7', color: '#c9491c' }}>
              <Clock className="w-3 h-3" /> Sin estimado
            </span>
          )}
        </div>
        {p.notas && <p className="text-[13px] line-clamp-2 mt-2" style={{ color: '#767d8a' }}>{p.notas}</p>}
        {p.archivo && <p className="text-[11.5px] flex items-center gap-1 mt-1.5" style={{ color: '#9aa1ad' }}><Paperclip className="w-3 h-3" />{p.archivo.name}</p>}
        <p className="font-mono text-[11.5px] mt-2.5" style={{ color: '#9aa1ad' }}>{p.folio || p.id?.slice(0,8)} · {formatDate(p.fecha)}</p>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {sinEstimado.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase mb-3" style={{ color: '#9aa1ad', letterSpacing: '.06em' }}>Sin estimado · {sinEstimado.length}</p>
          <div className="grid sm:grid-cols-2 gap-3.5">
            {[...sinEstimado].sort((a,b) => { const t=f=>f?.toDate?f.toDate().getTime():new Date(f+'T00:00:00').getTime(); return t(a.fecha)-t(b.fecha); }).map(p => <Card key={p.id} p={p} />)}
          </div>
        </div>
      )}
      {cotizando.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase mb-3" style={{ color: '#9aa1ad', letterSpacing: '.06em' }}>Cotizando — esperando respuesta · {cotizando.length}</p>
          <div className="grid sm:grid-cols-2 gap-3.5">
            {[...cotizando].sort((a,b) => { const t=f=>f?.toDate?f.toDate().getTime():new Date(f+'T00:00:00').getTime(); return t(a.fecha)-t(b.fecha); }).map(p => <Card key={p.id} p={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FACTURAS — helpers                                                  */
/* ------------------------------------------------------------------ */

const MARCAS_FACTURA = ['KIA', 'NISSAN'];

function fmtCur(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDateDisp(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y}`;
}

/* ------------------------------------------------------------------ */
/*  ADMIN FACTURAS                                                      */
/* ------------------------------------------------------------------ */

function FacturaInlineRow({ form, setForm, onSave, onCancel, saving }) {
  const inp = "px-2 py-1 rounded-[8px] border text-[16px] outline-none focus:border-[#e8632f]";
  return (
    <tr style={{ background: '#fffbf5', borderTop: '1px solid #eef0f2' }}>
      <td className="py-2 pl-5 pr-1"><input type="date" value={form.fechaFactura || ''} onChange={e => setForm(f => ({ ...f, fechaFactura: e.target.value }))} className={`w-[130px] ${inp}`} style={{ borderColor: '#e3e5ea' }} /></td>
      <td className="py-2 px-1"><input value={form.numeroFactura || ''} onChange={e => setForm(f => ({ ...f, numeroFactura: e.target.value }))} placeholder="# Factura" className={`w-[88px] font-mono ${inp}`} style={{ borderColor: '#e3e5ea' }} /></td>
      <td className="py-2 px-1"><input value={form.poTag || ''} onChange={e => setForm(f => ({ ...f, poTag: e.target.value }))} placeholder="PO Tag" className={`w-[88px] font-mono ${inp}`} style={{ borderColor: '#e3e5ea' }} /></td>
      <td className="py-2 px-1"><input type="number" step="0.01" value={form.valor || ''} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="0.00" className={`w-[90px] ${inp}`} style={{ borderColor: '#e3e5ea' }} /></td>
      <td className="py-2 px-1"><input type="number" step="0.01" value={form.pagado || ''} onChange={e => setForm(f => ({ ...f, pagado: e.target.value }))} placeholder="0.00" className={`w-[90px] ${inp}`} style={{ borderColor: '#e3e5ea' }} /></td>
      <td className="py-2 px-2 text-[12.5px] font-semibold" style={{ color: '#b7791f' }}>{fmtCur(Number(form.valor || 0) - Number(form.pagado || 0))}</td>
      <td className="py-2 px-1"><input value={form.numeroCheck || ''} onChange={e => setForm(f => ({ ...f, numeroCheck: e.target.value }))} placeholder="Check" className={`w-[80px] font-mono ${inp}`} style={{ borderColor: '#e3e5ea' }} /></td>
      <td className="py-2 px-1"><input type="date" value={form.fechaPago || ''} onChange={e => setForm(f => ({ ...f, fechaPago: e.target.value }))} className={`w-[130px] ${inp}`} style={{ borderColor: '#e3e5ea' }} /></td>
      <td className="py-2 pl-1 pr-4">
        <div className="flex gap-1">
          <button onClick={onSave} disabled={saving} className="w-7 h-7 rounded-[8px] flex items-center justify-center text-white text-[13px] font-bold" style={{ background: '#10b981' }}>✓</button>
          <button onClick={onCancel} className="w-7 h-7 rounded-[8px] flex items-center justify-center border text-[13px]" style={{ borderColor: '#e3e5ea', color: '#5b626e' }}>✕</button>
        </div>
      </td>
    </tr>
  );
}

function AdminFacturas({ facturas, talleres, onAgregar, onActualizar, onEliminar, onUpdateTaller, readOnly = false }) {
  const [tallerSel, setTallerSel] = useState(talleres[0]?.uid || '');
  const [marca, setMarca] = useState('KIA');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [addingRow, setAddingRow] = useState(false);
  const [newForm, setNewForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [importRows, setImportRows] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();
  const [showArchived, setShowArchived] = useState(false);

  const tallerActual = talleres.find(t => t.uid === tallerSel);
  const numeroCuenta = tallerActual?.numeroCuentas?.[marca] || '';

  const facturasFiltradas = [...facturas]
    .filter(f => f.tallerId === tallerSel && f.marca === marca && !f.archivada)
    .sort((a, b) => (a.fechaFactura || '').localeCompare(b.fechaFactura || ''));

  const facturasArchivadas = [...facturas]
    .filter(f => f.tallerId === tallerSel && f.marca === marca && f.archivada)
    .sort((a, b) => (a.fechaFactura || '').localeCompare(b.fechaFactura || ''));

  const totals = facturasFiltradas.reduce(
    (acc, f) => ({ valor: acc.valor + Number(f.valor || 0), pagado: acc.pagado + Number(f.pagado || 0), pendiente: acc.pendiente + Number(f.pendiente || 0) }),
    { valor: 0, pagado: 0, pendiente: 0 }
  );

  const pagadasSinArch = facturasFiltradas.filter(f => Number(f.pendiente || 0) <= 0);

  const handleArchivarPagadas = async () => {
    if (!pagadasSinArch.length) return;
    if (!window.confirm(`¿Archivar ${pagadasSinArch.length} factura(s) totalmente pagada(s)? Se moverán al historial.`)) return;
    for (const f of pagadasSinArch) await onActualizar(f.id, { archivada: true });
  };

  const startEdit = (f) => { setEditId(f.id); setEditForm({ ...f }); setAddingRow(false); };
  const cancelEdit = () => setEditId(null);

  const saveEdit = async () => {
    setSaving(true);
    try {
      const pendiente = Number(editForm.valor || 0) - Number(editForm.pagado || 0);
      await onActualizar(editId, { ...editForm, pendiente });
      setEditId(null);
    } finally { setSaving(false); }
  };

  const startAdd = () => {
    setAddingRow(true); setEditId(null);
    setNewForm({ fechaFactura: '', numeroFactura: '', poTag: '', valor: '', pagado: '', numeroCheck: '', fechaPago: '' });
  };

  const saveNew = async () => {
    if (!newForm.numeroFactura) return;
    setSaving(true);
    try {
      const valor = Number(newForm.valor || 0);
      const pagado = Number(newForm.pagado || 0);
      await onAgregar({ tallerId: tallerSel, marca, ...newForm, valor, pagado, pendiente: valor - pagado });
      setAddingRow(false);
    } finally { setSaving(false); }
  };

  const saveCuenta = async (num) => {
    if (!tallerSel) return;
    await onUpdateTaller(tallerSel, { [`numeroCuentas.${marca}`]: num });
  };

  const toDateStr = (val) => {
    if (!val) return '';
    if (val instanceof Date) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    if (typeof val === 'number' && val > 1000) {
      // Serial de Excel: días desde 1899-12-30
      const d = new Date(Math.round((val - 25569) * 86400 * 1000));
      const y = d.getUTCFullYear();
      const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${mo}-${day}`;
    }
    if (typeof val === 'string') {
      const parts = val.split('/');
      if (parts.length === 3) {
        const [m, d, y] = parts;
        const year = y.length <= 2 ? '20' + y : y;
        return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
    return '';
  };

  const toNum = (val) => {
    if (val === '' || val == null) return 0;
    return parseFloat(String(val).replace(/[$,\s]/g, '')) || 0;
  };

  const handleXlsx = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // Detecta fila de encabezados buscando # FACTURA o FECHA
        let headerIdx = raw.findIndex(row =>
          row.some(c => /FACTURA|FECHA/i.test(String(c)))
        );
        if (headerIdx === -1) headerIdx = 0;

        const dataRows = raw
          .slice(headerIdx + 1)
          .filter(row => {
            const hasData = row.some(c => c !== '' && c != null);
            const isTotal = /TOTAL/i.test(String(row[0])) || /TOTAL/i.test(String(row[1]));
            return hasData && !isTotal;
          });

        const parsed = dataRows.map(row => {
          const valor = toNum(row[3]);
          const pagado = toNum(row[4]);
          const pendiente = toNum(row[5]) > 0 ? toNum(row[5]) : Math.max(0, valor - pagado);
          return {
            fechaFactura:  toDateStr(row[0]),
            numeroFactura: String(row[1] || '').trim(),
            poTag:         String(row[2] || '').trim(),
            valor,
            pagado,
            pendiente,
            numeroCheck:   String(row[6] || '').trim(),
            fechaPago:     toDateStr(row[7]),
          };
        }).filter(r => r.numeroFactura !== '');

        if (parsed.length === 0) {
          alert(`No se encontraron filas de datos.\n\nEl archivo tiene ${raw.length} filas en total. Asegúrate de que la hoja tenga encabezados con la palabra FACTURA y filas de datos debajo.`);
          return;
        }

        setImportRows(parsed);
      } catch (err) {
        alert('Error al leer el archivo: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const confirmImport = async () => {
    if (!importRows?.length) return;
    setImporting(true);
    try {
      for (const row of importRows) {
        await onAgregar({ tallerId: tallerSel, marca, ...row });
      }
      setImportRows(null);
    } finally {
      setImporting(false);
    }
  };

  // InlineRow definido como JSX directo para evitar remount en cada tecla

  const thCls = "text-left py-3 text-[10.5px] font-bold uppercase";
  const thSt = { color: '#9aa1ad', letterSpacing: '.06em' };
  const tdCls = "py-3 text-[12.5px]";

  return (
    <div className="space-y-5">
      {/* Taller + marca */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <select value={tallerSel} onChange={e => setTallerSel(e.target.value)} className={`${inputClass} w-auto`}>
            {talleres.map(t => <option key={t.uid} value={t.uid}>{t.nombre}</option>)}
          </select>
          <div className="flex gap-1 p-1 rounded-[10px]" style={{ background: '#f1f3f5' }}>
            {MARCAS_FACTURA.map(m => (
              <button key={m} onClick={() => setMarca(m)} className="px-4 py-1.5 rounded-[8px] text-[13px] font-bold transition-all"
                style={{ background: marca === m ? '#fff' : 'transparent', color: marca === m ? '#181b21' : '#9aa1ad', boxShadow: marca === m ? '0 1px 4px rgba(0,0,0,.08)' : 'none' }}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {pagadasSinArch.length > 0 && !readOnly && (
            <button onClick={handleArchivarPagadas} className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold border hover:bg-emerald-50 transition-colors" style={{ borderColor: '#059669', color: '#059669' }}>
              <CheckCircle2 className="w-4 h-4" /> Archivar pagadas ({pagadasSinArch.length})
            </button>
          )}
          {!readOnly && (
            <>
              <label className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold border cursor-pointer hover:bg-stone-50 transition-colors" style={{ borderColor: '#e3e5ea', color: '#4a505c' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Importar CSV / Excel
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleXlsx} className="hidden" />
              </label>
              <button onClick={startAdd} className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold text-white hover:brightness-105" style={{ background: 'linear-gradient(160deg, #e8632f, #cf4d1d)' }}>
                <Plus className="w-4 h-4" strokeWidth={2.2} /> Nueva factura
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal previsualización import */}
      {importRows && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(20,22,26,.5)' }}>
          <div className="relative w-full flex flex-col rounded-[20px] overflow-hidden" style={{ maxWidth: 900, maxHeight: '85vh', background: '#fff', boxShadow: '0 40px 80px -20px rgba(0,0,0,.35)' }}>
            <div className="flex items-center justify-between px-7 py-5 border-b flex-shrink-0" style={{ borderColor: '#eef0f2' }}>
              <div>
                <h2 className="text-[17px] font-bold" style={{ color: '#181b21' }}>Vista previa de importación</h2>
                <p className="text-[12.5px] mt-0.5" style={{ color: '#767d8a' }}>{importRows.length} filas detectadas · {marca} · {talleres.find(t => t.uid === tallerSel)?.nombre}</p>
              </div>
              <button onClick={() => setImportRows(null)} className="w-9 h-9 rounded-[10px] border flex items-center justify-center hover:bg-stone-50" style={{ borderColor: '#e7e9ed', color: '#767d8a' }}>
                <X className="w-[17px] h-[17px]" />
              </button>
            </div>
            <div className="flex-1 overflow-auto px-7 py-5">
              <table className="w-full text-[12px]" style={{ minWidth: 780 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eef0f2' }}>
                    {['Fecha', '# Factura', 'PO Tag', 'Valor', 'Pagado', 'Pendiente', '# Check', 'F. Pago'].map(h => (
                      <th key={h} className="text-left pb-2 pr-4 text-[10.5px] font-bold uppercase" style={{ color: '#9aa1ad', letterSpacing: '.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importRows.map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f1f2f4' }}>
                      <td className="py-2 pr-4 whitespace-nowrap" style={{ color: '#4a505c' }}>{fmtDateDisp(r.fechaFactura)}</td>
                      <td className="py-2 pr-4 font-mono font-semibold" style={{ color: '#181b21' }}>{r.numeroFactura}</td>
                      <td className="py-2 pr-4 font-mono" style={{ color: '#5b626e' }}>{r.poTag || '—'}</td>
                      <td className="py-2 pr-4 font-semibold" style={{ color: '#181b21' }}>{fmtCur(r.valor)}</td>
                      <td className="py-2 pr-4 font-semibold" style={{ color: r.pagado > 0 ? '#059669' : '#aab0b9' }}>{r.pagado > 0 ? fmtCur(r.pagado) : '—'}</td>
                      <td className="py-2 pr-4 font-semibold" style={{ color: r.pendiente > 0 ? '#b7791f' : '#059669' }}>{fmtCur(r.pendiente)}</td>
                      <td className="py-2 pr-4 font-mono" style={{ color: '#5b626e' }}>{r.numeroCheck || '—'}</td>
                      <td className="py-2 whitespace-nowrap" style={{ color: '#767d8a' }}>{fmtDateDisp(r.fechaPago)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-7 py-4 border-t flex-shrink-0" style={{ borderColor: '#eef0f2' }}>
              <p className="text-[12.5px]" style={{ color: '#767d8a' }}>Revisa las filas antes de importar. Se agregarán a las existentes.</p>
              <div className="flex gap-3">
                <button onClick={() => setImportRows(null)} className="px-5 py-[9px] rounded-[10px] border text-[13px] font-semibold hover:bg-stone-50" style={{ borderColor: '#e3e5ea', color: '#5b626e' }}>Cancelar</button>
                <button onClick={confirmImport} disabled={importing} className="px-5 py-[9px] rounded-[10px] text-white text-[13px] font-bold hover:brightness-105 disabled:opacity-60" style={{ background: 'linear-gradient(160deg, #e8632f, #cf4d1d)' }}>
                  {importing ? 'Importando…' : `Importar ${importRows.length} filas`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* # de cuenta */}
      <div className="flex items-center gap-3">
        <span className="text-[12.5px] font-semibold" style={{ color: '#767d8a' }}># de cuenta:</span>
        <input
          key={`${tallerSel}_${marca}`}
          defaultValue={numeroCuenta}
          onBlur={e => saveCuenta(e.target.value)}
          placeholder="ej. 517831"
          className="px-3 py-1.5 rounded-[9px] border text-[13px] font-mono w-36 outline-none focus:border-[#e8632f]"
          style={{ borderColor: '#e3e5ea' }}
        />
        <span className="text-[11.5px]" style={{ color: '#aab0b9' }}>Se guarda al salir del campo</span>
      </div>

      {/* Tarjetas de totales */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total facturas', val: fmtCur(totals.valor),    color: '#181b21' },
          { label: 'Pagado',         val: fmtCur(totals.pagado),   color: '#059669' },
          { label: 'Pendiente',      val: fmtCur(totals.pendiente),color: totals.pendiente > 0 ? '#b7791f' : '#059669' },
        ].map(({ label, val, color }) => (
          <div key={label} className="rounded-[15px] p-4 border" style={{ background: '#fff', borderColor: '#e7e9ed' }}>
            <p className="text-[12px] font-medium mb-1" style={{ color: '#767d8a' }}>{label}</p>
            <p className="text-[22px] font-extrabold leading-none" style={{ color }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="rounded-[16px] border overflow-x-auto" style={{ background: '#fff', borderColor: '#e7e9ed' }}>
        <table className="w-full" style={{ minWidth: 920 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eef0f2' }}>
              {['Fecha factura', '# Factura', 'PO Tag', 'Valor', 'Pagado', 'Pendiente', '# Check', 'F. Pago', ''].map((h, i) => (
                <th key={i} className={`${thCls} ${i === 0 ? 'pl-5 pr-2' : 'px-2'} ${i === 8 ? 'pr-4' : ''}`} style={thSt}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {facturasFiltradas.length === 0 && !addingRow && (
              <tr><td colSpan={9} className="py-12 text-center text-[13px]" style={{ color: '#9aa1ad' }}>Sin facturas. Usa "+ Nueva factura" para agregar.</td></tr>
            )}
            {facturasFiltradas.map(f => editId === f.id
              ? <FacturaInlineRow key={f.id} form={editForm} setForm={setEditForm} onSave={saveEdit} onCancel={cancelEdit} saving={saving} />
              : (
                <tr key={f.id} onClick={() => startEdit(f)} className="cursor-pointer hover:bg-[#fafbfc] transition-colors" style={{ borderTop: '1px solid #f1f2f4' }}>
                  <td className={`${tdCls} pl-5 pr-2 whitespace-nowrap`} style={{ color: '#4a505c' }}>{fmtDateDisp(f.fechaFactura)}</td>
                  <td className={`${tdCls} px-2 font-mono font-semibold`} style={{ color: '#181b21' }}>{f.numeroFactura}</td>
                  <td className={`${tdCls} px-2 font-mono`} style={{ color: '#5b626e' }}>{f.poTag || '—'}</td>
                  <td className={`${tdCls} px-2 font-semibold`} style={{ color: '#181b21' }}>{fmtCur(f.valor)}</td>
                  <td className={`${tdCls} px-2 font-semibold`} style={{ color: Number(f.pagado) > 0 ? '#059669' : '#aab0b9' }}>{Number(f.pagado) > 0 ? fmtCur(f.pagado) : '—'}</td>
                  <td className={`${tdCls} px-2 font-semibold`} style={{ color: Number(f.pendiente) > 0 ? '#b7791f' : '#059669' }}>{fmtCur(f.pendiente)}</td>
                  <td className={`${tdCls} px-2 font-mono`} style={{ color: '#5b626e' }}>{f.numeroCheck || '—'}</td>
                  <td className={`${tdCls} px-2 whitespace-nowrap`} style={{ color: '#767d8a' }}>{fmtDateDisp(f.fechaPago)}</td>
                  <td className="py-2 pl-1 pr-4">
                    <button onClick={e => { e.stopPropagation(); if (window.confirm('¿Eliminar esta factura?')) onEliminar(f.id); }} className="w-7 h-7 rounded-[8px] flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors" style={{ color: '#aab0b9' }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              )
            )}
            {addingRow && <FacturaInlineRow form={newForm} setForm={setNewForm} onSave={saveNew} onCancel={() => setAddingRow(false)} saving={saving} />}
            {/* Fila de acción rápida al fondo */}
            {!addingRow && !readOnly && (
              <tr style={{ borderTop: '1px solid #f1f2f4' }}>
                <td colSpan={9} className="py-2 pl-5">
                  <button onClick={startAdd} className="flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors hover:text-[#e8632f]" style={{ color: '#aab0b9' }}>
                    <Plus className="w-4 h-4" strokeWidth={2.5} /> Añadir fila
                  </button>
                </td>
              </tr>
            )}
          </tbody>
          {facturasFiltradas.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: '2px solid #eef0f2', background: '#f8f9fa' }}>
                <td colSpan={3} className="py-3 pl-5 text-[12.5px] font-bold" style={{ color: '#181b21' }}>TOTAL</td>
                <td className="py-3 px-2 text-[12.5px] font-bold" style={{ color: '#181b21' }}>{fmtCur(totals.valor)}</td>
                <td className="py-3 px-2 text-[12.5px] font-bold" style={{ color: '#059669' }}>{fmtCur(totals.pagado)}</td>
                <td className="py-3 px-2 text-[12.5px] font-bold" style={{ color: totals.pendiente > 0 ? '#b7791f' : '#059669' }}>{fmtCur(totals.pendiente)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Historial de archivadas */}
      {facturasArchivadas.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowArchived(v => !v)}
            className="flex items-center gap-2 text-[12.5px] font-semibold transition-colors hover:text-[#e8632f]"
            style={{ color: '#9aa1ad' }}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${showArchived ? 'rotate-90' : ''}`} />
            Historial de pagadas archivadas ({facturasArchivadas.length})
          </button>
          {showArchived && (
            <div className="mt-3 rounded-[16px] border overflow-x-auto" style={{ background: '#fff', borderColor: '#e7e9ed', opacity: 0.85 }}>
              <table className="w-full" style={{ minWidth: 800 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eef0f2' }}>
                    {['Fecha','# Factura','PO Tag','Valor','Pagado','Pendiente','# Check','F. Pago',''].map((h,i) => (
                      <th key={i} className={`text-left py-2.5 text-[10.5px] font-bold uppercase ${i===0?'pl-5 pr-2':'px-2'}`} style={{ color: '#9aa1ad', letterSpacing: '.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {facturasArchivadas.map(f => (
                    <tr key={f.id} style={{ borderTop: '1px solid #f1f2f4' }}>
                      <td className="py-3 pl-5 pr-2 text-[12px] whitespace-nowrap" style={{ color: '#aab0b9' }}>{fmtDateDisp(f.fechaFactura)}</td>
                      <td className="py-3 px-2 font-mono text-[12px]" style={{ color: '#aab0b9' }}>{f.numeroFactura}</td>
                      <td className="py-3 px-2 font-mono text-[12px]" style={{ color: '#aab0b9' }}>{f.poTag||'—'}</td>
                      <td className="py-3 px-2 text-[12px]" style={{ color: '#aab0b9' }}>{fmtCur(f.valor)}</td>
                      <td className="py-3 px-2 text-[12px] font-semibold" style={{ color: '#059669' }}>{fmtCur(f.pagado)}</td>
                      <td className="py-3 px-2 text-[12px] font-semibold" style={{ color: '#059669' }}>{fmtCur(f.pendiente)}</td>
                      <td className="py-3 px-2 font-mono text-[12px]" style={{ color: '#aab0b9' }}>{f.numeroCheck||'—'}</td>
                      <td className="py-3 px-2 text-[12px] whitespace-nowrap" style={{ color: '#aab0b9' }}>{fmtDateDisp(f.fechaPago)}</td>
                      <td className="py-3 pr-4">
                        <button onClick={() => onActualizar(f.id, { archivada: false })} className="text-[11px] font-semibold hover:underline" style={{ color: '#e8632f' }}>
                          Restaurar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CLIENT FACTURAS                                                     */
/* ------------------------------------------------------------------ */

function ClientFacturas({ facturas, taller }) {
  const marcasDisponibles = [...new Set(facturas.map(f => f.marca))].sort();
  const [marca, setMarca] = useState(marcasDisponibles[0] || 'KIA');
  const [verHistorial, setVerHistorial] = useState(false);

  const todasMarca = [...facturas]
    .filter(f => f.marca === marca)
    .sort((a, b) => (a.fechaFactura || '').localeCompare(b.fechaFactura || ''));

  const facturasMarca = todasMarca.filter(f => !f.archivada);
  const facturasArch  = todasMarca.filter(f => f.archivada);

  const numeroCuenta = taller?.numeroCuentas?.[marca] || '';

  const totals = facturasMarca.reduce(
    (acc, f) => ({ valor: acc.valor + Number(f.valor || 0), pagado: acc.pagado + Number(f.pagado || 0), pendiente: acc.pendiente + Number(f.pendiente || 0) }),
    { valor: 0, pagado: 0, pendiente: 0 }
  );

  const handlePrint = () => {
    const rows = facturasMarca.map(f => `
      <tr style="background:${Number(f.pendiente) > 0 ? '#fffbf5' : '#fff'}">
        <td>${fmtDateDisp(f.fechaFactura)}</td>
        <td>${f.numeroFactura}</td>
        <td>${f.poTag || ''}</td>
        <td style="text-align:right">$${Number(f.valor || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td style="text-align:right;color:${Number(f.pagado) > 0 ? '#059669' : '#aab0b9'};font-weight:600">${Number(f.pagado) > 0 ? '$' + Number(f.pagado).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}</td>
        <td style="text-align:right;color:${Number(f.pendiente) > 0 ? '#b7791f' : '#059669'};font-weight:600">$${Number(f.pendiente || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td>${f.numeroCheck || ''}</td>
        <td>${fmtDateDisp(f.fechaPago)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="es"><head>
      <meta charset="utf-8">
      <title>Lista de Facturas ${marca} · ${taller.nombre || ''}</title>
      <style>
        *{box-sizing:border-box} body{font-family:Arial,sans-serif;font-size:11px;margin:0;padding:28px;color:#1c1917}
        h1{font-size:22px;font-weight:bold;text-align:center;margin:0 0 4px;text-transform:uppercase;letter-spacing:.04em}
        .sub{text-align:center;font-size:12px;color:#57534e;margin-bottom:22px}
        table{width:100%;border-collapse:collapse;font-size:10.5px}
        thead th{background:#1c1917;color:#fff;text-align:left;padding:7px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
        thead th:nth-child(n+4):nth-child(-n+6){text-align:right}
        td{padding:6px 10px;border-bottom:1px solid #e7e5e4;vertical-align:top}
        td:nth-child(n+4):nth-child(-n+6){text-align:right}
        tfoot td{font-weight:bold;border-top:2px solid #1c1917;padding-top:8px;background:#fafaf9}
        @media print{@page{size:landscape;margin:1.2cm}body{padding:0}}
      </style>
    </head><body>
      <h1>Lista de Facturas ${marca}</h1>
      <div class="sub">${taller.nombre || ''}&nbsp;&nbsp;|&nbsp;&nbsp;# de Cuenta: ${numeroCuenta}</div>
      <table>
        <thead><tr>
          <th>Fecha Factura</th><th># Factura</th><th>PO Tag</th>
          <th>Valor Factura</th><th>Pagado</th><th>Pendiente de Pago</th>
          <th># Check</th><th>Fecha de Pago</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr>
          <td colspan="3">TOTAL</td>
          <td style="text-align:right">$${totals.valor.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td style="text-align:right;color:#059669">$${totals.pagado.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td style="text-align:right;color:${totals.pendiente > 0 ? '#b7791f' : '#059669'}">$${totals.pendiente.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td colspan="2"></td>
        </tr></tfoot>
      </table>
    </body></html>`;

    const w = window.open('', '_blank', 'width=1100,height=750');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  if (facturas.length === 0) return <EmptyState text="No tienes facturas asignadas aún." />;

  // Stats financieras para las tarjetas superiores
  const statsAll = facturas.filter(f => !f.archivada);
  const statsTotals = statsAll.reduce(
    (a, f) => ({ valor: a.valor + Number(f.valor||0), pagado: a.pagado + Number(f.pagado||0), pendiente: a.pendiente + Number(f.pendiente||0) }),
    { valor: 0, pagado: 0, pendiente: 0 }
  );

  const thSt = { color: '#9aa1ad', letterSpacing: '.06em' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 p-1 rounded-[10px]" style={{ background: '#f1f3f5' }}>
          {marcasDisponibles.map(m => (
            <button key={m} onClick={() => setMarca(m)} className="px-4 py-1.5 rounded-[8px] text-[13px] font-bold transition-all"
              style={{ background: marca === m ? '#fff' : 'transparent', color: marca === m ? '#181b21' : '#9aa1ad', boxShadow: marca === m ? '0 1px 4px rgba(0,0,0,.08)' : 'none' }}>
              {m}
            </button>
          ))}
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold border hover:bg-stone-50 transition-colors" style={{ borderColor: '#e3e5ea', color: '#4a505c' }}>
          <Printer className="w-4 h-4" /> Imprimir / PDF
        </button>
      </div>

      {numeroCuenta && (
        <p className="text-[12.5px]" style={{ color: '#767d8a' }}>
          # de cuenta: <span className="font-mono font-semibold" style={{ color: '#181b21' }}>{numeroCuenta}</span>
        </p>
      )}

      <div className="rounded-[16px] border overflow-x-auto" style={{ background: '#fff', borderColor: '#e7e9ed' }}>
        <table className="w-full" style={{ minWidth: 800 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eef0f2' }}>
              {['Fecha', '# Factura', 'PO Tag', 'Valor', 'Pagado', 'Pendiente', '# Check', 'F. Pago'].map((h, i) => (
                <th key={i} className={`text-left py-3 text-[10.5px] font-bold uppercase ${i === 0 ? 'pl-5 pr-3' : 'px-3'} ${i === 7 ? 'pr-5' : ''}`} style={thSt}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {facturasMarca.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-[13px]" style={{ color: '#9aa1ad' }}>Sin facturas para {marca}.</td></tr>}
            {facturasMarca.map(f => {
              const isPending = Number(f.pendiente) > 0;
              return (
                <tr key={f.id} style={{ borderTop: '1px solid #f1f2f4', background: isPending ? '#fffdf8' : '#fff' }}>
                  <td className="py-3.5 pl-5 pr-3 text-[12.5px] whitespace-nowrap" style={{ color: '#4a505c' }}>{fmtDateDisp(f.fechaFactura)}</td>
                  <td className="py-3.5 px-3 font-mono text-[12.5px] font-semibold" style={{ color: '#181b21' }}>{f.numeroFactura}</td>
                  <td className="py-3.5 px-3 font-mono text-[12.5px]" style={{ color: '#5b626e' }}>{f.poTag || '—'}</td>
                  <td className="py-3.5 px-3 text-[12.5px] font-semibold" style={{ color: '#181b21' }}>{fmtCur(f.valor)}</td>
                  <td className="py-3.5 px-3 text-[12.5px] font-semibold" style={{ color: Number(f.pagado) > 0 ? '#059669' : '#aab0b9' }}>{Number(f.pagado) > 0 ? fmtCur(f.pagado) : '—'}</td>
                  <td className="py-3.5 px-3 text-[12.5px] font-semibold" style={{ color: isPending ? '#b7791f' : '#059669' }}>{fmtCur(f.pendiente)}</td>
                  <td className="py-3.5 px-3 font-mono text-[12.5px]" style={{ color: '#5b626e' }}>{f.numeroCheck || '—'}</td>
                  <td className="py-3.5 pl-3 pr-5 text-[12.5px] whitespace-nowrap" style={{ color: '#767d8a' }}>{fmtDateDisp(f.fechaPago)}</td>
                </tr>
              );
            })}
          </tbody>
          {facturasMarca.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: '2px solid #eef0f2', background: '#f8f9fa' }}>
                <td colSpan={3} className="py-3.5 pl-5 text-[12.5px] font-bold" style={{ color: '#181b21' }}>TOTAL</td>
                <td className="py-3.5 px-3 text-[12.5px] font-bold" style={{ color: '#181b21' }}>{fmtCur(totals.valor)}</td>
                <td className="py-3.5 px-3 text-[12.5px] font-bold" style={{ color: '#059669' }}>{fmtCur(totals.pagado)}</td>
                <td className="py-3.5 px-3 text-[12.5px] font-bold" style={{ color: totals.pendiente > 0 ? '#b7791f' : '#059669' }}>{fmtCur(totals.pendiente)}</td>
                <td colSpan={2} className="pr-5" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Historial de pagadas archivadas */}
      {facturasArch.length > 0 && (
        <div>
          <button onClick={() => setVerHistorial(v => !v)} className="flex items-center gap-2 text-[12.5px] font-semibold transition-colors hover:text-[#e8632f]" style={{ color: '#9aa1ad' }}>
            <ChevronRight className={`w-4 h-4 transition-transform ${verHistorial ? 'rotate-90' : ''}`} />
            Historial de pagadas ({facturasArch.length})
          </button>
          {verHistorial && (
            <div className="mt-3 rounded-[16px] border overflow-x-auto" style={{ background: '#fff', borderColor: '#e7e9ed', opacity: 0.85 }}>
              <table className="w-full" style={{ minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eef0f2' }}>
                    {['Fecha','# Factura','PO Tag','Valor','Pagado','# Check','F. Pago',''].map((h, i) => (
                      <th key={i} className={`text-left py-2.5 text-[10.5px] font-bold uppercase ${i===0?'pl-5 pr-3':'px-3'}`} style={thSt}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {facturasArch.map(f => (
                    <tr key={f.id} style={{ borderTop: '1px solid #f1f2f4' }}>
                      <td className="py-3 pl-5 pr-3 text-[12px] whitespace-nowrap" style={{ color: '#aab0b9' }}>{fmtDateDisp(f.fechaFactura)}</td>
                      <td className="py-3 px-3 font-mono text-[12px]" style={{ color: '#aab0b9' }}>{f.numeroFactura}</td>
                      <td className="py-3 px-3 font-mono text-[12px]" style={{ color: '#aab0b9' }}>{f.poTag||'—'}</td>
                      <td className="py-3 px-3 text-[12px]" style={{ color: '#aab0b9' }}>{fmtCur(f.valor)}</td>
                      <td className="py-3 px-3 text-[12px] font-semibold" style={{ color: '#059669' }}>{fmtCur(f.pagado)}</td>
                      <td className="py-3 px-3 font-mono text-[12px]" style={{ color: '#aab0b9' }}>{f.numeroCheck||'—'}</td>
                      <td className="py-3 px-3 text-[12px] whitespace-nowrap" style={{ color: '#aab0b9' }}>{fmtDateDisp(f.fechaPago)}</td>
                      <td className="py-3 pr-4" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ADMIN EQUIPO                                                        */
/* ------------------------------------------------------------------ */

const MODULOS_PERM = [
  { id: 'pedidos',   label: 'Pedidos' },
  { id: 'estimados', label: 'Estimados' },
  { id: 'talleres',  label: 'Talleres' },
  { id: 'facturas',  label: 'Facturas' },
];

const PERM_OPTS = [
  { val: 'none', label: 'Sin acceso', bg: '#f1f3f5', color: '#9aa1ad' },
  { val: 'view', label: 'Solo ver',   bg: '#eef4ff', color: '#2563eb' },
  { val: 'edit', label: 'Editar',     bg: '#eafaf2', color: '#059669' },
];

function PermBadge({ val }) {
  const opt = PERM_OPTS.find(o => o.val === val) || PERM_OPTS[0];
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[7px]" style={{ background: opt.bg, color: opt.color }}>
      {opt.label}
    </span>
  );
}

function PermSelector({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {PERM_OPTS.map(opt => (
        <button key={opt.val} onClick={() => onChange(opt.val)}
          className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all border"
          style={{
            background: value === opt.val ? opt.bg : '#fff',
            color: value === opt.val ? opt.color : '#9aa1ad',
            borderColor: value === opt.val ? opt.color + '40' : '#e3e5ea',
          }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function AdminEquipo({ equipo, currentUid, perfil, onCrear, onActualizar, onEliminar }) {
  const DEFAULT_P = { pedidos: 'edit', estimados: 'edit', talleres: 'view', facturas: 'view', equipo: false, crearPedidos: true };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', permisos: { ...DEFAULT_P } });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editPermisos, setEditPermisos] = useState({});

  const isSuperadmin = (u) => !u.permisos;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.password) return;
    setSaving(true); setError('');
    try {
      await onCrear({ nombre: form.nombre.trim(), email: form.email.trim(), password: form.password, permisos: form.permisos });
      setForm({ nombre: '', email: '', password: '', permisos: { ...DEFAULT_P } });
      setShowForm(false);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use' ? 'Ese correo ya está registrado.' : 'Error: ' + err.message);
    } finally { setSaving(false); }
  };

  const [editNombreAdmin, setEditNombreAdmin] = useState('');
  const [editEmailAdmin, setEditEmailAdmin] = useState('');

  const startEdit = (u) => {
    setEditId(u.uid);
    setEditPermisos({ ...DEFAULT_P, ...u.permisos });
    setEditNombreAdmin(u.nombre || '');
    setEditEmailAdmin(u.email || '');
  };

  const saveEdit = async () => {
    setSaving(true);
    const isSup = !equipo.find(u => u.uid === editId)?.permisos;
    try {
      if (isSup) {
        await onActualizar(editId, { nombre: editNombreAdmin.trim(), email: editEmailAdmin.trim() });
      } else {
        await onActualizar(editId, { permisos: editPermisos });
      }
      setEditId(null);
    } finally { setSaving(false); }
  };

  const setP = (mod, val) => setForm(f => ({ ...f, permisos: { ...f.permisos, [mod]: val } }));
  const setEP = (mod, val) => setEditPermisos(p => ({ ...p, [mod]: val }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold" style={{ color: '#181b21' }}>Equipo</h2>
          <p className="text-[12.5px]" style={{ color: '#767d8a' }}>Usuarios con acceso al panel de administración</p>
        </div>
        <button onClick={() => { setShowForm(s => !s); setError(''); }}
          className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold text-white hover:brightness-105"
          style={{ background: 'linear-gradient(160deg, #e8632f, #cf4d1d)' }}>
          <Plus className="w-4 h-4" strokeWidth={2.2} /> Agregar usuario
        </button>
      </div>

      {done && <div className="flex items-center gap-2 px-4 py-3 rounded-[11px] text-[13px] font-semibold" style={{ background: '#eafaf2', color: '#059669' }}><CheckCircle2 className="w-4 h-4" /> Usuario creado correctamente.</div>}

      {/* Formulario nuevo usuario */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-[16px] p-6 border space-y-5" style={{ background: '#fff', borderColor: '#e7e9ed' }}>
          <p className="text-[14px] font-bold" style={{ color: '#181b21' }}>Nuevo usuario admin</p>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Nombre"><input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="ej. Carlos López" className={inputClass} required /></FormField>
            <FormField label="Correo electrónico"><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="carlos@correo.com" className={inputClass} required /></FormField>
            <FormField label="Contraseña"><input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="mínimo 6 caracteres" className={inputClass} required minLength={6} /></FormField>
          </div>

          {/* Permisos por módulo */}
          <div>
            <p className="text-[12.5px] font-semibold mb-3" style={{ color: '#4a505c' }}>Permisos por módulo</p>
            <div className="space-y-3">
              {MODULOS_PERM.map(({ id, label }) => (
                <div key={id} className="flex items-center justify-between gap-4">
                  <span className="text-[13px] font-medium w-28" style={{ color: '#181b21' }}>{label}</span>
                  <PermSelector value={form.permisos[id] || 'none'} onChange={val => setP(id, val)} />
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 pt-2" style={{ borderTop: '1px dashed #e7e9ed' }}>
                <span className="text-[13px] font-medium w-28" style={{ color: '#181b21' }}>Crear pedidos</span>
                <div className="flex gap-1">
                  {[{ val: true, label: 'Sí' }, { val: false, label: 'No' }].map(opt => (
                    <button key={String(opt.val)} type="button" onClick={() => setP('crearPedidos', opt.val)}
                      className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border transition-all"
                      style={{ background: form.permisos.crearPedidos === opt.val ? '#eafaf2' : '#fff', color: form.permisos.crearPedidos === opt.val ? '#059669' : '#9aa1ad', borderColor: form.permisos.crearPedidos === opt.val ? '#059669' + '40' : '#e3e5ea' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[13px] font-medium w-28" style={{ color: '#181b21' }}>Gestionar equipo</span>
                <div className="flex gap-1">
                  {[{ val: true, label: 'Sí' }, { val: false, label: 'No' }].map(opt => (
                    <button key={String(opt.val)} type="button" onClick={() => setP('equipo', opt.val)}
                      className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border transition-all"
                      style={{ background: form.permisos.equipo === opt.val ? '#eafaf2' : '#fff', color: form.permisos.equipo === opt.val ? '#059669' : '#9aa1ad', borderColor: form.permisos.equipo === opt.val ? '#059669' + '40' : '#e3e5ea' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {error && <div className="flex items-center gap-2 text-[13px] px-3 py-2.5 rounded-[11px]" style={{ background: '#fdecec', color: '#dc2626' }}><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="flex-1 py-[11px] rounded-[11px] text-white font-bold text-[13.5px] hover:brightness-105 disabled:opacity-60" style={{ background: 'linear-gradient(160deg, #e8632f, #cf4d1d)' }}>
              {saving ? 'Creando…' : 'Crear usuario'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="px-5 py-[11px] rounded-[11px] border text-[13.5px] font-semibold hover:bg-stone-50" style={{ borderColor: '#e3e5ea', color: '#5b626e' }}>Cancelar</button>
          </div>
        </form>
      )}

      {/* Lista de usuarios */}
      <div className="grid md:grid-cols-2 gap-4">
        {equipo.map(u => (
          <div key={u.uid} className="rounded-[15px] border p-5" style={{ background: '#fff', borderColor: editId === u.uid ? '#e8632f' : '#e7e9ed', boxShadow: editId === u.uid ? '0 0 0 3px rgba(232,99,47,.08)' : 'none' }}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[14px] font-extrabold flex-shrink-0"
                  style={{ background: isSuperadmin(u) ? 'linear-gradient(160deg, #e8632f, #c9491c)' : 'linear-gradient(150deg, #f3f4f6, #e8eaed)', color: '#fff', ...(isSuperadmin(u) ? {} : { color: '#4a505c' }) }}>
                  {(u.nombre || u.email || 'A')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-bold truncate" style={{ color: '#181b21' }}>{u.nombre || (isSuperadmin(u) ? 'Administrador' : '—')}</div>
                  <div className="text-[12px] truncate" style={{ color: '#8a909c' }}>{u.email || (isSuperadmin(u) ? 'Cuenta principal' : '—')}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isSuperadmin(u) ? (
                  <>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-[8px]" style={{ background: '#141619', color: '#e8632f' }}>Superadmin</span>
                    <button onClick={() => editId === u.uid ? setEditId(null) : startEdit(u)}
                      className="w-7 h-7 rounded-[8px] flex items-center justify-center hover:bg-[#fdeee7] transition-colors" style={{ color: '#aab0b9' }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : u.uid !== currentUid && (
                  <>
                    <button onClick={() => editId === u.uid ? setEditId(null) : startEdit(u)}
                      className="w-7 h-7 rounded-[8px] flex items-center justify-center hover:bg-[#fdeee7] transition-colors" style={{ color: '#aab0b9' }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if (window.confirm(`¿Eliminar a ${u.nombre || u.email}?`)) onEliminar(u.uid); }}
                      className="w-7 h-7 rounded-[8px] flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors" style={{ color: '#aab0b9' }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {isSuperadmin(u) && editId !== u.uid ? (
              <div className="grid grid-cols-2 gap-2">
                {MODULOS_PERM.map(({ id, label }) => (
                  <div key={id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-[9px]" style={{ background: '#f8f9fa' }}>
                    <span className="text-[12px]" style={{ color: '#767d8a' }}>{label}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[7px]" style={{ background: '#eafaf2', color: '#059669' }}>Editar</span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-[9px]" style={{ background: '#f8f9fa' }}>
                  <span className="text-[12px]" style={{ color: '#767d8a' }}>Crear pedidos</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[7px]" style={{ background: '#eafaf2', color: '#059669' }}>Sí</span>
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-[9px]" style={{ background: '#f8f9fa' }}>
                  <span className="text-[12px]" style={{ color: '#767d8a' }}>Equipo</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[7px]" style={{ background: '#eafaf2', color: '#059669' }}>Sí</span>
                </div>
              </div>
            ) : editId === u.uid && isSuperadmin(u) ? (
              /* Editar nombre/email del superadmin */
              <div className="space-y-3">
                <FormField label="Nombre"><input value={editNombreAdmin} onChange={e => setEditNombreAdmin(e.target.value)} className={inputClass} placeholder="Tu nombre" /></FormField>
                <FormField label="Correo (referencia)"><input value={editEmailAdmin} onChange={e => setEditEmailAdmin(e.target.value)} className={inputClass} placeholder="tu@correo.com" /></FormField>
                <div className="flex gap-2 pt-1">
                  <button onClick={saveEdit} disabled={saving} className="flex-1 py-[9px] rounded-[10px] text-white text-[13px] font-bold hover:brightness-105 disabled:opacity-60" style={{ background: 'linear-gradient(160deg, #e8632f, #cf4d1d)' }}>
                    {saving ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button onClick={() => setEditId(null)} className="px-4 py-[9px] rounded-[10px] border text-[13px] font-semibold hover:bg-stone-50" style={{ borderColor: '#e3e5ea', color: '#5b626e' }}>Cancelar</button>
                </div>
              </div>
            ) : editId === u.uid ? (
              /* Edit permisos inline */
              <div className="space-y-3">
                {MODULOS_PERM.map(({ id, label }) => (
                  <div key={id} className="flex items-center justify-between gap-3">
                    <span className="text-[12.5px] font-medium w-24" style={{ color: '#181b21' }}>{label}</span>
                    <PermSelector value={editPermisos[id] || 'none'} onChange={val => setEP(id, val)} />
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12.5px] font-medium w-24" style={{ color: '#181b21' }}>Crear pedidos</span>
                  <div className="flex gap-1">
                    {[{ val: true, label: 'Sí' }, { val: false, label: 'No' }].map(opt => (
                      <button key={String(opt.val)} onClick={() => setEP('crearPedidos', opt.val)}
                        className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border transition-all"
                        style={{ background: editPermisos.crearPedidos === opt.val ? '#eafaf2' : '#fff', color: editPermisos.crearPedidos === opt.val ? '#059669' : '#9aa1ad', borderColor: editPermisos.crearPedidos === opt.val ? '#059669' + '40' : '#e3e5ea' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12.5px] font-medium w-24" style={{ color: '#181b21' }}>Gestionar equipo</span>
                  <div className="flex gap-1">
                    {[{ val: true, label: 'Sí' }, { val: false, label: 'No' }].map(opt => (
                      <button key={String(opt.val)} onClick={() => setEP('equipo', opt.val)}
                        className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border transition-all"
                        style={{ background: editPermisos.equipo === opt.val ? '#eafaf2' : '#fff', color: editPermisos.equipo === opt.val ? '#059669' : '#9aa1ad', borderColor: editPermisos.equipo === opt.val ? '#059669' + '40' : '#e3e5ea' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={saveEdit} disabled={saving} className="flex-1 py-[9px] rounded-[10px] text-white text-[13px] font-bold hover:brightness-105 disabled:opacity-60" style={{ background: 'linear-gradient(160deg, #e8632f, #cf4d1d)' }}>
                    {saving ? 'Guardando…' : 'Guardar permisos'}
                  </button>
                  <button onClick={() => setEditId(null)} className="px-4 py-[9px] rounded-[10px] border text-[13px] font-semibold hover:bg-stone-50" style={{ borderColor: '#e3e5ea', color: '#5b626e' }}>Cancelar</button>
                </div>
              </div>
            ) : (
              /* Permisos en modo lectura */
              <div className="grid grid-cols-2 gap-2">
                {MODULOS_PERM.map(({ id, label }) => (
                  <div key={id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-[9px]" style={{ background: '#f8f9fa' }}>
                    <span className="text-[12px]" style={{ color: '#767d8a' }}>{label}</span>
                    <PermBadge val={u.permisos?.[id] || 'none'} />
                  </div>
                ))}
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-[9px]" style={{ background: '#f8f9fa' }}>
                  <span className="text-[12px]" style={{ color: '#767d8a' }}>Crear pedidos</span>
                  <PermBadge val={u.permisos?.crearPedidos !== false ? 'edit' : 'none'} />
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-[9px]" style={{ background: '#f8f9fa' }}>
                  <span className="text-[12px]" style={{ color: '#767d8a' }}>Equipo</span>
                  <PermBadge val={u.permisos?.equipo ? 'edit' : 'none'} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminOrderDrawer({ order, taller, onClose, onChangeStatus, onSendEstimate, onDeleteOrder, onUpdateNotes, onUpdateReferencias, onSendMessage }) {
  const [tab, setTab] = useState('estimado');
  const [estado, setEstado]             = useState(order.estado);
  const [fechaEntrega, setFechaEntrega] = useState(order.fechaEntrega || '');
  const [numeroPO, setNumeroPO]         = useState(order.numeroPO ?? '');
  const [numeroOrden, setNumeroOrden]   = useState(order.numeroOrden ?? '');
  const [notasInt, setNotasInt]         = useState(order.notasInternas ?? '');
  const [notasEst, setNotasEst]         = useState(order.estimado?.notas ?? '');
  const [archivo, setArchivo]           = useState(order.estimado?.archivo ?? null);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [sending, setSending]           = useState(false);
  const [sent, setSent]                 = useState(false);
  const [sendError, setSendError]       = useState('');
  const [showEmail, setShowEmail]       = useState(false);
  const [copied, setCopied]             = useState(false);
  const msgCount = (order.mensajes || []).length;

  useEffect(() => {
    setEstado(order.estado); setFechaEntrega(order.fechaEntrega || '');
    setNumeroPO(order.numeroPO ?? ''); setNumeroOrden(order.numeroOrden ?? '');
    setNotasInt(order.notasInternas ?? ''); setNotasEst(order.estimado?.notas ?? '');
    setArchivo(order.estimado?.archivo ?? null);
  }, [order.id]); // eslint-disable-line

  const handleSave = async () => {
    setSaving(true);
    try {
      await onChangeStatus(order.id, estado, fechaEntrega || undefined);
      await onUpdateReferencias(order.id, { numeroPO: numeroPO.trim(), numeroOrden: numeroOrden.trim() });
      await onUpdateNotes(order.id, notasInt);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  };

  const handleSendEst = async () => {
    setSending(true); setSendError('');
    try {
      await onSendEstimate(order.id, { notas: notasEst, archivo });
      setSent(true); setTimeout(() => setSent(false), 3000);
    } catch (err) { setSendError('Error: ' + (err.message || err.code)); }
    finally { setSending(false); }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setArchivo({ name: file.name, type: file.type, url: URL.createObjectURL(file), file });
    e.target.value = '';
  };

  const initials = (n) => (n || '').split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0" style={{ background: 'rgba(20,22,26,.5)', animation: 'ppFade .2s ease both' }} onClick={onClose} />
      <div className="relative w-full flex flex-col" style={{ maxWidth: 1020, maxHeight: '90vh', background: '#fff', borderRadius: 20, boxShadow: '0 40px 80px -20px rgba(0,0,0,.35)', animation: 'ppRise .28s cubic-bezier(.2,.8,.2,1) both' }}>

        {/* ── Header ── */}
        <div className="flex items-center gap-4 px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #eef0f2' }}>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[12px] font-semibold" style={{ color: '#9aa1ad' }}>{order.folio || order.id?.slice(0,8)}</div>
            <h2 className="text-[19px] font-bold leading-tight" style={{ color: '#181b21', letterSpacing: '-.02em' }}>{order.vehiculo || '—'}</h2>
          </div>
          <StatusBadge estado={estado} />
          <button onClick={onClose} className="w-9 h-9 rounded-[10px] border flex items-center justify-center hover:bg-stone-50 transition-colors flex-shrink-0" style={{ borderColor: '#e7e9ed', color: '#767d8a' }}>
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-hidden flex min-h-0">

          {/* Columna izquierda */}
          <div className="overflow-y-auto p-6 space-y-4" style={{ flex: '1.6', borderRight: '1px solid #eef0f2' }}>

            {/* Taller */}
            <div className="flex items-center gap-3 rounded-[13px] p-3" style={{ background: '#f8f9fa' }}>
              <div className="w-10 h-10 rounded-[10px] border flex items-center justify-center font-bold text-[14px] flex-shrink-0" style={{ background: '#fff', borderColor: '#e7e9ed', color: '#4a505c' }}>{initials(taller?.nombre)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-bold truncate" style={{ color: '#181b21' }}>{taller?.nombre}</div>
                <div className="text-[12px]" style={{ color: '#8a909c' }}>{taller?.contacto}</div>
              </div>
              {taller?.email && (
                <button onClick={() => setShowEmail(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] border text-[12px] font-semibold hover:bg-stone-50 transition-colors flex-shrink-0" style={{ borderColor: '#e3e5ea', color: '#5b626e' }}>
                  <Mail className="w-3.5 h-3.5" /> Correo
                </button>
              )}
            </div>

            {/* Email expandido */}
            {showEmail && taller?.email && (() => {
              const subject = `Estimado · ${order.vehiculo}`;
              const body = [`Hola ${taller.contacto || ''},`, '', `Estimado para: ${order.vehiculo}`, notasEst ? `Notas: ${notasEst}` : '', '', 'Puedes verlo en Parts Pilot.', '', 'Saludos.'].filter((l, i) => !(i === 3 && !notasEst)).join('\n');
              return (
                <div className="rounded-[12px] p-3 border space-y-2 text-[13px] -mt-2" style={{ background: '#f8f9fa', borderColor: '#e7e9ed' }}>
                  <div><span className="font-semibold" style={{ color: '#767d8a' }}>Para: </span><span>{taller.email}</span></div>
                  <div><span className="font-semibold" style={{ color: '#767d8a' }}>Asunto: </span><span>{subject}</span></div>
                  <textarea readOnly value={body} rows={4} className="w-full text-[12px] rounded-[10px] p-2 resize-none outline-none border" style={{ background: '#fff', borderColor: '#e7e9ed', color: '#5b626e' }} />
                  <button onClick={() => navigator.clipboard.writeText(`Para: ${taller.email}\nAsunto: ${subject}\n\n${body}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); })} className="w-full py-2 rounded-[10px] text-white text-[13px] font-semibold flex items-center justify-center gap-2" style={{ background: '#181b21' }}>
                    {copied ? <><CheckCircle2 className="w-4 h-4" /> ¡Copiado!</> : <><Paperclip className="w-4 h-4" /> Copiar correo</>}
                  </button>
                </div>
              );
            })()}

            {/* Sección detalles */}
            <div>
              <p className="text-[10.5px] font-bold uppercase mb-3" style={{ color: '#9aa1ad', letterSpacing: '.08em' }}>Detalles del pedido</p>
              <div className="space-y-3">
                <FormField label="Estado del pedido">
                  <select value={estado} onChange={e => setEstado(e.target.value)} className={`${inputClass} bg-white`}>
                    {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                  </select>
                </FormField>

                <div>
                  <p className="text-[10.5px] font-bold uppercase mb-2" style={{ color: '#9aa1ad', letterSpacing: '.06em' }}>Progreso</p>
                  <StatusStepper estado={estado} />
                </div>

                {['pedido_fabrica','ordenadas','esperando_piezas','en_transito','recibido','entregado'].includes(estado) && (
                  <FormField label="Fecha estimada de entrega">
                    <input type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} className={inputClass} />
                    {fechaEntrega && <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: '#2563eb' }}><Calendar className="w-3 h-3" /> El taller verá esta fecha en su portal.</p>}
                  </FormField>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="No. PO"><input value={numeroPO} onChange={e => setNumeroPO(e.target.value)} placeholder="ej. Emma" className={inputClass} /></FormField>
                  <FormField label="No. Orden"><input value={numeroOrden} onChange={e => setNumeroOrden(e.target.value)} placeholder="ej. M26243" className={inputClass} /></FormField>
                </div>

                {order.notas && (
                  <div className="rounded-[11px] p-3" style={{ background: '#fef9ec', border: '1px solid #f6ead0' }}>
                    <p className="text-[10.5px] font-bold uppercase mb-1" style={{ color: '#b7791f', letterSpacing: '.05em' }}>Notas del taller</p>
                    <p className="text-[13px]" style={{ color: '#7c5a14' }}>{order.notas}</p>
                  </div>
                )}

                {order.archivo && (
                  <div>
                    <p className="text-[10.5px] font-bold uppercase mb-2" style={{ color: '#9aa1ad', letterSpacing: '.05em' }}>Archivo del taller</p>
                    {order.archivo.type?.startsWith('image/') ? (
                      <a href={order.archivo.url} target="_blank" rel="noreferrer"><img src={order.archivo.url} alt="" className="rounded-lg max-h-32 object-cover" /></a>
                    ) : (
                      <a href={order.archivo.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-[10px] px-3 py-2 border text-[13px] hover:border-[#e8632f] hover:text-[#c9491c] transition-colors" style={{ background: '#f8f9fa', borderColor: '#e7e9ed', color: '#4a505c' }}>
                        <FileText className="w-4 h-4 flex-shrink-0" /><span className="truncate">{order.archivo.name}</span>
                      </a>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-[12.5px] font-semibold" style={{ color: '#4a505c' }}>Notas internas</p>
                    <span className="flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-[6px]" style={{ background: '#f1f3f5', color: '#9aa1ad' }}>🔒 Solo admin</span>
                  </div>
                  <textarea value={notasInt} onChange={e => setNotasInt(e.target.value)} placeholder="Observaciones internas, no visibles para el taller…" rows={3}
                    className="w-full text-[13px] rounded-[10px] p-3 resize-none border outline-none focus:ring-2 focus:ring-[#e8632f]/10 focus:border-[#e8632f]"
                    style={{ background: '#fff', borderColor: '#e3e5ea', color: '#181b21' }} />
                </div>
              </div>
            </div>

            {saved && <div className="flex items-center gap-2 px-3 py-2.5 rounded-[11px] text-[13px] font-semibold" style={{ background: '#eafaf2', color: '#059669' }}><CheckCircle2 className="w-4 h-4" /> Cambios guardados.</div>}

            {/* Notificación piezas listas — solo cuando estado = recibido y taller tiene email */}
            {estado === 'recibido' && taller?.email && (() => {
              const subject = encodeURIComponent(`✅ Piezas listas para entrega — ${order.vehiculo || ''}${order.pieza ? ` (${order.pieza})` : ''}`);
              const body = encodeURIComponent(
                `Hola ${taller.contacto || ''},\n\n` +
                `Te informamos que las piezas de tu pedido están listas en nuestra tienda y esperando la fecha de entrega.\n\n` +
                `📋 Detalles del pedido:\n` +
                `• Vehículo: ${order.vehiculo || '—'}\n` +
                (order.pieza ? `• Pieza: ${order.pieza}\n` : '') +
                (order.numeroPO ? `• No. PO: ${order.numeroPO}\n` : '') +
                (order.numeroOrden ? `• No. Orden: ${order.numeroOrden}\n` : '') +
                `\nPor favor contáctanos para coordinar la fecha y hora de entrega.\n\n` +
                `Saludos,\nDepartamento de Piezas — Parts Pilot`
              );
              return (
                <a
                  href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(taller.email)}&su=${subject}&body=${body}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-[11px] rounded-[11px] text-white font-bold text-[13px] hover:brightness-105 transition-all"
                  style={{ background: 'linear-gradient(160deg, #059669, #047857)', boxShadow: '0 8px 18px -8px rgba(5,150,105,.4)' }}
                >
                  <Mail className="w-4 h-4" />
                  Notificar al taller — piezas listas
                </a>
              );
            })()}

            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving} className="flex-1 py-[13px] rounded-[11px] text-white font-bold text-[14px] hover:brightness-105 disabled:opacity-60" style={{ background: 'linear-gradient(160deg, #e8632f, #cf4d1d)' }}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button onClick={() => { if (window.confirm('¿Eliminar este pedido?')) onDeleteOrder(order.id); }} className="flex items-center gap-2 px-4 py-[13px] rounded-[11px] border text-[13px] font-semibold hover:bg-red-50 hover:text-red-500 transition-colors" style={{ borderColor: '#e3e5ea', color: '#aab0b9' }}>
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </div>
          </div>

          {/* Columna derecha: tabs Estimado | Mensajes */}
          <div className="flex flex-col" style={{ width: 380, flexShrink: 0 }}>
            {/* Tabs */}
            <div className="flex px-6 flex-shrink-0" style={{ borderBottom: '1px solid #eef0f2' }}>
              {[['estimado', FileText, 'Estimado', 0], ['mensajes', MessageSquare, 'Mensajes', msgCount]].map(([id, Icon, lbl, badge]) => (
                <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 px-1 py-3.5 text-[13px] font-semibold border-b-2 mr-5 transition-colors ${tab === id ? 'border-[#e8632f] text-[#181b21]' : 'border-transparent text-[#9aa1ad] hover:text-[#5b626e]'}`}>
                  <Icon className="w-4 h-4" strokeWidth={1.8} /> {lbl}
                  {badge > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5" style={{ background: '#f1f3f5', color: '#5b626e' }}>{badge}</span>}
                </button>
              ))}
            </div>

            {/* Estimado tab */}
            {tab === 'estimado' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Solo mostrar estado de respuesta cuando el pedido está en cotizando */}
                {order.estado === 'cotizando' && order.estimado?.respuesta === 'pendiente' && (
                  <div className="flex items-center gap-2 text-[13px] px-3 py-2.5 rounded-[10px]" style={{ background: '#fef6e9', color: '#b7791f' }}><Clock className="w-4 h-4 flex-shrink-0" /> Esperando respuesta del taller…</div>
                )}
                {order.estimado?.respuesta && order.estimado.respuesta !== 'pendiente' && (
                  <div className="flex items-center gap-2 text-[13px] px-3 py-2.5 rounded-[10px]" style={{ background: order.estimado.respuesta === 'aceptado' ? '#eafaf2' : '#fdecec', color: order.estimado.respuesta === 'aceptado' ? '#059669' : '#dc2626' }}>
                    {order.estimado.respuesta === 'aceptado' ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
                    El taller {order.estimado.respuesta === 'aceptado' ? 'aceptó' : 'rechazó'} este estimado.
                  </div>
                )}
                {sent && <div className="flex items-center gap-2 text-[13px] px-3 py-2.5 rounded-[10px]" style={{ background: '#eafaf2', color: '#059669' }}><CheckCircle2 className="w-4 h-4" /> Estimado enviado.</div>}
                {sendError && <div className="flex items-center gap-2 text-[13px] px-3 py-2.5 rounded-[10px]" style={{ background: '#fdecec', color: '#dc2626' }}><AlertCircle className="w-4 h-4" />{sendError}</div>}

                <FormField label="Notas para el taller">
                  <textarea value={notasEst} onChange={e => setNotasEst(e.target.value)} rows={4} placeholder="Tiempo de entrega, condiciones, precio…" className={`${inputClass} resize-none`} />
                </FormField>

                <div>
                  <p className="text-[12.5px] font-semibold mb-1.5" style={{ color: '#4a505c' }}>PDF del estimado <span style={{ color: '#aab0b9', fontWeight: 400 }}>(opcional)</span></p>
                  {archivo ? (
                    <div className="flex items-center gap-2 rounded-[10px] px-3 py-2.5 border" style={{ background: '#f8f9fa', borderColor: '#e7e9ed' }}>
                      <FileText className="w-4 h-4 flex-shrink-0" style={{ color: '#e8632f' }} />
                      <a href={archivo.url} target="_blank" rel="noreferrer" className="text-[13px] truncate flex-1 hover:underline" style={{ color: '#4a505c' }}>{archivo.name}</a>
                      <span className="text-[11px]" style={{ color: '#aab0b9' }}>{archivo.file ? Math.round(archivo.file.size / 1024) + ' KB' : ''}</span>
                      <button onClick={() => setArchivo(null)} style={{ color: '#aab0b9' }} className="hover:text-red-500 flex-shrink-0"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 border-dashed border rounded-[10px] px-3 py-3 text-[13px] cursor-pointer transition-colors hover:border-[#e8632f] hover:text-[#c9491c]" style={{ borderColor: '#d3d6db', color: '#8a909c' }}>
                      <Paperclip className="w-4 h-4" /> Adjuntar PDF
                      <input type="file" accept="application/pdf" onChange={handleFile} className="hidden" />
                    </label>
                  )}
                </div>

                <button onClick={handleSendEst} disabled={sending} className="w-full py-[11px] rounded-[11px] text-white font-bold text-[13px] hover:brightness-105 disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: '#181b21' }}>
                  <Send className="w-4 h-4" /> {sending ? 'Enviando…' : order.estimado ? 'Actualizar estimado' : 'Enviar estimado al taller'}
                </button>
              </div>
            )}

            {/* Mensajes tab */}
            {tab === 'mensajes' && (
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <OrderChat order={order} role="admin" otherPartyName={taller?.nombre}
                  onSendMessage={(orderId, texto, attachment) => onSendMessage(orderId, texto, 'admin', attachment)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminHistorial({ pedidos, talleres, getTaller, onSelect }) {
  const completados = [...pedidos]
    .filter(p => p.estado === 'entregado')
    .sort((a, b) => {
      const t = f => f?.toDate ? f.toDate().getTime() : new Date(f).getTime();
      return t(b.fecha) - t(a.fecha);
    });

  if (completados.length === 0) return (
    <div className="text-center py-16" style={{ color: '#9aa1ad' }}>
      <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
      <p className="text-sm">No hay órdenes completadas aún.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-[13px]" style={{ color: '#767d8a' }}>
        <strong style={{ color: '#181b21' }}>{completados.length}</strong> orden{completados.length !== 1 ? 'es' : ''} completada{completados.length !== 1 ? 's' : ''}
      </p>
      <div className="rounded-[16px] overflow-hidden border" style={{ background: '#fff', borderColor: '#e7e9ed' }}>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid #eef0f2' }}>
              {['Folio', 'Taller', 'Vehículo / Pieza', 'Fecha', 'Entrega'].map((h, i) => (
                <th key={h} className={`text-left py-3 text-[10.5px] font-bold uppercase ${i === 0 ? 'pl-6' : 'px-3'} ${i === 4 ? 'pr-6' : ''}`} style={{ color: '#9aa1ad', letterSpacing: '.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {completados.map(p => (
              <tr key={p.id} onClick={() => onSelect(p.id)} className="cursor-pointer hover:bg-[#fafbfc] transition-colors" style={{ borderTop: '1px solid #f1f2f4' }}>
                <td className="py-3.5 pl-6 pr-3 font-mono text-[12.5px] font-semibold whitespace-nowrap" style={{ color: '#181b21' }}>{p.folio || p.id.slice(0,8)}</td>
                <td className="py-3.5 px-3 text-[13px] max-w-[150px] truncate" style={{ color: '#4a505c' }}>{getTaller(p.tallerId)?.nombre || '—'}</td>
                <td className="py-3.5 px-3">
                  <div className="text-[13px] font-semibold" style={{ color: '#181b21' }}>{p.vehiculo || '—'}</div>
                  {p.pieza && <div className="text-[11.5px]" style={{ color: '#8a909c' }}>{p.pieza}</div>}
                </td>
                <td className="py-3.5 px-3 text-[12.5px] whitespace-nowrap" style={{ color: '#767d8a' }}>{formatDate(p.fecha)}</td>
                <td className="py-3.5 pr-6 px-3 text-[12.5px] whitespace-nowrap" style={{ color: p.fechaEntrega ? '#059669' : '#aab0b9' }}>
                  {p.fechaEntrega ? formatDate(p.fechaEntrega) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminApp({ pedidos, talleres, facturas, equipo, tallerUsuarios, perfil, currentUid, onLogout, onChangeStatus, onSendEstimate, onCreateOrder, onCreateCotizacion, onSendMessage, onCreateTaller, onDeleteTaller, onDeleteOrder, onUpdateTaller, onUpdateNotes, onUpdateReferencias, onAgregarFactura, onActualizarFactura, onEliminarFactura, onCrearAdmin, onActualizarAdmin, onEliminarAdmin, onCrearSubUsuario, onEliminarSubUsuario, onActualizarSubUsuario }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedId, setSelectedId] = useState(null);
  const [filterTaller, setFilterTaller] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [search, setSearch] = useState('');
  const [showReporte, setShowReporte] = useState(false);

  // Permisos: si perfil no tiene 'permisos' = superadmin con acceso total
  const isSuperadmin = !perfil?.permisos;
  const canView = (mod) => isSuperadmin || ['view', 'edit'].includes(perfil?.permisos?.[mod] ?? 'none');
  const canEdit = (mod) => isSuperadmin || perfil?.permisos?.[mod] === 'edit';
  const canManageEquipo = isSuperadmin || perfil?.permisos?.equipo === true;

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const getTaller = (id) => talleres.find(t => t.uid === id);
  const selectedOrder = pedidos.find(p => p.id === selectedId);

  const solicitudes  = pedidos.filter(p => p.tipo === 'solicitud');
  const cotizando    = pedidos.filter(p => (p.tipo === 'pedido' || !p.tipo) && p.estado === 'cotizando');
  const enEstimados  = [...solicitudes, ...cotizando];
  const todosPedidos = pedidos.filter(p => p.tipo === 'pedido' || !p.tipo);
  const solosPedidos = todosPedidos.filter(p => p.estado !== 'entregado' && p.estado !== 'cotizando');

  const filteredPedidos = solosPedidos.filter(p => {
    if (filterTaller !== 'todos' && String(p.tallerId) !== filterTaller) return false;
    if (filterEstado !== 'todos' && p.estado !== filterEstado) return false;
    if (search && !`${p.referencia || ''} ${p.vehiculo} ${p.folio || ''} ${p.id}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const PAGE_META = {
    dashboard:  { title: 'Resumen',           sub: 'Vista general de la operación' },
    pedidos:    { title: 'Pedidos',            sub: `${solosPedidos.length} pedidos en total` },
    estimados:  { title: 'Estimados',          sub: 'Solicitudes esperando cotización' },
    talleres:   { title: 'Talleres',           sub: `${talleres.length} talleres registrados` },
    nuevo:      { title: 'Nuevo pedido',       sub: 'Registra un folio a nombre de un taller' },
    cotizacion: { title: 'Nueva cotización',   sub: 'Crea una cotización con estimado incluido' },
    facturas:   { title: 'Facturas',           sub: 'Cuentas corrientes por taller y marca' },
    equipo:     { title: 'Equipo',             sub: 'Usuarios y permisos de acceso' },
    historial:  { title: 'Historial',          sub: 'Órdenes completadas' },
  };
  const meta = PAGE_META[activeTab] || PAGE_META.dashboard;

  const goTo = (tab) => { setActiveTab(tab); setSelectedId(null); };

  const selectOrder = (id) => {
    const order = pedidos.find(p => p.id === id);
    if (order) saveOrderSeen('admin', order);
    setSelectedId(id);
  };

  const mainContent = (
    <div className="flex-1 min-w-0 flex flex-col">
      {!isMobile && (
        <AdminTopbar
          pageTitle={PAGE_META[activeTab]?.title || 'Resumen'}
          pageSub={PAGE_META[activeTab]?.sub || ''}
          solicitudesCount={enEstimados.length}
          onGoToNuevo={() => goTo('nuevo')}
        />
      )}
      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24" style={{ paddingLeft: isMobile ? 16 : 30, paddingRight: isMobile ? 16 : 30, paddingTop: isMobile ? 16 : 28 }}>
        <div className="max-w-[1180px] mx-auto">
          {activeTab === 'dashboard' && <AdminDashboard pedidos={solosPedidos} solicitudes={solicitudes} talleres={talleres} getTaller={getTaller} onSelect={selectOrder} onGoToPedidos={() => goTo('pedidos')} onGoToEstimados={() => goTo('estimados')} onGoToNuevo={() => goTo('nuevo')} onShowReporte={() => setShowReporte(true)} />}
          {activeTab === 'pedidos' && <AdminPedidos pedidos={filteredPedidos} talleres={talleres} getTaller={getTaller} filterTaller={filterTaller} setFilterTaller={setFilterTaller} filterEstado={filterEstado} setFilterEstado={setFilterEstado} search={search} setSearch={setSearch} onSelect={selectOrder} onExport={() => setShowReporte(true)} />}
          {activeTab === 'estimados' && <AdminEstimados solicitudes={enEstimados} getTaller={getTaller} onSelect={selectOrder} />}
          {activeTab === 'talleres' && <AdminTalleres talleres={talleres} pedidos={pedidos} tallerUsuarios={tallerUsuarios} onCreateTaller={onCreateTaller} onDeleteTaller={onDeleteTaller} onUpdateTaller={onUpdateTaller} onVerPedidos={(tallerId) => { setFilterTaller(String(tallerId)); setFilterEstado('todos'); setSearch(''); goTo('pedidos'); }} onCrearSubUsuario={onCrearSubUsuario} onEliminarSubUsuario={onEliminarSubUsuario} onActualizarSubUsuario={onActualizarSubUsuario} />}
          {activeTab === 'nuevo' && <AdminNuevoPedido talleres={talleres} onCreate={(data) => { onCreateOrder(data); goTo('pedidos'); }} />}
          {activeTab === 'cotizacion' && <AdminNuevaCotizacion talleres={talleres} onCreate={async (data) => { await onCreateCotizacion(data); goTo('pedidos'); }} />}
          {activeTab === 'facturas' && <AdminFacturas facturas={facturas} talleres={talleres} onAgregar={onAgregarFactura} onActualizar={onActualizarFactura} onEliminar={onEliminarFactura} onUpdateTaller={onUpdateTaller} readOnly={!canEdit('facturas')} />}
          {activeTab === 'equipo' && canManageEquipo && <AdminEquipo equipo={equipo} currentUid={currentUid} perfil={perfil} onCrear={onCrearAdmin} onActualizar={onActualizarAdmin} onEliminar={onEliminarAdmin} />}
          {activeTab === 'historial' && <AdminHistorial pedidos={todosPedidos} talleres={talleres} getTaller={getTaller} onSelect={selectOrder} />}
        </div>
      </main>
    </div>
  );

  /* Layout móvil admin */
  if (isMobile) {
    const mobileNav = [
      { id: 'dashboard', label: 'Resumen',   icon: LayoutDashboard },
      canView('pedidos')   && { id: 'pedidos',  label: 'Pedidos',   icon: ClipboardList, badge: solosPedidos.length },
      canView('estimados') && { id: 'estimados',label: 'Estimados', icon: FileText, badge: solicitudes.length, accent: true },
      canView('facturas')  && { id: 'facturas',  label: 'Facturas',  icon: Receipt },
      canView('pedidos')   && { id: 'historial', label: 'Historial', icon: History },
    ].filter(Boolean);

    return (
      <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
        {/* Header móvil admin */}
        <div className="safe-top" style={{ background: '#141619' }}>
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(160deg, #e8632f, #c9491c)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2.5 21 19.5 12 15.2 3 19.5 12 2.5Z" fill="#fff"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-extrabold leading-none" style={{ color: '#fff' }}>Parts Pilot</div>
              <div className="text-[10px] font-bold uppercase mt-0.5" style={{ color: '#6a7180', letterSpacing: '.04em' }}>Admin</div>
            </div>
            <button onClick={onLogout} className="w-8 h-8 rounded-[9px] flex items-center justify-center" style={{ background: '#262a31', color: '#9aa1ad' }}>
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.9} />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <main className="pb-24 px-4 py-4">
          <div className="max-w-2xl mx-auto">
            {activeTab === 'dashboard' && <AdminDashboard pedidos={solosPedidos} solicitudes={solicitudes} talleres={talleres} getTaller={getTaller} onSelect={selectOrder} onGoToPedidos={() => goTo('pedidos')} onGoToEstimados={() => goTo('estimados')} onGoToNuevo={() => goTo('nuevo')} onShowReporte={() => setShowReporte(true)} />}
            {activeTab === 'pedidos' && <AdminPedidos pedidos={filteredPedidos} talleres={talleres} getTaller={getTaller} filterTaller={filterTaller} setFilterTaller={setFilterTaller} filterEstado={filterEstado} setFilterEstado={setFilterEstado} search={search} setSearch={setSearch} onSelect={selectOrder} onExport={() => setShowReporte(true)} />}
            {activeTab === 'estimados' && <AdminEstimados solicitudes={enEstimados} getTaller={getTaller} onSelect={selectOrder} />}
            {activeTab === 'talleres' && <AdminTalleres talleres={talleres} pedidos={pedidos} tallerUsuarios={tallerUsuarios} onCreateTaller={onCreateTaller} onDeleteTaller={onDeleteTaller} onUpdateTaller={onUpdateTaller} onVerPedidos={(tallerId) => { setFilterTaller(String(tallerId)); setFilterEstado('todos'); setSearch(''); goTo('pedidos'); }} onCrearSubUsuario={onCrearSubUsuario} onEliminarSubUsuario={onEliminarSubUsuario} onActualizarSubUsuario={onActualizarSubUsuario} />}
            {activeTab === 'nuevo' && <AdminNuevoPedido talleres={talleres} onCreate={(data) => { onCreateOrder(data); goTo('pedidos'); }} />}
            {activeTab === 'cotizacion' && <AdminNuevaCotizacion talleres={talleres} onCreate={async (data) => { await onCreateCotizacion(data); goTo('pedidos'); }} />}
            {activeTab === 'facturas' && <AdminFacturas facturas={facturas} talleres={talleres} onAgregar={onAgregarFactura} onActualizar={onActualizarFactura} onEliminar={onEliminarFactura} onUpdateTaller={onUpdateTaller} readOnly={!canEdit('facturas')} />}
            {activeTab === 'equipo' && canManageEquipo && <AdminEquipo equipo={equipo} currentUid={currentUid} perfil={perfil} onCrear={onCrearAdmin} onActualizar={onActualizarAdmin} onEliminar={onEliminarAdmin} />}
          {activeTab === 'historial' && <AdminHistorial pedidos={todosPedidos} talleres={talleres} getTaller={getTaller} onSelect={selectOrder} />}
          </div>
        </main>

        {/* Bottom nav móvil admin */}
        <div className="fixed bottom-0 left-0 right-0 z-20 safe-bottom" style={{ background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(12px)', borderTop: '1px solid #e7e9ed' }}>
          <div className="flex items-end justify-between px-2 pt-2 pb-2">
            {mobileNav.map(({ id, label, icon: Icon, badge, accent }) => {
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => goTo(id)} className="flex flex-col items-center gap-1 flex-1 relative pt-1">
                  <div className="relative">
                    <Icon className="w-[22px] h-[22px]" strokeWidth={1.9} style={{ color: active ? '#e8632f' : '#9aa1ad' }} />
                    {badge > 0 && <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: accent ? '#e8632f' : '#6b7280' }}>{badge}</span>}
                  </div>
                  <span className="text-[9.5px] font-semibold" style={{ color: active ? '#e8632f' : '#9aa1ad' }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedOrder && (
          <AdminOrderDrawer
            order={selectedOrder}
            taller={getTaller(selectedOrder.tallerId)}
            onClose={() => setSelectedId(null)}
            onChangeStatus={onChangeStatus}
            onSendEstimate={onSendEstimate}
            onDeleteOrder={async (id) => { await onDeleteOrder(id); setSelectedId(null); }}
            onUpdateNotes={onUpdateNotes}
            onUpdateReferencias={onUpdateReferencias}
            onSendMessage={onSendMessage}
          />
        )}
        {showReporte && <ReporteModal pedidos={pedidos} talleres={talleres} onClose={() => setShowReporte(false)} />}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#f4f5f7' }}>
      <AdminSidebar
        activeTab={activeTab}
        onChange={goTo}
        solicitudesCount={enEstimados.length}
        pedidosCount={solosPedidos.length}
        onLogout={onLogout}
        canView={canView}
        canEdit={canEdit}
        canManageEquipo={canManageEquipo}
      />
      {mainContent}
      {selectedOrder && (
        <AdminOrderDrawer
          order={selectedOrder}
          taller={getTaller(selectedOrder.tallerId)}
          onClose={() => setSelectedId(null)}
          onChangeStatus={onChangeStatus}
          onSendEstimate={onSendEstimate}
          onDeleteOrder={async (id) => { await onDeleteOrder(id); setSelectedId(null); }}
          onUpdateNotes={onUpdateNotes}
          onUpdateReferencias={onUpdateReferencias}
          onSendMessage={onSendMessage}
        />
      )}
      {showReporte && <ReporteModal pedidos={pedidos} talleres={talleres} onClose={() => setShowReporte(false)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  VISTA TALLER (CLIENTE)                                             */
/* ------------------------------------------------------------------ */

function EstimateCard({ order }) {
  const { estimado } = order;
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <div className="mb-2">
        <h3 className="font-semibold text-stone-900 truncate">{order.referencia || order.vehiculo}</h3>
        {order.referencia && <p className="text-sm text-stone-500 truncate">{order.vehiculo}</p>}
      </div>
      {estimado.notas && <p className="text-sm text-stone-600 mb-3 bg-stone-50 rounded-lg p-2">{estimado.notas}</p>}
      {estimado.archivo && (
        <a href={estimado.archivo.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 hover:border-orange-300 hover:text-orange-600 transition-colors mb-3">
          <FileText className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{estimado.archivo.name}</span>
        </a>
      )}
      <EstimateActions order={order} />
    </div>
  );
}

function EstimateActions({ order, onRespond }) {
  const { estimado } = order;
  const canRespond = estimado.respuesta === 'pendiente' && order.estado === 'cotizando';

  if (canRespond) {
    return (
      <div className="flex gap-2">
        <button onClick={() => onRespond(order.id, 'aceptado')} className="flex-1 py-[11px] rounded-[11px] text-white text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors" style={{ background: '#10b981' }}>
          <ThumbsUp className="w-4 h-4" /> Aceptar
        </button>
        <button onClick={() => onRespond(order.id, 'rechazado')} className="flex-1 py-[11px] rounded-[11px] text-[13px] font-semibold flex items-center justify-center gap-1.5 border transition-colors hover:bg-stone-50" style={{ background: '#fff', borderColor: '#e3e5ea', color: '#5b626e' }}>
          <ThumbsDown className="w-4 h-4" /> Rechazar
        </button>
      </div>
    );
  }

  if (estimado.respuesta === 'rechazado') {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] text-[13px] font-semibold" style={{ background: '#fdecec', color: '#dc2626' }}>
        <ThumbsDown className="w-4 h-4 flex-shrink-0" /> Rechazaste este estimado
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] text-[13px] font-semibold" style={{ background: '#eafaf2', color: '#059669' }}>
      <ThumbsUp className="w-4 h-4 flex-shrink-0" /> Estimado aceptado
    </div>
  );
}

function ClientEstimados({ solicitudes, cotizaciones = [], onRespond }) {
  const total = solicitudes.length + cotizaciones.length;
  if (total === 0) return (
    <div className="text-center py-14 text-stone-400">
      <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
      <p className="text-sm font-medium text-stone-500">No tienes solicitudes ni cotizaciones pendientes.</p>
      <p className="text-xs mt-1">Usa "Solicitar Estimado" para enviar una nueva solicitud al depto. de piezas.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Cotizaciones recibidas del admin — por responder */}
      {cotizaciones.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Cotizaciones por responder · {cotizaciones.length}
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {cotizaciones.map(p => (
              <div key={p.id} className="bg-white border border-orange-200 ring-1 ring-orange-50 rounded-xl p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-stone-900 truncate">{p.vehiculo}</h3>
                  {(p.numeroPO || p.numeroOrden) && (
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {p.numeroPO && <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-medium">PO# {p.numeroPO}</span>}
                      {p.numeroOrden && <span className="text-[11px] bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-md font-medium">Orden {p.numeroOrden}</span>}
                    </div>
                  )}
                  {p.referencia && !p.numeroPO && !p.numeroOrden && (
                    <p className="text-xs text-stone-400 mt-0.5">{p.referencia}</p>
                  )}
                </div>
                {p.estimado?.notas && (
                  <p className="text-sm text-stone-600 bg-stone-50 rounded-lg p-2.5">{p.estimado.notas}</p>
                )}
                {p.estimado?.archivo && (
                  <a href={p.estimado.archivo.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 hover:border-orange-300 hover:text-orange-600 transition-colors">
                    <FileText className="w-4 h-4 flex-shrink-0" /><span className="truncate">{p.estimado.archivo.name}</span>
                  </a>
                )}
                <div className="flex gap-2">
                  <button onClick={() => onRespond(p.id, 'aceptado')} className="flex-1 py-[11px] rounded-[11px] text-white text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors hover:brightness-105" style={{ background: '#10b981' }}>
                    <ThumbsUp className="w-4 h-4" /> Aceptar
                  </button>
                  <button onClick={() => onRespond(p.id, 'rechazado')} className="flex-1 py-[11px] rounded-[11px] text-[13px] font-semibold border flex items-center justify-center gap-1.5 transition-colors hover:bg-stone-50" style={{ background: '#fff', borderColor: '#e3e5ea', color: '#5b626e' }}>
                    <ThumbsDown className="w-4 h-4" /> Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solicitudes enviadas — esperando respuesta del proveedor */}
      {solicitudes.length > 0 && (
        <div className="space-y-3">
          {cotizaciones.length > 0 && (
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Solicitudes enviadas · {solicitudes.length}</p>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            {[...solicitudes].sort((a, b) => {
              const t = f => f?.toDate ? f.toDate().getTime() : new Date(f + 'T00:00:00').getTime();
              return t(b.fecha) - t(a.fecha);
            }).map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-stone-900 truncate">{p.vehiculo}</h3>
                  </div>
                  <StatusBadge estado={p.estado} />
                </div>
                {p.notas && <p className="text-sm text-stone-600 bg-stone-50 rounded-lg p-2.5 mb-2.5">{p.notas}</p>}
                {p.archivo && (
                  <a href={p.archivo.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 hover:border-orange-300 hover:text-orange-600 transition-colors mb-2.5">
                    <FileText className="w-4 h-4 flex-shrink-0" /><span className="truncate">{p.archivo.name}</span>
                  </a>
                )}
                <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
                  <Clock className="w-3.5 h-3.5" /> Esperando estimado · {formatDate(p.fecha)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ClientNuevaSolicitud({ onCreate }) {
  const [form, setForm] = useState({ vehiculo: '', notas: '' });
  const [archivo, setArchivo] = useState(null);
  const [done, setDone] = useState(false);

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivo({ name: file.name, type: file.type, url: URL.createObjectURL(file), file });
    e.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ ...form, archivo });
    setForm({ vehiculo: '', notas: '' });
    setArchivo(null);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <div className="max-w-lg">
      <h2 className="font-semibold text-stone-900 mb-1 text-lg">Solicitar Estimado</h2>
      <p className="text-sm text-stone-500 mb-4">El departamento de piezas recibirá tu solicitud y te enviará un estimado.</p>
      {done && (
        <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Solicitud enviada correctamente.
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-5 space-y-4">
        <FormField label="Vehículo">
          <input value={form.vehiculo} onChange={e => handleChange('vehiculo', e.target.value)} placeholder="ej. Honda Civic 2021" className={inputClass} required />
        </FormField>
        <FormField label="Notas adicionales">
          <textarea value={form.notas} onChange={e => handleChange('notas', e.target.value)} rows={3} placeholder="Color, urgencia, observaciones..." className={`${inputClass} resize-none`} />
        </FormField>
        <FormField label="Foto o archivo (opcional)">
          {archivo ? (
            <div className="flex items-center justify-between gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
              {archivo.type?.startsWith('image/') ? (
                <img src={archivo.url} alt={archivo.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <FileText className="w-5 h-5 text-stone-500 flex-shrink-0" />
              )}
              <span className="text-sm text-stone-700 truncate flex-1">{archivo.name}</span>
              <button type="button" onClick={() => setArchivo(null)} className="text-stone-400 hover:text-red-500 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 border border-dashed border-stone-300 rounded-lg px-3 py-2.5 text-sm text-stone-500 hover:border-orange-300 hover:text-orange-600 cursor-pointer transition-colors">
              <Paperclip className="w-4 h-4" /> Adjuntar foto o PDF
              <input type="file" accept="image/*,application/pdf" onChange={handleFile} className="hidden" />
            </label>
          )}
        </FormField>
        <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition-colors">
          Enviar solicitud
        </button>
      </form>
    </div>
  );
}

function ClientProgressBar({ estado }) {
  const idx = STATUS_ORDER.indexOf(estado);
  const pct = Math.round((idx / (STATUS_ORDER.length - 1)) * 100);
  return (
    <div>
      <div className="flex justify-between text-[11px] text-stone-400 mb-1.5">
        <span>Inicio</span>
        <span className="font-medium text-stone-600">{STATUS_CONFIG[estado].label}</span>
        <span>Entregado</span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ClientHistorial({ pedidos, onSelect }) {
  const toMs = f => f?.toDate ? f.toDate().getTime() : new Date(f).getTime();
  const sorted = [...pedidos].sort((a, b) => toMs(b.fecha) - toMs(a.fecha));
  if (sorted.length === 0) return <EmptyState text="Aún no tienes órdenes completadas." />;
  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-400">{sorted.length} orden{sorted.length !== 1 ? 'es' : ''} completada{sorted.length !== 1 ? 's' : ''}</p>
      {sorted.map(p => (
        <button key={p.id} onClick={() => onSelect(p.id)} className="w-full text-left bg-white border border-stone-200 rounded-xl p-4 hover:border-orange-300 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-stone-900 truncate">{p.referencia || p.vehiculo}</h3>
              {p.referencia && <p className="text-sm text-stone-500 truncate">{p.vehiculo}</p>}
            </div>
            <StatusBadge estado={p.estado} />
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dashed border-stone-200 text-xs text-stone-400">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(p.fecha)}</span>
            {p.folio && <span className="font-mono font-medium text-stone-500">{p.folio}</span>}
            <span className="flex items-center gap-1 ml-auto text-teal-600"><CheckCheck className="w-3.5 h-3.5" />Completada</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function ClientPerfil({ taller, onUpdate, isSubUser = false }) {
  const [form, setForm] = useState({ nombre: taller.nombre || '', contacto: taller.contacto || '', telefono: taller.telefono || '', email: taller.email || '' });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await onUpdate(form);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    } finally { setSaving(false); }
  };

  const initials = (n) => (n || '').split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'T';

  return (
    <div className="flex flex-col items-center py-4">
      {/* Avatar */}
      <div className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center text-[24px] font-extrabold mb-3" style={{ background: 'linear-gradient(150deg, #f3f4f6, #e3e6ea)', color: '#4a505c' }}>
        {initials(taller.nombre)}
      </div>
      <h2 className="text-[17px] font-bold mb-0.5" style={{ color: '#181b21' }}>{taller.nombre || 'Mi taller'}</h2>
      <p className="text-[13px] mb-6" style={{ color: '#767d8a' }}>{taller.contacto || ''}</p>

      <div className="w-full max-w-md">
        {done && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-[11px] text-[13px] font-semibold" style={{ background: '#eafaf2', color: '#059669' }}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Cambios guardados.
          </div>
        )}
        <form onSubmit={handleSubmit} className="rounded-[16px] p-[18px] space-y-4 border" style={{ background: '#fff', borderColor: '#e7e9ed' }}>
          {isSubUser ? (
            /* Sub-usuario: solo edita su propio nombre */
            <>
              <div className="px-3 py-2.5 rounded-[11px] text-[12.5px]" style={{ background: '#f8f9fa', color: '#767d8a' }}>
                Eres usuario de <strong style={{ color: '#181b21' }}>{taller.nombre}</strong>. Solo puedes editar tu nombre.
              </div>
              <FormField label="Tu nombre">
                <input value={form.contacto} onChange={e => set('contacto', e.target.value)} className={inputClass} required />
              </FormField>
            </>
          ) : (
            /* Cuenta principal: edita todos los datos del taller */
            <>
              <FormField label="Nombre del taller"><input value={form.nombre} onChange={e => set('nombre', e.target.value)} className={inputClass} required /></FormField>
              <FormField label="Contacto"><input value={form.contacto} onChange={e => set('contacto', e.target.value)} className={inputClass} /></FormField>
              <FormField label="Teléfono"><input value={form.telefono} onChange={e => set('telefono', e.target.value)} className={inputClass} /></FormField>
              <FormField label="Correo electrónico"><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputClass} /></FormField>
            </>
          )}
          {error && <div className="text-[13px] px-3 py-2.5 rounded-[11px]" style={{ background: '#fdecec', color: '#dc2626' }}>{error}</div>}
          <button type="submit" disabled={saving} className="w-full py-[13px] rounded-[11px] text-white font-bold text-[14px] transition-all hover:brightness-105 disabled:opacity-60" style={{ background: '#181b21' }}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ClientOrderDetail({ order, onRespond }) {
  const handlePrint = () => {
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pedido ${order.folio || order.id.slice(0,8)}</title>
    <style>body{font-family:sans-serif;padding:32px;color:#1c1917}h1{font-size:18px;margin-bottom:4px}p{margin:4px 0;font-size:14px;color:#57534e}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px}th{text-align:left;padding:8px 10px;background:#f5f5f4;font-weight:600}td{padding:8px 10px;border-bottom:1px solid #e7e5e4}.badge{display:inline-block;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:600;background:#f0fdf4;color:#15803d}</style>
    </head><body>
    <h1>${order.referencia || order.vehiculo}</h1>
    <p>${order.referencia ? order.vehiculo : ''}</p>
    <table><tr><th>Folio</th><td>${order.folio || order.id.slice(0,8)}</td></tr>
    <tr><th>Vehículo</th><td>${order.vehiculo || '—'}</td></tr>
    <tr><th>Estado</th><td>${STATUS_CONFIG[order.estado]?.label || order.estado}</td></tr>
    <tr><th>Fecha registro</th><td>${order.fecha ? new Date(order.fecha?.toDate ? order.fecha.toDate() : order.fecha).toLocaleDateString('es-MX') : '—'}</td></tr>
    ${order.fechaEntrega ? `<tr><th>Entrega estimada</th><td>${new Date(order.fechaEntrega + 'T00:00:00').toLocaleDateString('es-MX')}</td></tr>` : ''}
    ${order.notas ? `<tr><th>Notas</th><td>${order.notas}</td></tr>` : ''}
    ${order.estimado?.notas ? `<tr><th>Estimado</th><td>${order.estimado.notas}</td></tr>` : ''}
    </table></body></html>`);
    w.document.close(); w.print();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-lg text-stone-900">{order.referencia || order.vehiculo}</h3>
          {order.referencia && <p className="text-stone-500 text-sm">{order.vehiculo}</p>}
        </div>
        <button onClick={handlePrint} className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 border border-stone-200 rounded-lg px-2.5 py-1.5 hover:bg-stone-50 transition-colors flex-shrink-0">
          <Printer className="w-3.5 h-3.5" /> Imprimir
        </button>
      </div>

      <ClientProgressBar estado={order.estado} />

      <div className="grid grid-cols-2 gap-2 text-sm">
        <InfoItem label="Fecha" value={formatDate(order.fecha)} />
        <InfoItem label="Folio" value={order.folio || order.id.slice(0, 8)} />
        {order.fechaEntrega && <InfoItem label="Entrega est." value={formatDate(order.fechaEntrega)} />}
      </div>

      {order.fechaEntrega && ['pedido_fabrica','en_transito','recibido'].includes(order.estado) && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-blue-600 font-medium">Fecha estimada de entrega</p>
            <p className="font-bold text-blue-900">{formatDate(order.fechaEntrega)}</p>
          </div>
        </div>
      )}

      {order.notas && (
        <div className="bg-stone-50 rounded-lg p-3 text-sm text-stone-600">
          <p className="font-medium text-stone-700 mb-1">Tus notas</p>
          {order.notas}
        </div>
      )}

      <div>
        <p className="font-medium text-stone-700 text-sm mb-3">Estatus del pedido</p>
        <StatusStepper estado={order.estado} />
      </div>

      {order.estimado && (
        <div className="border-t border-dashed border-stone-200 pt-4">
          <p className="font-medium text-stone-700 text-sm mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Estimado recibido</p>
          <div className="bg-stone-50 rounded-lg p-3 mb-3 space-y-2">
            {order.estimado.notas ? (
              <p className="text-sm text-stone-700">{order.estimado.notas}</p>
            ) : (
              <p className="text-sm text-stone-400 italic">Sin notas adicionales.</p>
            )}
            {order.estimado.archivo && (
              <a href={order.estimado.archivo.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 hover:border-orange-300 hover:text-orange-600 transition-colors">
                <FileText className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{order.estimado.archivo.name}</span>
              </a>
            )}
          </div>
          <EstimateActions order={order} onRespond={onRespond} />
        </div>
      )}
    </div>
  );
}

function ClientApp({ taller, pedidos, facturas, onLogout, onCreateOrder, onRespondEstimate, onSendMessage, onUpdateTaller, onUpdateSubUsuario }) {
  const [activeTab, setActiveTab] = useState('pedidos');
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');

  const solicitudes = pedidos.filter(p => p.tipo === 'solicitud');
  const misPedidos = pedidos.filter(p => p.tipo === 'pedido' || !p.tipo);
  const pedidosActivos = misPedidos.filter(p => p.estado !== 'entregado' && p.estado !== 'cotizando');
  const pedidosHistorial = misPedidos.filter(p => p.estado === 'entregado');
  const cotizacionesPendientes = misPedidos.filter(p => p.estado === 'cotizando');
  const toMs = f => f?.toDate ? f.toDate().getTime() : new Date(f).getTime();
  const pedidosOrdenados = [...pedidosActivos].sort((a, b) => toMs(b.fecha) - toMs(a.fecha));
  const pedidosFiltrados = search
    ? pedidosOrdenados.filter(p => `${p.referencia || ''} ${p.vehiculo} ${p.folio || ''} ${p.numeroPO || ''} ${p.numeroOrden || ''}`.toLowerCase().includes(search.toLowerCase()))
    : pedidosOrdenados;

  const selectedOrder = pedidos.find(p => p.id === selectedId);
  const estimadosPorResponder = misPedidos.filter(p => p.estimado?.respuesta === 'pendiente').length;

  const getSeenCount = (id) => parseInt(localStorage.getItem(`pp_seen_${id}`) || '0');
  const markSeen = (order) => {
    const n = (order.mensajes || []).filter(m => m.from === 'admin').length;
    localStorage.setItem(`pp_seen_${order.id}`, String(n));
  };
  const getUnread = (order) => Math.max(0, (order.mensajes || []).filter(m => m.from === 'admin').length - getSeenCount(order.id));

  const handleSelect = (id) => {
    const order = pedidos.find(p => p.id === id);
    if (order) { markSeen(order); saveOrderSeen('taller', order); }
    setSelectedId(id);
  };

  const totalEstimados = solicitudes.length + cotizacionesPendientes.length;

  const goTab = (t) => { setActiveTab(t); setSelectedId(null); setSearch(''); };

  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const bottomNav = [
    { id: 'pedidos',   label: 'Pedidos',   icon: ClipboardList },
    { id: 'estimados', label: 'Estimados', icon: FileText, badge: totalEstimados },
    { id: 'nueva',     label: 'Solicitar', icon: Plus, center: true },
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'perfil',    label: 'Perfil',    icon: UserCircle },
  ];

  const initials = (n) => (n || '').split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'T';

  const sideNavItems = [
    { id: 'pedidos',   label: 'Mis pedidos', icon: ClipboardList, badge: 0 },
    { id: 'estimados', label: 'Estimados',   icon: FileText,      badge: totalEstimados, accent: true },
    { id: 'facturas',  label: 'Facturas',    icon: Receipt },
    { id: 'historial', label: 'Historial',   icon: History },
    { id: 'perfil',    label: 'Mi Perfil',   icon: UserCircle },
  ];

  const contentView = (
    <>
      {/* Mini stats — financieras en facturas, de pedidos en el resto */}
      {activeTab === 'facturas' ? (() => {
        const af = facturas.filter(f => !f.archivada);
        const totV = af.reduce((s,f)=>s+Number(f.valor||0),0);
        const totP = af.reduce((s,f)=>s+Number(f.pagado||0),0);
        const totPend = af.reduce((s,f)=>s+Number(f.pendiente||0),0);
        return (
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { val: fmtCur(totV),    label: 'Total facturas', color: '#181b21' },
              { val: fmtCur(totP),    label: 'Pagado',         color: '#059669' },
              { val: fmtCur(totPend), label: 'Pendiente',      color: totPend > 0 ? '#b7791f' : '#0d9488' },
            ].map(({ val, label, color }) => (
              <div key={label} className="rounded-[14px] px-3 py-3 text-center border" style={{ background: '#fff', borderColor: '#e7e9ed' }}>
                <p className="text-[15px] font-extrabold leading-none truncate" style={{ color }}>{val}</p>
                <p className="text-[11px] mt-1 font-medium" style={{ color: '#8a909c' }}>{label}</p>
              </div>
            ))}
          </div>
        );
      })() : (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { val: pedidosActivos.length,  label: 'Activos',     color: '#e8632f' },
            { val: totalEstimados,         label: 'Estimados',   color: totalEstimados > 0 ? '#b7791f' : '#d1d5db' },
            { val: pedidosHistorial.length,label: 'Completados', color: '#0d9488' },
          ].map(({ val, label, color }) => (
            <div key={label} className="rounded-[14px] px-3 py-3 text-center border" style={{ background: '#fff', borderColor: '#e7e9ed' }}>
              <p className="text-[24px] font-extrabold leading-none" style={{ color }}>{val}</p>
              <p className="text-[11px] mt-1 font-medium" style={{ color: '#8a909c' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'pedidos' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9aa1ad' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por vehículo, referencia o folio…" className="w-full pl-10 pr-4 py-[11px] rounded-[12px] border text-[13.5px] outline-none focus:border-[#e8632f] focus:ring-2 focus:ring-[#e8632f]/10" style={{ background: '#fff', borderColor: '#e3e5ea' }} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {pedidosFiltrados.length === 0
              ? <div className="col-span-2"><EmptyState text={search ? 'Sin resultados.' : 'Aún no tienes pedidos activos.'} /></div>
              : pedidosFiltrados.map(p => <OrderCard key={p.id} order={p} onClick={() => handleSelect(p.id)} unreadCount={getUnread(p)} activityRole="taller" />)
            }
          </div>
        </div>
      )}
      {activeTab === 'historial' && <ClientHistorial pedidos={pedidosHistorial} onSelect={handleSelect} />}
      {activeTab === 'estimados' && <ClientEstimados solicitudes={solicitudes} cotizaciones={cotizacionesPendientes} onRespond={onRespondEstimate} />}
      {activeTab === 'nueva' && (
        <ClientNuevaSolicitud onCreate={(data) => { onCreateOrder({ ...data, tallerId: taller.id }); goTab('estimados'); }} />
      )}
      {activeTab === 'facturas' && <ClientFacturas facturas={facturas} taller={taller} />}
      {activeTab === 'perfil' && (
        <ClientPerfil
          key={taller.id}
          taller={taller}
          isSubUser={taller.isSubUser}
          onUpdate={(data) => taller.isSubUser
            ? onUpdateSubUsuario(taller.id, { nombre: data.contacto })
            : onUpdateTaller(taller.tallerId, data)
          }
        />
      )}
    </>
  );

  const orderDetailProps = {
    order: selectedOrder || {},
    title: (selectedOrder?.referencia || selectedOrder?.vehiculo) ?? '',
    onClose: () => setSelectedId(null),
    detailContent: selectedOrder ? <ClientOrderDetail order={selectedOrder} onRespond={onRespondEstimate} /> : null,
    chatProps: {
      role: 'taller',
      otherPartyName: 'Depto. de Piezas',
      onSendMessage: (orderId, texto, attachment) => onSendMessage(orderId, texto, 'taller', attachment),
    },
  };
  const orderModal = selectedOrder && (
    isDesktop
      ? <OrderDrawer {...orderDetailProps} />
      : <OrderSheet {...orderDetailProps} />
  );

  /* ── DESKTOP (lg+): sidebar layout ── */
  return isDesktop ? (
    <>
      {/* ── DESKTOP ── */}
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f5f7' }}>
        {/* Sidebar */}
        <aside className="w-[230px] flex-shrink-0 flex flex-col sticky top-0 h-screen" style={{ background: '#141619' }}>
          <div className="px-5 py-[22px] flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(160deg, #e8632f, #c9491c)', boxShadow: '0 6px 16px -6px rgba(201,73,28,.6)' }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 2.5 21 19.5 12 15.2 3 19.5 12 2.5Z" fill="#fff"/></svg>
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-[14px] leading-tight truncate" style={{ color: '#fff' }}>{taller.nombre || 'Parts Pilot'}</div>
              <div className="text-[10.5px] font-bold uppercase mt-0.5" style={{ color: '#6a7180', letterSpacing: '.04em' }}>Taller</div>
            </div>
          </div>

          <div className="px-3 flex-1">
            <div className="text-[10.5px] font-bold uppercase px-2.5 py-2 mb-1" style={{ color: '#565d6b', letterSpacing: '.08em' }}>Menú</div>
            {sideNavItems.map(({ id, label, icon: Icon, badge, accent }) => {
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => goTab(id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-[10px] text-[13px] font-semibold mb-0.5 transition-colors ${!active ? 'hover:bg-[#1f2228]' : ''}`}
                  style={{ background: active ? '#e8632f' : 'transparent', color: active ? '#fff' : '#9aa1ad' }}
                >
                  <Icon className="w-[17px] h-[17px] flex-shrink-0" strokeWidth={1.8} />
                  {label}
                  {badge > 0 && (
                    <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-[7px]"
                      style={{ background: active ? 'rgba(255,255,255,.2)' : (accent ? '#e8632f' : '#2a2e36'), color: active ? '#fff' : (accent ? '#fff' : '#9aa1ad') }}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
            <div className="my-3" style={{ borderTop: '1px solid #1e2127' }} />
            <button onClick={() => goTab('nueva')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-[10px] text-[13px] font-semibold mb-0.5 transition-colors ${activeTab === 'nueva' ? '' : 'hover:bg-[#1f2228]'}`}
              style={{ background: activeTab === 'nueva' ? '#e8632f' : 'transparent', color: activeTab === 'nueva' ? '#fff' : '#9aa1ad' }}
            >
              <Plus className="w-[17px] h-[17px] flex-shrink-0" strokeWidth={1.8} />
              Solicitar estimado
            </button>
          </div>

          <div className="p-3.5">
            <div className="rounded-[13px] p-3 flex items-center gap-2.5" style={{ background: '#1c1f25' }}>
              <div className="w-9 h-9 rounded-[9px] flex items-center justify-center text-[12px] font-bold flex-shrink-0" style={{ background: 'linear-gradient(150deg, #3a3f49, #272b32)', color: '#d6dae0' }}>
                {initials(taller.nombre)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-bold truncate" style={{ color: '#e8eaee' }}>{taller.contacto || taller.nombre}</div>
                <div className="text-[10.5px] truncate" style={{ color: '#6a7180' }}>{taller.isSubUser ? 'taller' : (taller.usuario || 'taller')}</div>
              </div>
              <button onClick={onLogout} className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center flex-shrink-0 hover:bg-[#30343c] transition-colors" style={{ background: '#262a31', color: '#8a909c' }} title="Salir">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="h-[70px] flex-shrink-0 flex items-center px-8 border-b sticky top-0 z-20" style={{ background: 'rgba(244,245,247,.88)', backdropFilter: 'blur(8px)', borderColor: '#e7e9ed' }}>
            <div>
              <h1 className="text-[18px] font-bold" style={{ color: '#181b21', letterSpacing: '-.02em' }}>
                {{ pedidos: 'Mis pedidos', estimados: 'Estimados', historial: 'Historial', nueva: 'Solicitar estimado', perfil: 'Mi Perfil' }[activeTab]}
              </h1>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-8 py-7 pb-14">
            <div className="max-w-[900px] mx-auto">
              {contentView}
            </div>
          </main>
        </div>
        {orderModal}
      </div>

    </>
  ) : (
    <>
      {/* ── MÓVIL ── */}
      <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
        <div className="safe-top" style={{ background: '#141619' }}>
          <div className="px-5 py-[18px] pb-4 flex items-center gap-2.5">
            <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(160deg, #e8632f, #c9491c)', boxShadow: '0 6px 16px -6px rgba(201,73,28,.6)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2.5 21 19.5 12 15.2 3 19.5 12 2.5Z" fill="#fff"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-extrabold truncate" style={{ color: '#fff', letterSpacing: '-.01em' }}>{taller.nombre || 'Parts Pilot'}</div>
              <div className="text-[11.5px]" style={{ color: '#8a909c' }}>{taller.contacto || ''}</div>
            </div>
            <button onClick={onLogout} className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 hover:bg-[#30343c] transition-colors" style={{ background: '#262a31', color: '#9aa1ad' }}>
              <LogOut className="w-4 h-4" strokeWidth={1.9} />
            </button>
          </div>
        </div>

        <main className="max-w-2xl mx-auto px-4 py-5 pb-32">{contentView}</main>

        {/* Bottom nav móvil */}
        <div className="fixed bottom-0 left-0 right-0 z-10 safe-bottom" style={{ background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid #e7e9ed' }}>
          <div className="flex items-end justify-between px-2 pt-2 pb-2 max-w-2xl mx-auto">
            {bottomNav.map(({ id, label, icon: Icon, badge, center }) => {
              const active = activeTab === id;
              if (center) return (
                <button key={id} onClick={() => goTab(id)} className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-[46px] h-[46px] -mt-4 rounded-[15px] flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #e8632f, #cf4d1d)', boxShadow: '0 10px 20px -8px rgba(201,73,28,.6)' }}>
                    <Plus className="w-6 h-6 text-white" strokeWidth={2.4} />
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: active ? '#e8632f' : '#9aa1ad' }}>{label}</span>
                </button>
              );
              return (
                <button key={id} onClick={() => goTab(id)} className="flex flex-col items-center gap-1 flex-1 relative pt-1">
                  <div className="relative">
                    <Icon className="w-[22px] h-[22px]" strokeWidth={1.9} style={{ color: active ? '#e8632f' : '#9aa1ad' }} />
                    {badge > 0 && <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#e8632f' }}>{badge}</span>}
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: active ? '#e8632f' : '#9aa1ad' }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
        {orderModal}
      </div>
    </>
  );
}


/* ------------------------------------------------------------------ */
/*  APP RAÍZ — conectada a Firebase                                    */
/* ------------------------------------------------------------------ */

import { useAuth } from './useAuth';
import { usePedidos, useTalleres, crearPedido, crearCotizacion, cambiarEstatus, enviarEstimado, responderEstimado, enviarMensaje, crearTaller, eliminarTaller, eliminarPedido, actualizarTaller, actualizarNotasInternas, actualizarReferencias, useFacturas, agregarFactura, actualizarFactura, eliminarFactura, archivarFactura, useAdminEquipo, crearAdminUsuario, actualizarPermisosAdmin, eliminarAdminUsuario, useTallerUsuarios, crearTallerUsuario, eliminarTallerUsuario, actualizarTallerUsuario } from './firestore';

export default function App() {
  const { user, perfil, cargando, error, login, logout, setError } = useAuth();
  const pedidos        = usePedidos(user);
  const talleres       = useTalleres(user);
  const facturas       = useFacturas(user);
  const equipo         = useAdminEquipo(user);
  const tallerUsuarios = useTallerUsuarios(user);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#101115' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl inline-flex items-center justify-center mb-4 animate-pulse" style={{ background: 'linear-gradient(160deg, #e8632f, #c9491c)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M12 2.5 21 19.5 12 15.2 3 19.5 12 2.5Z" fill="#fff"/></svg>
          </div>
          <p className="text-sm" style={{ color: '#6a7180' }}>Cargando Parts Pilot…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginScreen
        onLogin={(email, password) => login(email, password)}
        error={error}
      />
    );
  }

  if (user.role === 'admin') {
    return (
      <AdminApp
        pedidos={pedidos}
        talleres={talleres}
        facturas={facturas}
        equipo={equipo}
        tallerUsuarios={tallerUsuarios}
        perfil={perfil}
        currentUid={user.uid}
        onLogout={logout}
        onChangeStatus={(id, estado, fechaEntrega) => cambiarEstatus(id, estado, fechaEntrega)}
        onSendEstimate={(id, data) => enviarEstimado(id, data)}
        onCreateOrder={(data) => crearPedido({ ...data, tipo: 'pedido' })}
        onCreateCotizacion={(data) => crearCotizacion(data)}
        onSendMessage={(id, texto, from, attachment) => enviarMensaje(id, texto, from, attachment)}
        onCreateTaller={(data) => crearTaller(data)}
        onDeleteTaller={(uid) => eliminarTaller(uid)}
        onDeleteOrder={async (id) => { await eliminarPedido(id); }}
        onUpdateTaller={(uid, data) => actualizarTaller(uid, data)}
        onUpdateNotes={(id, notas) => actualizarNotasInternas(id, notas)}
        onUpdateReferencias={(id, refs) => actualizarReferencias(id, refs)}
        onAgregarFactura={(data) => agregarFactura(data)}
        onActualizarFactura={(id, data) => actualizarFactura(id, data)}
        onEliminarFactura={(id) => eliminarFactura(id)}
        onCrearAdmin={(data) => crearAdminUsuario(data)}
        onActualizarAdmin={(uid, data) => actualizarPermisosAdmin(uid, data)}
        onEliminarAdmin={(uid) => eliminarAdminUsuario(uid)}
        onCrearSubUsuario={(tallerId, data) => crearTallerUsuario(tallerId, data)}
        onEliminarSubUsuario={(uid) => eliminarTallerUsuario(uid)}
        onActualizarSubUsuario={(uid, data) => actualizarTallerUsuario(uid, data)}
      />
    );
  }

  const isSubUser = !!(user.tallerId && user.tallerId !== user.uid);
  const mainTaller = talleres.find(t => t.uid === (user.tallerId || user.uid));
  const taller = mainTaller || { nombre: perfil?.nombre, contacto: perfil?.contacto, uid: user.tallerId || user.uid };

  return (
    <ClientApp
      taller={{ ...taller, id: user.uid, tallerId: user.tallerId || user.uid, isSubUser,
        contacto: isSubUser ? (perfil?.contacto || taller.contacto) : taller.contacto }}
      pedidos={pedidos}
      facturas={facturas}
      onLogout={logout}
      onCreateOrder={(data) => crearPedido({ ...data, tallerId: user.tallerId || user.uid, tipo: 'solicitud' })}
      onRespondEstimate={(id, respuesta) => responderEstimado(id, respuesta)}
      onSendMessage={(id, texto, from, attachment) => enviarMensaje(id, texto, from, attachment)}
      onUpdateTaller={(uid, data) => actualizarTaller(uid, data)}
      onUpdateSubUsuario={(uid, data) => actualizarTallerUsuario(uid, data)}
    />
  );
}
