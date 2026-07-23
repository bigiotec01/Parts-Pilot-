import { useState, useEffect, useRef } from 'react';
import {
  FileText, LogOut, LayoutDashboard, ClipboardList, Users, History, ClipboardCheck, Receipt, ChevronUp, Building2
} from 'lucide-react';
import { APP_VERSION } from '../../constants/app';
import { ThemeToggleBtn } from '../shared/ThemeToggleBtn';

export function AdminSidebar({ activeTab, onChange, solicitudesCount, pedidosCount, onLogout, canView, canEdit, canManageEquipo, perfil, isSuperadmin, isPlatformSuperAdmin, onOpenSuperAdmin }) {
  const primaryItems = [
    { id: 'dashboard',                     label: 'Resumen',    icon: LayoutDashboard },
    canView('pedidos')   && { id: 'pedidos',    label: 'Pedidos',    icon: ClipboardList, badge: pedidosCount },
    canView('estimados') && { id: 'estimados',  label: 'Estimados',  icon: FileText, badge: solicitudesCount, accent: true },
    canView('talleres')  && { id: 'talleres',   label: 'Talleres',   icon: Users },
    canView('pedidos')   && { id: 'historial',  label: 'Historial',  icon: History },
  ].filter(Boolean);
  const secondaryItems = [
    canEdit('estimados') && { id: 'cotizacion', label: 'Nueva cotización', icon: ClipboardCheck },
    canView('facturas')  && { id: 'facturas',   label: 'Facturas',         icon: Receipt },
    canManageEquipo      && { id: 'equipo',     label: 'Equipo',           icon: Users },
  ].filter(Boolean);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!showProfileMenu) return;
    const handler = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showProfileMenu]);

  const nombre = perfil?.nombre || 'Administrador';
  const rol = isSuperadmin ? 'Superadmin' : 'Administrador';
  const iniciales = nombre.split(' ').filter(w => w.length > 1).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'AD';

  const NavBtn = ({ id, label, icon: Icon, badge, accent }) => {
    const active = activeTab === id;
    return (
      <button
        onClick={() => onChange(id)}
        className={`w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-[10px] text-[13.5px] font-semibold mb-0.5 transition-all ${!active ? 'hover:bg-[#252525]' : ''}`}
        style={active ? {
          background: 'var(--pp-active-bg)',
          border: '1px solid var(--pp-active-border)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          color: 'var(--pp-text)',
        } : { background: 'transparent', border: '1px solid transparent', color: 'var(--pp-text)' }}
      >
        <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.8} />
        {label}
        {badge > 0 && (
          <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-[7px] leading-tight text-white"
            style={{ background: '#dc2626' }}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="w-[252px] flex-shrink-0 flex flex-col sticky top-0 h-screen" style={{ background: 'var(--pp-nav)' }}>
      <div className="px-5 py-[22px] flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'var(--pp-accent)', border: '1px solid var(--pp-active-border)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 2.5 21 19.5 12 15.2 3 19.5 12 2.5Z" fill="#fff"/></svg>
        </div>
        <div>
          <div className="font-extrabold text-[15.5px] leading-none whitespace-nowrap" style={{ color: 'var(--pp-text)', letterSpacing: '-.01em' }}>Parts Pilot</div>
          <div className="mt-1 text-[10.5px] font-bold uppercase" style={{ color: 'var(--pp-text4)', letterSpacing: '.04em' }}>Admin</div>
        </div>
      </div>

      <div className="px-3 flex-1 overflow-y-auto relative">
        <div className="text-[10.5px] font-bold uppercase px-2.5 py-2 mb-1" style={{ color: 'var(--pp-text5)', letterSpacing: '.08em' }}>Operación</div>
        {primaryItems.map(item => <NavBtn key={item.id} {...item} />)}
        <div className="my-3" style={{ borderTop: '1px solid var(--pp-border2)' }} />
        {secondaryItems.map(item => <NavBtn key={item.id} {...item} />)}

        {/* Watermark decorativo */}
        <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none select-none" aria-hidden="true">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.05, filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.06))' }}>
            <path d="M12 2.5 21 19.5 12 15.2 3 19.5 12 2.5Z" fill="var(--pp-text)" />
          </svg>
        </div>
      </div>

      <div className="px-3.5 pt-3.5">
        <div className="relative" ref={profileRef}>
          {showProfileMenu && (
            <div className="absolute left-0 right-0 bottom-[calc(100%+8px)] rounded-[13px] border p-1.5 z-30" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border3)', boxShadow: '0 16px 40px rgba(0,0,0,0.45)', animation: 'ppRise .18s cubic-bezier(.2,.8,.2,1) both' }}>
              <div className="flex items-center justify-between px-2.5 py-2">
                <span className="text-[12.5px] font-semibold" style={{ color: 'var(--pp-text2)' }}>Apariencia</span>
                <ThemeToggleBtn small />
              </div>
              {isPlatformSuperAdmin && (
                <button
                  onClick={() => { setShowProfileMenu(false); onOpenSuperAdmin(); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-[12.5px] font-semibold transition-colors hover:bg-[#252525]"
                  style={{ color: 'var(--pp-text2)' }}
                >
                  <Building2 className="w-4 h-4" /> Panel de Super Admin
                </button>
              )}
              <div className="my-1" style={{ borderTop: '1px solid var(--pp-border2)' }} />
              <button
                onClick={() => { setShowProfileMenu(false); onLogout(); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-[12.5px] font-semibold transition-colors hover:bg-red-900/20 hover:text-red-400"
                style={{ color: 'var(--pp-text2)' }}
              >
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            </div>
          )}
          <button
            onClick={() => setShowProfileMenu(v => !v)}
            className="w-full rounded-[13px] p-3 flex items-center gap-2.5 transition-colors hover:bg-[#252525]"
            style={{ background: 'var(--pp-card)' }}
          >
            <div className="w-9 h-9 rounded-[9px] flex items-center justify-center text-[13px] font-bold flex-shrink-0" style={{ background: 'var(--pp-surface)', color: 'var(--pp-text7)' }}>{iniciales}</div>
            <div className="min-w-0 flex-1 text-left">
              <div className="text-[12.5px] font-bold truncate" style={{ color: 'var(--pp-text)' }}>{nombre}</div>
              <div className="text-[11px] truncate" style={{ color: 'var(--pp-text4)' }}>{rol}</div>
            </div>
            <ChevronUp className={`w-4 h-4 flex-shrink-0 transition-transform ${showProfileMenu ? '' : 'rotate-180'}`} style={{ color: 'var(--pp-text4)' }} />
          </button>
        </div>
      </div>
      <div className="text-center py-2 text-[10px]" style={{ color: 'var(--pp-text5)' }}>v{APP_VERSION}</div>
    </aside>
  );
}
