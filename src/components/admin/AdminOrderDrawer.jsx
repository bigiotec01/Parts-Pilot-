import { useState } from 'react';
import { ClipboardList, FileText, MessageSquare, X } from 'lucide-react';
import { StatusBadge } from '../shared/StatusBadge';
import { useAdminOrderContent } from './useAdminOrderContent';

/* ------------------------------------------------------------------ */
/*  Vista móvil de un pedido: bottom sheet con 3 pestañas. En          */
/*  escritorio AdminApp usa AdminOrderPage (mismo corte de 768px).     */
/* ------------------------------------------------------------------ */
export function AdminOrderDrawer({ initialTab = 'detalles', onClose, ...props }) {
  const [tab, setTab] = useState(initialTab);
  const { order } = props;
  const { estado, msgCount, detallesContent, estimadoContent, chatContent, notifyModal } = useAdminOrderContent(props);

  const tabs = [
    { id: 'detalles', label: 'Detalles', icon: ClipboardList },
    { id: 'estimado', label: 'Estimado', icon: FileText },
    { id: 'mensajes', label: 'Mensajes', icon: MessageSquare, badge: msgCount },
  ];

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0" style={{ background: 'var(--pp-overlay2)', animation: 'ppFade .2s ease both' }} onClick={onClose} />
      <div className="pp-scroll absolute bottom-0 left-0 right-0 max-h-[92%] overflow-y-auto overflow-x-hidden rounded-t-[24px] flex flex-col" style={{ background: 'var(--pp-card)', animation: 'ppSheet .3s cubic-bezier(.2,.8,.2,1) both' }}>
        <div className="sticky top-0 z-10 flex-shrink-0" style={{ background: 'var(--pp-card)', borderBottom: '1px solid var(--pp-border2)' }}>
          <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-3" style={{ background: 'var(--pp-surface)' }} />
          <div className="flex items-center gap-3 px-5 pb-3">
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[11px] font-semibold flex items-center gap-1.5 flex-wrap" style={{ color: 'var(--pp-text3)' }}>
                <span>{order.folio || order.id?.slice(0,8)}</span>
                {order.numeroPO && <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>PO# {order.numeroPO}</span>}
                {order.numeroOrden && <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>Orden {order.numeroOrden}</span>}
              </div>
              <h2 className="text-[17px] font-bold truncate" style={{ color: 'var(--pp-text)' }}>{order.vehiculo}</h2>
            </div>
            <StatusBadge estado={estado} />
            <button onClick={onClose} className="w-8 h-8 rounded-[9px] border flex items-center justify-center flex-shrink-0" style={{ borderColor: 'var(--pp-border)', color: 'var(--pp-text2)' }}><X className="w-4 h-4" /></button>
          </div>
          <div className="flex px-5">
            {tabs.map(({ id, label, icon: Icon, badge }) => (
              <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 py-3 text-[12.5px] font-semibold border-b-2 mr-5 transition-colors`} style={{ borderBottomColor: tab === id ? 'var(--pp-accent)' : 'transparent', color: tab === id ? 'var(--pp-text)' : 'var(--pp-text3)' }}>
                <Icon className="w-3.5 h-3.5" strokeWidth={1.8} /> {label}
                {badge > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--pp-card)', color: 'var(--pp-text2)' }}>{badge}</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="p-5" style={{ maxWidth: '100%', overflowX: 'hidden', paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))' }}>
          {tab === 'detalles' && detallesContent}
          {tab === 'estimado' && estimadoContent}
          {tab === 'mensajes' && chatContent}
        </div>
      </div>
      {notifyModal}
    </div>
  );
}
