import { useState, useEffect, useRef } from 'react';
import {
  FileText, Plus, Search, ChevronRight, MessageSquare, Bell
} from 'lucide-react';

export function NotificationPanel({ notifications, onSelect, onDismissAll }) {
  return (
    <div className="absolute right-0 top-[calc(100%+8px)] w-[340px] rounded-[16px] border z-50" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border3)', boxShadow: '0 24px 48px rgba(0,0,0,0.6)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--pp-border2)' }}>
        <span className="text-[13px] font-bold" style={{ color: 'var(--pp-text)' }}>Notificaciones</span>
        {notifications.length > 0 && (
          <button onClick={onDismissAll} className="text-[11px] font-semibold hover:underline" style={{ color: 'var(--pp-text2)' }}>Marcar todo leído</button>
        )}
      </div>
      <div className="max-h-[380px] overflow-y-auto pp-scroll">
        {notifications.length === 0 ? (
          <div className="py-10 text-center text-[13px]" style={{ color: 'var(--pp-text3)' }}>Sin notificaciones nuevas</div>
        ) : notifications.map((n, i) => (
          <button key={i} onClick={() => onSelect(n.orderId)} className="w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-[#1e1e1e] transition-colors" style={{ borderBottom: '1px solid var(--pp-border2)' }}>
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(160,160,160,0.1)' }}>
              {n.type === 'message'
                ? <MessageSquare className="w-[15px] h-[15px]" style={{ color: 'var(--pp-text8)' }} />
                : <FileText className="w-[15px] h-[15px]" style={{ color: 'var(--pp-text6)' }} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-bold" style={{ color: 'var(--pp-text)' }}>{n.label}</div>
              <div className="text-[11.5px] truncate mt-0.5" style={{ color: 'var(--pp-text2)' }}>{n.folio} · {n.vehiculo} · {n.taller}</div>
              {n.detail && <div className="text-[11px] truncate mt-0.5 italic" style={{ color: 'var(--pp-text3)' }}>"{n.detail}"</div>}
            </div>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-1" style={{ color: 'var(--pp-text3)' }} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function AdminTopbar({ pageTitle, pageSub, solicitudesCount, onGoToNuevo, notifications = [], onNotifSelect, onDismissAll, hideNuevoBtn }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    if (!showNotifs) return;
    const handler = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifs]);
  return (
    <header className="h-[70px] flex-shrink-0 flex items-center gap-[18px] px-[30px] sticky top-0 z-20 border-b" style={{ background: 'var(--pp-topbar)', backdropFilter: 'blur(12px)', borderColor: 'var(--pp-border2)' }}>
      <div className="min-w-0">
        <h1 className="text-[19px] font-bold leading-tight" style={{ color: 'var(--pp-text)', letterSpacing: '-.02em' }}>{pageTitle}</h1>
        <p className="text-[12.5px] font-medium" style={{ color: 'var(--pp-text2)' }}>{pageSub}</p>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 pointer-events-none" style={{ color: 'var(--pp-text3)' }} />
          <input placeholder="Buscar pedido, vehículo, folio…" className="pl-9 pr-3 py-[9px] rounded-[10px] text-[13px] border outline-none transition-[width] focus:w-[280px] focus:border-[#a0a0a0] focus:ring-2 focus:ring-[#a0a0a0]/10" style={{ width: 240, background: 'var(--pp-card)', borderColor: 'var(--pp-border4)', color: 'var(--pp-text)' }} />
        </div>
        <div className="relative" ref={bellRef}>
          <button onClick={() => setShowNotifs(v => !v)} className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center border transition-colors hover:bg-[#252525]" style={{ background: showNotifs ? '#252525' : 'var(--pp-card)', borderColor: showNotifs ? 'var(--pp-border3)' : 'var(--pp-surface)', color: 'var(--pp-text2)' }} title="Notificaciones">
            <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} />
          </button>
          {notifications.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'var(--pp-accent)', color: '#fff' }}>
              {notifications.length}
            </span>
          )}
          {showNotifs && (
            <NotificationPanel
              notifications={notifications}
              onSelect={(id) => { onNotifSelect(id); setShowNotifs(false); }}
              onDismissAll={() => { onDismissAll(); setShowNotifs(false); }}
            />
          )}
        </div>
        {!hideNuevoBtn && (
          <button onClick={onGoToNuevo} className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-[#707070]" style={{ background: 'var(--pp-accent)' }}>
            <Plus className="w-4 h-4" strokeWidth={2.2} /> Nuevo pedido
          </button>
        )}
      </div>
    </header>
  );
}
