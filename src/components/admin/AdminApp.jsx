import { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText, LogOut, LayoutDashboard, ClipboardList, History, Receipt, Building2
} from 'lucide-react';
import { getAdminNotifications, hasNewActivity, saveOrderSeen } from '../../utils/activity';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import { Header } from '../shared/Header';
import { AdminDashboard } from './AdminDashboard';
import { AdminPedidos } from './AdminPedidos';
import { AdminTalleres } from './AdminTalleres';
import { AdminNuevoPedido } from './AdminNuevoPedido';
import { AdminNuevaCotizacion } from './AdminNuevaCotizacion';
import { ReporteModal } from './ReporteModal';
import { AdminEstimados } from './AdminEstimados';
import { AdminFacturas } from './AdminFacturas';
import { AdminEquipo } from './AdminEquipo';
import { AdminOrderDrawer } from './AdminOrderDrawer';
import { AdminHistorial } from './AdminHistorial';

export function AdminApp({ pedidos, talleres, facturas, equipo, tallerUsuarios, perfil, currentUid, onLogout, onChangeStatus, onSendEstimate, onCreateOrder, onCreateCotizacion, onSendMessage, onDeleteMessage, onCreateTaller, onDeleteTaller, onDeleteOrder, onUpdateTaller, onUpdateNotes, onUpdateReferencias, onAgregarFactura, onActualizarFactura, onEliminarFactura, backups, onCrearBackup, onRestaurarBackup, onEliminarBackup, onCrearAdmin, onActualizarAdmin, onEliminarAdmin, onCrearSubUsuario, onEliminarSubUsuario, onActualizarSubUsuario, isPlatformSuperAdmin, onOpenSuperAdmin }) {
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
  const pedidosCount     = solosPedidos.filter(p => hasNewActivity('admin', p)).length;
  const solicitudesCount = enEstimados.filter(p => hasNewActivity('admin', p)).length;

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

  const allPedidos = pedidos;
  const notifications = useMemo(() => getAdminNotifications(allPedidos, getTaller), [allPedidos, getTaller]);

  const handleNotifSelect = (orderId) => {
    selectOrder(orderId);
    const order = pedidos.find(p => p.id === orderId);
    if (order) saveOrderSeen('admin', order);
  };

  const handleDismissAll = () => {
    allPedidos.forEach(order => saveOrderSeen('admin', order));
  };

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
      selectOrder(found.id);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [pedidos]); // eslint-disable-line react-hooks/exhaustive-deps

  const mainContent = (
    <div className="flex-1 min-w-0 flex flex-col">
      {!isMobile && (
        <AdminTopbar
          pageTitle={PAGE_META[activeTab]?.title || 'Resumen'}
          pageSub={PAGE_META[activeTab]?.sub || ''}
          solicitudesCount={solicitudesCount}
          onGoToNuevo={() => goTo('nuevo')}
          notifications={notifications}
          onNotifSelect={handleNotifSelect}
          onDismissAll={handleDismissAll}
          hideNuevoBtn={activeTab === 'nuevo' || activeTab === 'cotizacion'}
        />
      )}
      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24" style={{ paddingLeft: isMobile ? 16 : 30, paddingRight: isMobile ? 16 : 30, paddingTop: isMobile ? 16 : 28 }}>
        <div className="max-w-[1180px] mx-auto">
          {activeTab === 'dashboard' && <AdminDashboard pedidos={solosPedidos} solicitudes={solicitudes} talleres={talleres} getTaller={getTaller} onSelect={selectOrder} onGoToPedidos={() => goTo('pedidos')} onGoToEstimados={() => goTo('estimados')} onGoToNuevo={() => goTo('nuevo')} onShowReporte={() => setShowReporte(true)} onChangeStatus={canEdit('pedidos') ? onChangeStatus : undefined} />}
          {activeTab === 'pedidos' && <AdminPedidos pedidos={filteredPedidos} talleres={talleres} getTaller={getTaller} filterTaller={filterTaller} setFilterTaller={setFilterTaller} filterEstado={filterEstado} setFilterEstado={setFilterEstado} search={search} setSearch={setSearch} onSelect={selectOrder} onExport={() => setShowReporte(true)} onChangeStatus={canEdit('pedidos') ? onChangeStatus : undefined} />}
          {activeTab === 'estimados' && <AdminEstimados solicitudes={enEstimados} getTaller={getTaller} onSelect={selectOrder} />}
          {activeTab === 'talleres' && <AdminTalleres talleres={talleres} pedidos={pedidos} tallerUsuarios={tallerUsuarios} onCreateTaller={onCreateTaller} onDeleteTaller={onDeleteTaller} onUpdateTaller={onUpdateTaller} onVerPedidos={(tallerId) => { setFilterTaller(String(tallerId)); setFilterEstado('todos'); setSearch(''); goTo('pedidos'); }} onCrearSubUsuario={onCrearSubUsuario} onEliminarSubUsuario={onEliminarSubUsuario} onActualizarSubUsuario={onActualizarSubUsuario} />}
          {activeTab === 'nuevo' && <AdminNuevoPedido talleres={talleres} pedidos={todosPedidos} onCreate={(data) => { onCreateOrder(data); goTo('pedidos'); }} />}
          {activeTab === 'cotizacion' && <AdminNuevaCotizacion talleres={talleres} onCreate={async (data) => { await onCreateCotizacion(data); goTo('pedidos'); }} />}
          {activeTab === 'facturas' && <AdminFacturas facturas={facturas} talleres={talleres} onAgregar={onAgregarFactura} onActualizar={onActualizarFactura} onEliminar={onEliminarFactura} onUpdateTaller={onUpdateTaller} readOnly={!canEdit('facturas')} isSuperadmin={isSuperadmin} backups={backups} onCrearBackup={onCrearBackup} onRestaurarBackup={onRestaurarBackup} onEliminarBackup={onEliminarBackup} />}
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
      canView('pedidos')   && { id: 'pedidos',  label: 'Pedidos',   icon: ClipboardList, badge: pedidosCount },
      canView('estimados') && { id: 'estimados',label: 'Estimados', icon: FileText, badge: solicitudesCount, accent: true },
      canView('facturas')  && { id: 'facturas',  label: 'Facturas',  icon: Receipt },
      canView('pedidos')   && { id: 'historial', label: 'Historial', icon: History },
    ].filter(Boolean);

    return (
      <div style={{ minHeight: '100vh', background: 'var(--pp-bg)' }}>
        {/* Header móvil admin */}
        <div className="safe-top" style={{ background: 'var(--pp-nav)' }}>
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(155deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.07) 100%)', border: '1px solid rgba(255,255,255,0.17)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.13)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2.5 21 19.5 12 15.2 3 19.5 12 2.5Z" fill="#fff"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-extrabold leading-none" style={{ color: 'var(--pp-text)' }}>Parts Pilot</div>
              <div className="text-[10px] font-bold uppercase mt-0.5" style={{ color: 'var(--pp-text4)', letterSpacing: '.04em' }}>Admin</div>
            </div>
            {isPlatformSuperAdmin && (
              <button onClick={onOpenSuperAdmin} className="w-8 h-8 rounded-[9px] flex items-center justify-center" style={{ background: 'var(--pp-card)', color: 'var(--pp-text3)' }} title="Panel de Super Admin">
                <Building2 className="w-3.5 h-3.5" strokeWidth={1.9} />
              </button>
            )}
            <button onClick={onLogout} className="w-8 h-8 rounded-[9px] flex items-center justify-center" style={{ background: 'var(--pp-card)', color: 'var(--pp-text3)' }}>
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
            {activeTab === 'nuevo' && <AdminNuevoPedido talleres={talleres} pedidos={todosPedidos} onCreate={(data) => { onCreateOrder(data); goTo('pedidos'); }} />}
            {activeTab === 'cotizacion' && <AdminNuevaCotizacion talleres={talleres} onCreate={async (data) => { await onCreateCotizacion(data); goTo('pedidos'); }} />}
            {activeTab === 'facturas' && <AdminFacturas facturas={facturas} talleres={talleres} onAgregar={onAgregarFactura} onActualizar={onActualizarFactura} onEliminar={onEliminarFactura} onUpdateTaller={onUpdateTaller} readOnly={!canEdit('facturas')} isSuperadmin={isSuperadmin} backups={backups} onCrearBackup={onCrearBackup} onRestaurarBackup={onRestaurarBackup} onEliminarBackup={onEliminarBackup} />}
            {activeTab === 'equipo' && canManageEquipo && <AdminEquipo equipo={equipo} currentUid={currentUid} perfil={perfil} onCrear={onCrearAdmin} onActualizar={onActualizarAdmin} onEliminar={onEliminarAdmin} />}
          {activeTab === 'historial' && <AdminHistorial pedidos={todosPedidos} talleres={talleres} getTaller={getTaller} onSelect={selectOrder} />}
          </div>
        </main>

        {/* Bottom nav móvil admin */}
        <div className="fixed bottom-0 left-0 right-0 z-20 safe-bottom" style={{ background: 'var(--pp-topbar2)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--pp-border)' }}>
          <div className="flex items-end justify-between px-2 pt-2 pb-2">
            {mobileNav.map(({ id, label, icon: Icon, badge, accent }) => {
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => goTo(id)} className="flex flex-col items-center gap-1 flex-1 relative pt-1">
                  <div className="relative">
                    <Icon className="w-[22px] h-[22px]" strokeWidth={1.9} style={{ color: active ? 'var(--pp-text6)' : 'var(--pp-text3)' }} />
                    {badge > 0 && <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'var(--pp-accent)' }}>{badge}</span>}
                  </div>
                  <span className="text-[9.5px] font-semibold" style={{ color: active ? 'var(--pp-text6)' : 'var(--pp-text3)' }}>{label}</span>
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
            onDeleteMessage={onDeleteMessage}
            pedidos={todosPedidos}
          />
        )}
        {showReporte && <ReporteModal pedidos={pedidos} talleres={talleres} onClose={() => setShowReporte(false)} />}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--pp-bg)' }}>
      <AdminSidebar
        activeTab={activeTab}
        onChange={goTo}
        solicitudesCount={solicitudesCount}
        pedidosCount={pedidosCount}
        onLogout={onLogout}
        canView={canView}
        canEdit={canEdit}
        canManageEquipo={canManageEquipo}
        perfil={perfil}
        isSuperadmin={isSuperadmin}
        isPlatformSuperAdmin={isPlatformSuperAdmin}
        onOpenSuperAdmin={onOpenSuperAdmin}
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
          onDeleteMessage={onDeleteMessage}
        />
      )}
      {showReporte && <ReporteModal pedidos={pedidos} talleres={talleres} onClose={() => setShowReporte(false)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  VISTA TALLER (CLIENTE)                                             */
/* ------------------------------------------------------------------ */
