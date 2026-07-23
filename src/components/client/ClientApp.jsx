import { useState, useEffect, useRef } from 'react';
import {
  FileText, LogOut, Plus, Search, X, ClipboardList, History, UserCircle, Receipt
} from 'lucide-react';
import { APP_VERSION } from '../../constants/app';
import { hasNewActivity, saveOrderSeen } from '../../utils/activity';
import { ThemeToggleBtn } from '../shared/ThemeToggleBtn';
import { OrderCard } from '../shared/OrderCard';
import { OrderDrawer } from '../shared/OrderDrawer';
import { OrderSheet } from '../shared/OrderSheet';
import { EmptyState } from '../shared/FormField';
import { fmtCur } from '../../utils/format';
import { ClientFacturas } from './ClientFacturas';
import { ClientEstimados } from './ClientEstimados';
import { ClientNuevaSolicitud } from './ClientNuevaSolicitud';
import { ClientHistorial } from './ClientHistorial';
import { ClientPerfil } from './ClientPerfil';
import { ClientOrderDetail } from './ClientOrderDetail';

export function ClientApp({ taller, pedidos, facturas, onLogout, onCreateOrder, onRespondEstimate, onSendMessage, onUpdateTaller, onUpdateSubUsuario }) {
  const [activeTab, setActiveTab] = useState('pedidos');
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');

  // Qué pestaña muestra un pedido — ver el mismo criterio (y el porqué) en AdminApp.jsx:
  // "esperando cotizar" exige estado 'pendiente' Y tipo 'solicitud'; un pedido que el admin
  // registra directo a nombre de este taller nace 'pendiente' pero con tipo 'pedido' y debe
  // verse de inmediato en "Mis pedidos", no en "Estimados".
  const esperandoCotizar = (p) => p.estado === 'pendiente' && p.tipo === 'solicitud';
  const solicitudes = pedidos.filter(esperandoCotizar);
  const misPedidos = pedidos.filter(p => !esperandoCotizar(p) && p.estado !== 'cotizando');
  const pedidosActivos = misPedidos.filter(p => p.estado !== 'entregado');
  const pedidosHistorial = misPedidos.filter(p => p.estado === 'entregado');
  const cotizacionesPendientes = pedidos.filter(p => p.estado === 'cotizando');
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
  const pedidosCount = pedidosActivos.filter(p => hasNewActivity('taller', p)).length;
  const estimadosCount = [...solicitudes, ...cotizacionesPendientes].filter(p => hasNewActivity('taller', p)).length;

  const goTab = (t) => { setActiveTab(t); setSelectedId(null); setSearch(''); };

  // Deep linking: ?order=ID abre el pedido directamente al cargar
  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (deepLinkHandled.current || pedidos.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const orderParam = params.get('order');
    if (!orderParam) { deepLinkHandled.current = true; return; }
    const found = pedidos.find(p => p.id === orderParam || p.folio === orderParam);
    if (found) {
      deepLinkHandled.current = true;
      setActiveTab('pedidos');
      handleSelect(found.id);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [pedidos]); // eslint-disable-line react-hooks/exhaustive-deps

  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const bottomNav = [
    { id: 'pedidos',   label: 'Pedidos',   icon: ClipboardList, badge: pedidosCount },
    { id: 'estimados', label: 'Estimados', icon: FileText, badge: estimadosCount },
    { id: 'nueva',     label: 'Solicitar', icon: Plus, center: true },
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'perfil',    label: 'Perfil',    icon: UserCircle },
  ];

  const initials = (n) => (n || '').split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'T';

  const sideNavItems = [
    { id: 'pedidos',   label: 'Mis pedidos', icon: ClipboardList, badge: pedidosCount },
    { id: 'estimados', label: 'Estimados',   icon: FileText,      badge: estimadosCount, accent: true },
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
              { val: fmtCur(totV),    label: 'Total facturas', color: 'var(--pp-text)' },
              { val: fmtCur(totP),    label: 'Pagado',         color: '#059669' },
              { val: fmtCur(totPend), label: 'Pendiente',      color: totPend > 0 ? '#b7791f' : '#0d9488' },
            ].map(({ val, label, color }) => (
              <div key={label} className="rounded-[14px] px-3 py-3 text-center border" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
                <p className="text-[15px] font-extrabold leading-none truncate" style={{ color }}>{val}</p>
                <p className="text-[11px] mt-1 font-medium" style={{ color: 'var(--pp-text2)' }}>{label}</p>
              </div>
            ))}
          </div>
        );
      })() : (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { val: pedidosActivos.length,  label: 'Activos',     color: 'var(--pp-text8)' },
            { val: totalEstimados,         label: 'Estimados',   color: totalEstimados > 0 ? '#b7791f' : 'var(--pp-text3)' },
            { val: pedidosHistorial.length,label: 'Completados', color: '#0d9488' },
          ].map(({ val, label, color }) => (
            <div key={label} className="rounded-[14px] px-3 py-3 text-center border" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
              <p className="text-[24px] font-extrabold leading-none" style={{ color }}>{val}</p>
              <p className="text-[11px] mt-1 font-medium" style={{ color: 'var(--pp-text2)' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'pedidos' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--pp-text3)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por vehículo, referencia o folio…" className="w-full pl-10 pr-10 py-[11px] rounded-[12px] border text-[13.5px] outline-none focus:border-[#a0a0a0] focus:ring-2 focus:ring-[#a0a0a0]/10" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border4)', color: 'var(--pp-text)' }} />
            {search && (
              <button onClick={() => setSearch('')} title="Limpiar búsqueda" className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center hover:bg-[#252525]" style={{ background: 'var(--pp-surface)', color: 'var(--pp-text3)' }}>
                <X className="w-3 h-3" />
              </button>
            )}
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
      {activeTab === 'estimados' && <ClientEstimados solicitudes={solicitudes} cotizaciones={cotizacionesPendientes} onRespond={onRespondEstimate} onSelect={handleSelect} />}
      {activeTab === 'nueva' && (
        <ClientNuevaSolicitud onCreate={async (data) => { await onCreateOrder({ ...data, tallerId: taller.id }); goTab('estimados'); }} />
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
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--pp-bg)' }}>
        {/* Sidebar */}
        <aside className="w-[230px] flex-shrink-0 flex flex-col sticky top-0 h-screen" style={{ background: 'var(--pp-nav)' }}>
          <div className="px-5 py-[22px] flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(160deg, #f97316, #ea580c)', boxShadow: '0 6px 16px -6px rgba(249,115,22,0.4)' }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 2.5 21 19.5 12 15.2 3 19.5 12 2.5Z" fill="#fff"/></svg>
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-[14px] leading-tight truncate" style={{ color: 'var(--pp-text)' }}>{taller.nombre || 'Parts Pilot'}</div>
              <div className="text-[10.5px] font-bold uppercase mt-0.5" style={{ color: 'var(--pp-text4)', letterSpacing: '.04em' }}>Taller</div>
            </div>
          </div>

          <div className="px-3 flex-1 relative">
            <div className="text-[10.5px] font-bold uppercase px-2.5 py-2 mb-1" style={{ color: 'var(--pp-text5)', letterSpacing: '.08em' }}>Menú</div>
            {sideNavItems.map(({ id, label, icon: Icon, badge, accent }) => {
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => goTab(id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-[10px] text-[13px] font-semibold mb-0.5 transition-colors ${!active ? 'hover:bg-[#1e1e1e]' : ''}`}
                  style={{ background: active ? 'var(--pp-active-bg)' : 'transparent', color: active ? 'var(--pp-text)' : 'var(--pp-text2)', border: active ? '1px solid var(--pp-active-border)' : '1px solid transparent' }}
                >
                  <Icon className="w-[17px] h-[17px] flex-shrink-0" strokeWidth={1.8} />
                  {label}
                  {badge > 0 && (
                    <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-[7px] text-white"
                      style={{ background: '#dc2626' }}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
            <div className="my-3" style={{ borderTop: '1px solid var(--pp-border2)' }} />
            <button onClick={() => goTab('nueva')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-[10px] text-[13px] font-semibold mb-0.5 transition-colors ${activeTab === 'nueva' ? '' : 'hover:bg-[#1e1e1e]'}`}
              style={{ background: activeTab === 'nueva' ? 'var(--pp-active-bg)' : 'transparent', color: activeTab === 'nueva' ? 'var(--pp-text)' : 'var(--pp-text2)', border: activeTab === 'nueva' ? '1px solid var(--pp-active-border)' : '1px solid transparent' }}
            >
              <Plus className="w-[17px] h-[17px] flex-shrink-0" strokeWidth={1.8} />
              Solicitar estimado
            </button>

            {/* Watermark decorativo */}
            <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none select-none" aria-hidden="true">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.05, filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.06))' }}>
                <path d="M12 2.5 21 19.5 12 15.2 3 19.5 12 2.5Z" fill="var(--pp-text)" />
              </svg>
            </div>
          </div>

          <div className="p-3.5">
            <div className="rounded-[13px] p-3 flex items-center gap-2.5" style={{ background: 'var(--pp-card)' }}>
              <div className="w-9 h-9 rounded-[9px] flex items-center justify-center text-[12px] font-bold flex-shrink-0" style={{ background: 'var(--pp-surface)', color: 'var(--pp-text7)' }}>
                {initials(taller.nombre)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-bold truncate" style={{ color: 'var(--pp-text)' }}>{taller.contacto || taller.nombre}</div>
                <div className="text-[10.5px] truncate" style={{ color: 'var(--pp-text4)' }}>{taller.isSubUser ? 'taller' : (taller.usuario || 'taller')}</div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <ThemeToggleBtn small />
                <button onClick={onLogout} className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center flex-shrink-0 hover:bg-[#30343c] transition-colors" style={{ background: 'var(--pp-card)', color: 'var(--pp-text3)' }} title="Salir">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="text-center mt-2 text-[10px]" style={{ color: 'var(--pp-text5)' }}>v{APP_VERSION}</div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="h-[70px] flex-shrink-0 flex items-center px-8 border-b sticky top-0 z-20" style={{ background: 'var(--pp-topbar3)', backdropFilter: 'blur(8px)', borderColor: 'var(--pp-border)' }}>
            <div>
              <h1 className="text-[18px] font-bold" style={{ color: 'var(--pp-text)', letterSpacing: '-.02em' }}>
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
      <div style={{ minHeight: '100vh', background: 'var(--pp-bg)' }}>
        <div className="safe-top" style={{ background: 'var(--pp-nav)' }}>
          <div className="px-5 py-[18px] pb-4 flex items-center gap-2.5">
            <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(160deg, #f97316, #ea580c)', boxShadow: '0 6px 16px -6px rgba(249,115,22,0.4)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2.5 21 19.5 12 15.2 3 19.5 12 2.5Z" fill="#fff"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-extrabold truncate" style={{ color: 'var(--pp-text)', letterSpacing: '-.01em' }}>{taller.nombre || 'Parts Pilot'}</div>
              <div className="text-[11.5px]" style={{ color: 'var(--pp-text2)' }}>{taller.contacto || ''}</div>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <ThemeToggleBtn />
              <button onClick={onLogout} className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 hover:bg-[#30343c] transition-colors" style={{ background: 'var(--pp-card)', color: 'var(--pp-text3)' }}>
                <LogOut className="w-4 h-4" strokeWidth={1.9} />
              </button>
            </div>
          </div>
        </div>

        <main className="max-w-2xl mx-auto px-4 py-5 pb-32">{contentView}</main>

        {/* Bottom nav móvil */}
        <div className="fixed bottom-0 left-0 right-0 z-10 safe-bottom" style={{ background: 'var(--pp-topbar2)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--pp-border)' }}>
          <div className="flex items-end justify-between px-2 pt-2 pb-2 max-w-2xl mx-auto">
            {bottomNav.map(({ id, label, icon: Icon, badge, center }) => {
              const active = activeTab === id;
              if (center) return (
                <button key={id} onClick={() => goTab(id)} className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-[46px] h-[46px] -mt-4 rounded-[15px] flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #f97316, #ea580c)', boxShadow: '0 10px 20px -8px rgba(249,115,22,0.4)' }}>
                    <Plus className="w-6 h-6 text-white" strokeWidth={2.4} />
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: active ? 'var(--pp-text6)' : 'var(--pp-text3)' }}>{label}</span>
                </button>
              );
              return (
                <button key={id} onClick={() => goTab(id)} className="flex flex-col items-center gap-1 flex-1 relative pt-1">
                  <div className="relative">
                    <Icon className="w-[22px] h-[22px]" strokeWidth={1.9} style={{ color: active ? 'var(--pp-text6)' : 'var(--pp-text3)' }} />
                    {badge > 0 && <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'var(--pp-accent)' }}>{badge}</span>}
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: active ? 'var(--pp-text6)' : 'var(--pp-text3)' }}>{label}</span>
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
