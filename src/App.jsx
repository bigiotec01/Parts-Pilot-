import { useState } from 'react';
import {
  CarFront, Package, Truck, CheckCircle2, Clock, FileText, LogOut, Plus, Search,
  Building2, Phone, X, ThumbsUp, ThumbsDown, ChevronRight, AlertCircle,
  LayoutDashboard, ClipboardList, Users, Calendar, Send, Eye, EyeOff, MessageSquare, Paperclip, Mail,
  Printer, Trash2, Pencil
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  DATOS DE EJEMPLO (en una app real, esto viviría en tu base datos)  */
/* ------------------------------------------------------------------ */

// Firebase maneja autenticación y datos - ver useAuth.js y firestore.js

const STATUS_ORDER = ['pendiente', 'cotizando', 'pedido_fabrica', 'en_transito', 'recibido', 'entregado'];

const STATUS_CONFIG = {
  pendiente:      { label: 'Pendiente de cotizar', short: 'Pendiente', badge: 'bg-stone-100 text-stone-600 border-stone-200', dot: 'bg-stone-400', icon: Clock },
  cotizando:      { label: 'Cotización enviada',   short: 'Cotizando', badge: 'bg-blue-50 text-blue-700 border-blue-200',     dot: 'bg-blue-500',   icon: FileText },
  pedido_fabrica: { label: 'Pedido a fábrica',      short: 'Pedido',    badge: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500', icon: Package },
  en_transito:    { label: 'En tránsito',           short: 'En camino', badge: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-500',  icon: Truck },
  recibido:       { label: 'Recibido en Tienda',    short: 'En Tienda', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: Package },
  entregado:      { label: 'Orden Completa',        short: 'Completa',  badge: 'bg-teal-50 text-teal-700 border-teal-200',     dot: 'bg-teal-600',   icon: CheckCircle2 },
};

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
  { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
  { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
  { id: 'talleres', label: 'Talleres', icon: Users },
  { id: 'nuevo', label: 'Nuevo pedido', icon: Plus },
];

const CLIENT_TABS = [
  { id: 'pedidos', label: 'Mis pedidos', icon: ClipboardList },
  { id: 'estimados', label: 'Estimados', icon: FileText },
  { id: 'nueva', label: 'Solicitar Estimado', icon: Plus },
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

function Header({ title, subtitle, userLabel, onLogout }) {
  return (
    <header className="bg-stone-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
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

function NavTabs({ tabs, active, onChange }) {
  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-2 sm:px-6 flex gap-1 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${isActive ? 'border-orange-500 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
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
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${cfg.badge}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.short}
    </span>
  );
}

function StatusStepper({ estado }) {
  const currentIndex = STATUS_ORDER.indexOf(estado);
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="flex items-start min-w-max">
        {STATUS_ORDER.map((status, i) => {
          const cfg = STATUS_CONFIG[status];
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          const active = isDone || isCurrent;
          return (
            <div key={status} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5 w-14 sm:w-16">
                <div className={`w-3.5 h-3.5 rounded-full ${active ? cfg.dot : 'bg-stone-200'} ${isCurrent ? 'ring-4 ring-stone-100' : ''}`} />
                <span className={`text-[10px] text-center leading-tight ${isCurrent ? 'font-semibold text-stone-800' : 'text-stone-400'}`}>{cfg.short}</span>
              </div>
              {i < STATUS_ORDER.length - 1 && (
                <div className={`h-0.5 w-6 sm:w-10 -mt-4 ${i < currentIndex ? cfg.dot : 'bg-stone-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({ order, taller, showTaller, onClick }) {
  return (
    <button onClick={onClick} className="w-full text-left bg-white border border-stone-200 rounded-xl p-4 hover:border-orange-300 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-stone-900 truncate">{order.referencia || order.vehiculo}</h3>
          {order.referencia && <p className="text-sm text-stone-500 truncate">{order.vehiculo}</p>}
        </div>
        <StatusBadge estado={order.estado} />
      </div>
      <div className="flex flex-col gap-1 text-xs text-stone-500 mt-3 pt-3 border-t border-dashed border-stone-200">
        <div className="flex items-center justify-between gap-2">
          {showTaller ? (
            <span className="flex items-center gap-1 truncate"><Building2 className="w-3.5 h-3.5 flex-shrink-0" />{taller?.nombre}</span>
          ) : (
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 flex-shrink-0" />{formatDate(order.fecha)}</span>
          )}
          <div className="flex items-center gap-3 flex-shrink-0">
            {order.mensajes?.length > 0 && (
              <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{order.mensajes.length}</span>
            )}
            {order.estimado && <span className="flex items-center gap-1 text-orange-500"><FileText className="w-3.5 h-3.5" />Estimado</span>}
          </div>
        </div>
        {order.fechaEntrega && (
          <span className="flex items-center gap-1 text-blue-600 font-medium">
            <Truck className="w-3.5 h-3.5 flex-shrink-0" /> Entrega est.: {formatDate(order.fechaEntrega)}
          </span>
        )}
      </div>
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 sticky top-0 bg-white">
          <h2 className="font-mono tracking-wider text-sm text-stone-500">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>
        <div className="p-5">{children}</div>
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
    <div className="flex flex-col h-[55vh] sm:h-[420px]">
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
              {!isMine && <span className="text-[11px] text-stone-400 mb-0.5 px-1">{otherPartyName}</span>}
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-snug space-y-1.5 ${isMine ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-800'}`}>
                {m.attachment && <ChatAttachment attachment={m.attachment} isMine={isMine} />}
                {m.texto && <p>{m.texto}</p>}
              </div>
              <span className="text-[10px] text-stone-400 mt-0.5 px-1">{m.hora}</span>
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
      <label className="text-sm font-medium text-stone-700 block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="bg-stone-50 rounded-lg p-2.5">
      <p className="text-xs text-stone-400">{label}</p>
      <p className="font-medium text-stone-800 truncate">{value}</p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-14 text-stone-400">
      <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

const inputClass = "w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all";

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
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
            <CarFront className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Parts Pilot</h1>
          <p className="text-stone-400 text-sm mt-1">Portal de pedidos · Depto. de Piezas</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-xl space-y-4">
          <FormField label="Correo electrónico">
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="tu@correo.com" className={inputClass} required />
          </FormField>
          <FormField label="Contraseña">
            <div className="relative">
              <input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="••••••" className={`${inputClass} pr-10`} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition-colors">
            Iniciar sesión
          </button>
        </form>

        <div className="mt-5 bg-stone-800/60 rounded-xl p-4 text-xs text-stone-400">
          <p className="text-stone-300 font-medium">Firebase Authentication</p>
          <p className="mt-1.5">Ingresa tu correo y contraseña registrados en Parts Pilot.</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  VISTA ADMINISTRADOR                                                */
/* ------------------------------------------------------------------ */

function StatCard({ label, value, icon: Icon, color, highlight }) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${highlight ? 'border-orange-200 ring-1 ring-orange-100' : 'border-stone-200'}`}>
      <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center mb-2`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-stone-900">{value}</p>
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  );
}

function AdminDashboard({ pedidos, talleres, getTaller, onSelect, onGoToPedidos }) {
  const total = pedidos.length;
  const pendientes = pedidos.filter(p => p.estado === 'pendiente').length;
  const enProceso = pedidos.filter(p => ['cotizando', 'pedido_fabrica', 'en_transito', 'recibido'].includes(p.estado)).length;
  const entregados = pedidos.filter(p => p.estado === 'entregado').length;
  const toMs = f => f?.toDate ? f.toDate().getTime() : new Date(f).getTime();
  const recientes = [...pedidos].sort((a, b) => toMs(b.fecha) - toMs(a.fecha)).slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total de pedidos" value={total} icon={ClipboardList} color="text-stone-600 bg-stone-100" />
        <StatCard label="Por cotizar" value={pendientes} icon={Clock} color="text-stone-600 bg-stone-100" highlight={pendientes > 0} />
        <StatCard label="En proceso" value={enProceso} icon={Truck} color="text-amber-600 bg-amber-50" />
        <StatCard label="Entregados" value={entregados} icon={CheckCircle2} color="text-teal-600 bg-teal-50" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-stone-900">Actividad reciente</h2>
          <button onClick={onGoToPedidos} className="text-sm text-orange-600 font-medium hover:text-orange-700 flex items-center gap-1">
            Ver todos <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {recientes.map(p => <OrderCard key={p.id} order={p} taller={getTaller(p.tallerId)} showTaller onClick={() => onSelect(p.id)} />)}
        </div>
      </div>

      <div className="bg-stone-100 border border-dashed border-stone-300 rounded-xl p-4 text-sm text-stone-500">
        <strong className="text-stone-700">Talleres activos:</strong> {talleres.length} — cada uno solo ve sus propios folios, estatus y estimados.
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
          {pedidos.map(p => <OrderCard key={p.id} order={p} taller={getTaller(p.tallerId)} showTaller onClick={() => onSelect(p.id)} />)}
        </div>
      )}
    </div>
  );
}

function AdminTalleres({ talleres, pedidos, onVerPedidos, onCreateTaller, onDeleteTaller, onUpdateTaller }) {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-stone-900">Talleres registrados</h2>
        <button
          onClick={() => { setShowForm(s => !s); setError(''); }}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo taller
        </button>
      </div>

      {done && (
        <div className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Taller registrado correctamente.
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-5 space-y-4">
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
                <button type="button" onClick={generarPassword} className="px-3 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 text-xs font-medium whitespace-nowrap transition-colors">
                  Generar
                </button>
              </div>
            </FormField>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          <button type="submit" disabled={saving} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors">
            {saving ? 'Creando...' : 'Crear taller'}
          </button>
        </form>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
      {talleres.map(t => {
        const pedidosTaller = pedidos.filter(p => p.tallerId === t.uid);
        const activos = pedidosTaller.filter(p => p.estado !== 'entregado').length;

        if (editingId === t.uid) {
          return (
            <div key={t.uid} className="bg-white rounded-xl border border-orange-300 ring-1 ring-orange-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-stone-800">Editar taller</p>
                <button onClick={() => setEditingId(null)} className="text-stone-400 hover:text-stone-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <FormField label="Nombre del taller">
                  <input value={editForm.nombre} onChange={e => handleEditChange('nombre', e.target.value)} className={inputClass} />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Contacto">
                    <input value={editForm.contacto} onChange={e => handleEditChange('contacto', e.target.value)} className={inputClass} />
                  </FormField>
                  <FormField label="Teléfono">
                    <input value={editForm.telefono} onChange={e => handleEditChange('telefono', e.target.value)} className={inputClass} />
                  </FormField>
                </div>
                <FormField label="Correo electrónico">
                  <input type="email" value={editForm.email} onChange={e => handleEditChange('email', e.target.value)} className={inputClass} />
                </FormField>
                <FormField label="Usuario">
                  <input value={editForm.usuario} onChange={e => handleEditChange('usuario', e.target.value)} className={`${inputClass} font-mono`} />
                </FormField>
                {editError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {editError}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleUpdate} disabled={editSaving} className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
                    {editSaving ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                  <button onClick={() => setEditingId(null)} className="px-4 bg-stone-100 hover:bg-stone-200 text-stone-600 text-sm font-medium py-2 rounded-lg transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div key={t.uid} className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-stone-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-stone-900 truncate">{t.nombre}</h3>
                <p className="text-sm text-stone-500">{t.contacto}</p>
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-sm text-stone-500 mb-1">
              <Phone className="w-3.5 h-3.5" />{t.telefono}
            </p>
            {t.email && (
              <p className="flex items-center gap-1.5 text-sm text-stone-500 mb-3 truncate">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />{t.email}
              </p>
            )}
            <div className="flex items-center justify-between text-sm border-t border-dashed border-stone-200 pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-stone-500">Usuario: <span className="font-mono font-medium text-stone-700">{t.usuario}</span></span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${activos > 0 ? 'bg-amber-50 text-amber-700' : 'bg-stone-100 text-stone-500'}`}>
                  {activos} activos · {pedidosTaller.length} total
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => onVerPedidos(t.uid)} className="text-orange-600 font-medium text-sm hover:text-orange-700 flex items-center gap-1 px-2 py-1">
                  Ver <ChevronRight className="w-4 h-4" />
                </button>
                <button onClick={() => startEdit(t)} className="p-1.5 rounded-lg text-stone-400 hover:text-orange-500 hover:bg-orange-50 transition-colors" title="Editar taller">
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { if (window.confirm(`¿Eliminar el taller "${t.nombre}"? Esta acción no se puede deshacer.`)) onDeleteTaller(t.uid); }}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Eliminar taller"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

function AdminNuevoPedido({ talleres, onCreate }) {
  const [form, setForm] = useState({ tallerId: talleres[0]?.uid ?? '', vehiculo: '', notas: '' });
  const [refPrefijo, setRefPrefijo] = useState('PO#');
  const [refNumero, setRefNumero] = useState('');
  const [done, setDone] = useState(false);

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const referencia = refNumero.trim() ? `${refPrefijo} ${refNumero.trim()}` : '';
    onCreate({ ...form, referencia });
    setForm({ tallerId: talleres[0]?.uid ?? '', vehiculo: '', notas: '' });
    setRefPrefijo('PO#');
    setRefNumero('');
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <div className="max-w-lg">
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
        <FormField label="Referencia">
          <div className="flex gap-2">
            <select value={refPrefijo} onChange={e => setRefPrefijo(e.target.value)} className="px-3 py-2.5 rounded-lg border border-stone-200 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all bg-white flex-shrink-0">
              <option value="PO#">PO#</option>
              <option value="Orden">Orden</option>
            </select>
            <input value={refNumero} onChange={e => setRefNumero(e.target.value)} placeholder="ej. 48213" className={`${inputClass} flex-1 min-w-0`} />
          </div>
        </FormField>
        <FormField label="Notas (opcional)">
          <textarea value={form.notas} onChange={e => handleChange('notas', e.target.value)} rows={3} placeholder="Detalles adicionales..." className={`${inputClass} resize-none`} />
        </FormField>
        <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition-colors">
          Registrar pedido
        </button>
      </form>
    </div>
  );
}

function AdminOrderDetail({ order, taller, onChangeStatus, onSendEstimate, onDeleteOrder }) {
  const [notasEstimado, setNotasEstimado] = useState(order.estimado?.notas ?? '');
  const [archivo, setArchivo] = useState(order.estimado?.archivo ?? null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSendEstimate = async () => {
    setSending(true);
    setSendError('');
    try {
      await onSendEstimate(order.id, { notas: notasEstimado, archivo });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      setSendError('Error al enviar: ' + (err.message || err.code));
    } finally {
      setSending(false);
    }
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
      {/* ── Encabezado del pedido ── */}
      <div className="flex items-center justify-between bg-stone-50 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-white border border-stone-200 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-stone-500" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-stone-800 text-sm truncate">{taller?.nombre}</p>
            <p className="text-xs text-stone-400 font-mono">{order.id.slice(0, 14)}</p>
          </div>
        </div>
        <StatusBadge estado={order.estado} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* ── COLUMNA IZQUIERDA: Info + Estado ── */}
        <div className="space-y-3">

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-2">
            <InfoItem label="Fecha de registro" value={formatDate(order.fecha)} />
            {order.fechaEntrega
              ? <InfoItem label="Entrega estimada" value={formatDate(order.fechaEntrega)} />
              : <InfoItem label="Folio" value={order.id.slice(0, 10)} />}
          </div>

          {/* Notas del taller */}
          {order.notas && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Notas del taller</p>
              <p className="text-sm text-amber-900">{order.notas}</p>
            </div>
          )}

          {/* Archivo del taller */}
          {order.archivo && (
            <div className="bg-stone-50 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-2">Archivo del taller</p>
              {order.archivo.type?.startsWith('image/') || order.archivo.url?.match(/\.(jpg|jpeg|png|webp|gif)/i) ? (
                <a href={order.archivo.url} target="_blank" rel="noreferrer">
                  <img src={order.archivo.url} alt={order.archivo.name} className="rounded-lg max-h-36 object-cover border border-stone-200" />
                </a>
              ) : (
                <a href={order.archivo.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 hover:border-orange-300 hover:text-orange-600 transition-colors w-fit">
                  <FileText className="w-4 h-4 flex-shrink-0" /><span className="truncate">{order.archivo.name}</span>
                </a>
              )}
            </div>
          )}

          {/* Estado */}
          <div className="bg-stone-50 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-3">Estado del pedido</p>
            <StatusStepper estado={order.estado} />
            <select value={order.estado} onChange={e => onChangeStatus(order.id, e.target.value)} className={`${inputClass} bg-white mt-3`}>
              {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
            </select>
          </div>

          {/* Fecha de entrega */}
          {['pedido_fabrica', 'en_transito', 'recibido', 'entregado'].includes(order.estado) && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Fecha estimada de entrega
              </p>
              <input
                type="date"
                defaultValue={order.fechaEntrega || ''}
                onChange={e => onChangeStatus(order.id, order.estado, e.target.value)}
                className={`${inputClass} bg-white`}
              />
              {order.fechaEntrega && <p className="text-xs text-blue-500 mt-1.5">El taller verá esta fecha en su portal.</p>}
            </div>
          )}
        </div>

        {/* ── COLUMNA DERECHA: Estimado ── */}
        <div className="space-y-3">
          <div className="bg-stone-50 rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" /> Estimado
            </p>

            {order.estimado?.respuesta === 'pendiente' && (
              <div className="text-sm px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0" /> Esperando respuesta del taller…
              </div>
            )}
            {order.estimado?.respuesta && order.estimado.respuesta !== 'pendiente' && (
              <div className={`text-sm px-3 py-2 rounded-lg flex items-center gap-2 ${order.estimado.respuesta === 'aceptado' ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-red-50 border border-red-100 text-red-700'}`}>
                {order.estimado.respuesta === 'aceptado' ? <ThumbsUp className="w-4 h-4 flex-shrink-0" /> : <ThumbsDown className="w-4 h-4 flex-shrink-0" />}
                El taller {order.estimado.respuesta === 'aceptado' ? 'aceptó' : 'rechazó'} este estimado.
              </div>
            )}
            {sent && (
              <div className="text-sm px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Estimado enviado al taller.
              </div>
            )}
            {sendError && (
              <div className="text-sm px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {sendError}
              </div>
            )}

            <FormField label="Notas para el taller">
              <textarea value={notasEstimado} onChange={e => setNotasEstimado(e.target.value)} rows={3} placeholder="Tiempo de entrega, condiciones, etc." className={`${inputClass} bg-white resize-none`} />
            </FormField>

            <FormField label="PDF del estimado (opcional)">
              {archivo ? (
                <div className="flex items-center justify-between gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2">
                  <a href={archivo.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-stone-700 truncate hover:underline">
                    <FileText className="w-4 h-4 flex-shrink-0" /><span className="truncate">{archivo.name}</span>
                  </a>
                  <button type="button" onClick={() => setArchivo(null)} className="text-stone-400 hover:text-red-500 flex-shrink-0"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border border-dashed border-stone-300 rounded-lg px-3 py-2.5 text-sm text-stone-500 hover:border-orange-300 hover:text-orange-600 cursor-pointer transition-colors bg-white">
                  <Paperclip className="w-4 h-4" /> Adjuntar PDF
                  <input type="file" accept="application/pdf" onChange={handleFile} className="hidden" />
                </label>
              )}
            </FormField>

            <button onClick={handleSendEstimate} disabled={sending} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> {sending ? 'Enviando…' : order.estimado ? 'Actualizar y reenviar' : 'Enviar estimado al taller'}
            </button>
          </div>

          {/* Email */}
          {taller?.email ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowEmail(v => !v)}
                className="w-full bg-white border border-stone-200 hover:border-orange-300 hover:text-orange-600 text-stone-600 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Mail className="w-4 h-4" /> Correo a {taller.email}
              </button>
              {showEmail && (() => {
                const { subject, body } = buildEmailContent();
                return (
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2 text-sm">
                    <div><span className="font-medium text-stone-500">Para:</span> <span className="text-stone-700">{taller.email}</span></div>
                    <div><span className="font-medium text-stone-500">Asunto:</span> <span className="text-stone-700">{subject}</span></div>
                    <div>
                      <span className="font-medium text-stone-500 block mb-1">Cuerpo:</span>
                      <textarea readOnly value={body} rows={5} className="w-full text-xs text-stone-600 bg-white border border-stone-200 rounded-lg p-2 resize-none focus:outline-none" />
                    </div>
                    <button type="button" onClick={handleCopyEmail} className="w-full bg-stone-800 hover:bg-stone-900 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                      {copied ? <><CheckCircle2 className="w-4 h-4" /> ¡Copiado!</> : <><Paperclip className="w-4 h-4" /> Copiar correo completo</>}
                    </button>
                  </div>
                );
              })()}
            </div>
          ) : (
            <p className="text-xs text-stone-400 text-center py-1">Este taller no tiene correo registrado.</p>
          )}

          {/* Eliminar */}
          <button
            type="button"
            onClick={() => { if (window.confirm('¿Eliminar este pedido? Esta acción no se puede deshacer.')) onDeleteOrder(order.id); }}
            className="w-full flex items-center justify-center gap-2 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 py-2.5 rounded-lg transition-colors border border-dashed border-red-200"
          >
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

function AdminApp({ pedidos, talleres, perfil, onLogout, onChangeStatus, onSendEstimate, onCreateOrder, onSendMessage, onCreateTaller, onDeleteTaller, onDeleteOrder, onUpdateTaller }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedId, setSelectedId] = useState(null);
  const [filterTaller, setFilterTaller] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [search, setSearch] = useState('');
  const [showReporte, setShowReporte] = useState(false);

  const getTaller = (id) => talleres.find(t => t.uid === id);
  const selectedOrder = pedidos.find(p => p.id === selectedId);

  const filteredPedidos = pedidos.filter(p => {
    if (filterTaller !== 'todos' && String(p.tallerId) !== filterTaller) return false;
    if (filterEstado !== 'todos' && p.estado !== filterEstado) return false;
    if (search && !`${p.referencia || ''} ${p.vehiculo} ${p.id}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <Header title="Parts Pilot" subtitle={perfil?.nombre || 'Administrador'} userLabel="Administrador" onLogout={onLogout} />
      <NavTabs tabs={ADMIN_TABS} active={activeTab} onChange={(t) => { setActiveTab(t); setSelectedId(null); }} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-16">
        {activeTab === 'dashboard' && (
          <AdminDashboard pedidos={pedidos} talleres={talleres} getTaller={getTaller} onSelect={setSelectedId} onGoToPedidos={() => setActiveTab('pedidos')} />
        )}
        {activeTab === 'pedidos' && (
          <AdminPedidos
            pedidos={filteredPedidos} talleres={talleres} getTaller={getTaller}
            filterTaller={filterTaller} setFilterTaller={setFilterTaller}
            filterEstado={filterEstado} setFilterEstado={setFilterEstado}
            search={search} setSearch={setSearch}
            onSelect={setSelectedId}
            onExport={() => setShowReporte(true)}
          />
        )}
        {activeTab === 'talleres' && (
          <AdminTalleres talleres={talleres} pedidos={pedidos} onCreateTaller={onCreateTaller} onDeleteTaller={onDeleteTaller} onUpdateTaller={onUpdateTaller} onVerPedidos={(tallerId) => { setFilterTaller(String(tallerId)); setFilterEstado('todos'); setSearch(''); setActiveTab('pedidos'); }} />
        )}
        {activeTab === 'nuevo' && (
          <AdminNuevoPedido talleres={talleres} onCreate={(data) => { onCreateOrder(data); setActiveTab('pedidos'); }} />
        )}
      </main>
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          title={selectedOrder.referencia || selectedOrder.vehiculo}
          onClose={() => setSelectedId(null)}
          detailContent={<AdminOrderDetail order={selectedOrder} taller={getTaller(selectedOrder.tallerId)} onChangeStatus={onChangeStatus} onSendEstimate={onSendEstimate} onDeleteOrder={async (id) => { await onDeleteOrder(id); setSelectedId(null); }} />}
          chatProps={{
            role: 'admin',
            otherPartyName: getTaller(selectedOrder.tallerId)?.nombre,
            onSendMessage: (orderId, texto, attachment) => onSendMessage(orderId, texto, 'admin', attachment),
          }}
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
  if (estimado.respuesta === 'pendiente') {
    return (
      <div className="flex gap-2">
        <button onClick={() => onRespond(order.id, 'aceptado')} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors">
          <ThumbsUp className="w-4 h-4" /> Aceptar
        </button>
        <button onClick={() => onRespond(order.id, 'rechazado')} className="flex-1 bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors">
          <ThumbsDown className="w-4 h-4" /> Rechazar
        </button>
      </div>
    );
  }
  return (
    <div className={`text-sm px-3 py-2 rounded-lg flex items-center gap-2 ${estimado.respuesta === 'aceptado' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
      {estimado.respuesta === 'aceptado' ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
      {estimado.respuesta === 'aceptado' ? 'Aceptaste este estimado' : 'Rechazaste este estimado'}
    </div>
  );
}

function ClientEstimados({ pedidos, onRespond }) {
  const sinEstimado = pedidos.filter(p => !p.estimado);
  const pendientes = pedidos.filter(p => p.estimado?.respuesta === 'pendiente');
  const respondidos = pedidos.filter(p => p.estimado && p.estimado.respuesta !== 'pendiente');

  if (pedidos.length === 0) return <EmptyState text="Aún no tienes solicitudes registradas." />;

  return (
    <div className="space-y-6">
      {sinEstimado.length > 0 && (
        <div>
          <h2 className="font-semibold text-stone-900 mb-3">Esperando estimado del proveedor</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {sinEstimado.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-stone-900 truncate">{p.referencia || p.vehiculo}</h3>
                    {p.referencia && <p className="text-sm text-stone-500 truncate">{p.vehiculo}</p>}
                  </div>
                  <StatusBadge estado={p.estado} />
                </div>
                <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Pendiente de estimado
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {pendientes.length > 0 && (
        <div>
          <h2 className="font-semibold text-stone-900 mb-3">Pendientes de tu respuesta</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {pendientes.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="mb-2">
                  <h3 className="font-semibold text-stone-900 truncate">{p.referencia || p.vehiculo}</h3>
                  {p.referencia && <p className="text-sm text-stone-500 truncate">{p.vehiculo}</p>}
                </div>
                {p.estimado.notas && <p className="text-sm text-stone-600 mb-3 bg-stone-50 rounded-lg p-2">{p.estimado.notas}</p>}
                {p.estimado.archivo && (
                  <a href={p.estimado.archivo.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 hover:border-orange-300 hover:text-orange-600 transition-colors mb-3">
                    <FileText className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{p.estimado.archivo.name}</span>
                  </a>
                )}
                <EstimateActions order={p} onRespond={onRespond} />
              </div>
            ))}
          </div>
        </div>
      )}
      {respondidos.length > 0 && (
        <div>
          <h2 className="font-semibold text-stone-900 mb-3">Historial</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {respondidos.map(p => <EstimateCard key={p.id} order={p} />)}
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

function ClientOrderDetail({ order, onRespond }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-bold text-lg text-stone-900">{order.referencia || order.vehiculo}</h3>
        {order.referencia && <p className="text-stone-500 text-sm">{order.vehiculo}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <InfoItem label="Fecha de registro" value={formatDate(order.fecha)} />
        {order.referencia ? <InfoItem label="Referencia" value={order.referencia} /> : <InfoItem label="Folio" value={order.id.slice(0, 12)} />}
        {order.fechaEntrega && <InfoItem label="Fecha de entrega est." value={formatDate(order.fechaEntrega)} />}
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

function ClientApp({ taller, pedidos, onLogout, onCreateOrder, onRespondEstimate, onSendMessage }) {
  const [activeTab, setActiveTab] = useState('pedidos');
  const [selectedId, setSelectedId] = useState(null);

  const misPedidos = pedidos;
  const selectedOrder = misPedidos.find(p => p.id === selectedId);
  const estimadosPendientes = misPedidos.filter(p => !p.estimado || p.estimado.respuesta === 'pendiente').length;

  const tabs = CLIENT_TABS.map(t => t.id === 'estimados' ? { ...t, badge: estimadosPendientes } : t);

  return (
    <div className="min-h-screen bg-stone-50">
      <Header title="Parts Pilot" subtitle={taller.nombre} userLabel={taller.contacto} onLogout={onLogout} />
      <NavTabs tabs={tabs} active={activeTab} onChange={(t) => { setActiveTab(t); setSelectedId(null); }} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-16">
        {activeTab === 'pedidos' && (
          misPedidos.length === 0 ? <EmptyState text="Aún no tienes pedidos registrados." /> : (
            <div className="grid sm:grid-cols-2 gap-3">
              {[...misPedidos].sort((a, b) => { const t = f => f?.toDate ? f.toDate().getTime() : new Date(f).getTime(); return t(b.fecha) - t(a.fecha); }).map(p => (
                <OrderCard key={p.id} order={p} onClick={() => setSelectedId(p.id)} />
              ))}
            </div>
          )
        )}
        {activeTab === 'estimados' && <ClientEstimados pedidos={misPedidos} onRespond={onRespondEstimate} />}
        {activeTab === 'nueva' && (
          <ClientNuevaSolicitud onCreate={(data) => { onCreateOrder({ ...data, tallerId: taller.id }); setActiveTab('pedidos'); }} />
        )}
      </main>
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          title={selectedOrder.id}
          onClose={() => setSelectedId(null)}
          detailContent={<ClientOrderDetail order={selectedOrder} onRespond={onRespondEstimate} />}
          chatProps={{
            role: 'taller',
            otherPartyName: 'Depto. de Piezas',
            onSendMessage: (orderId, texto, attachment) => onSendMessage(orderId, texto, 'taller', attachment),
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  APP RAÍZ — conectada a Firebase                                    */
/* ------------------------------------------------------------------ */

import { useAuth } from './useAuth';
import { usePedidos, useTalleres, crearPedido, cambiarEstatus, enviarEstimado, responderEstimado, enviarMensaje, crearTaller, eliminarTaller, eliminarPedido, actualizarTaller } from './firestore';

export default function App() {
  const { user, perfil, cargando, error, login, logout, setError } = useAuth();
  const pedidos = usePedidos(user);
  const talleres = useTalleres(user);

  if (cargando) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <CarFront className="w-8 h-8 text-white" />
          </div>
          <p className="text-stone-400 text-sm">Cargando Parts Pilot...</p>
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
        perfil={perfil}
        onLogout={logout}
        onChangeStatus={(id, estado, fechaEntrega) => cambiarEstatus(id, estado, fechaEntrega)}
        onSendEstimate={(id, data) => enviarEstimado(id, data)}
        onCreateOrder={(data) => crearPedido(data)}
        onSendMessage={(id, texto, from, attachment) => enviarMensaje(id, texto, from, attachment)}
        onCreateTaller={(data) => crearTaller(data)}
        onDeleteTaller={(uid) => eliminarTaller(uid)}
        onDeleteOrder={async (id) => { await eliminarPedido(id); }}
        onUpdateTaller={(uid, data) => actualizarTaller(uid, data)}
      />
    );
  }

  const taller = talleres.find(t => t.uid === user.uid) || { nombre: perfil?.nombre, contacto: perfil?.contacto, uid: user.uid };
  return (
    <ClientApp
      taller={{ ...taller, id: user.uid }}
      pedidos={pedidos}
      onLogout={logout}
      onCreateOrder={(data) => crearPedido({ ...data, tallerId: user.uid })}
      onRespondEstimate={(id, respuesta) => responderEstimado(id, respuesta)}
      onSendMessage={(id, texto, from, attachment) => enviarMensaje(id, texto, from, attachment)}
    />
  );
}
