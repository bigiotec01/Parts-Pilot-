import { useState } from 'react';
import { ClipboardList, FileText, MessageSquare, ArrowLeft } from 'lucide-react';
import { StatusBadge } from '../shared/StatusBadge';
import { useAdminOrderContent } from './useAdminOrderContent';

/* ------------------------------------------------------------------ */
/*  Vista de escritorio de un pedido: pagina completa (no modal),      */
/*  con la barra lateral de admin siempre visible. Detalles/Estimado   */
/*  en pestañas a la izquierda; Mensajes queda fijo a la derecha.      */
/* ------------------------------------------------------------------ */
export function AdminOrderPage({ initialTab = 'detalles', onClose, ...props }) {
  const [tab, setTab] = useState(initialTab === 'mensajes' ? 'detalles' : initialTab);
  const { order } = props;
  const { estado, msgCount, detallesContent, estimadoContent, chatContent, notifyModal } = useAdminOrderContent(props);

  const tabs = [
    { id: 'detalles', label: 'Detalles', icon: ClipboardList },
    { id: 'estimado', label: 'Estimado', icon: FileText },
  ];

  /* ── Página completa de escritorio: detalle a la izquierda, chat fijo a la derecha ── */
  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onClose} className="w-9 h-9 rounded-[10px] border flex items-center justify-center hover:bg-[#1e1e1e] transition-colors flex-shrink-0" style={{ borderColor: 'var(--pp-border)', color: 'var(--pp-text2)' }} title="Volver">
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[12px] font-semibold flex items-center gap-2 flex-wrap" style={{ color: 'var(--pp-text3)' }}>
            <span>{order.folio || order.id?.slice(0,8)}</span>
            {order.numeroPO && <span className="px-1.5 py-0.5 rounded-md text-[10.5px] font-bold" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>PO# {order.numeroPO}</span>}
            {order.numeroOrden && <span className="px-1.5 py-0.5 rounded-md text-[10.5px] font-bold" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>Orden {order.numeroOrden}</span>}
          </div>
          <h1 className="text-[22px] font-bold leading-tight truncate" style={{ color: 'var(--pp-text)', letterSpacing: '-.02em' }}>{order.vehiculo || '—'}</h1>
        </div>
        <StatusBadge estado={estado} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Columna principal: pestañas Detalles / Estimado */}
        <div className="min-w-0 rounded-[16px] border" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
          <div className="flex px-6" style={{ borderBottom: '1px solid var(--pp-border2)' }}>
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} className="flex items-center gap-1.5 px-1 py-3.5 text-[13px] font-semibold border-b-2 mr-6 transition-colors" style={{ borderBottomColor: tab === id ? 'var(--pp-accent)' : 'transparent', color: tab === id ? 'var(--pp-text)' : 'var(--pp-text3)' }}>
                <Icon className="w-4 h-4" strokeWidth={1.8} /> {label}
              </button>
            ))}
          </div>
          <div className="p-6">
            {tab === 'detalles' && detallesContent}
            {tab === 'estimado' && estimadoContent}
          </div>
        </div>

        {/* Columna fija: mensajes siempre visibles */}
        <div className="lg:sticky lg:top-5 rounded-[16px] border flex flex-col" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)', height: 'calc(100vh - 180px)' }}>
          <div className="flex items-center gap-2 px-4 py-3.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--pp-border2)' }}>
            <MessageSquare className="w-4 h-4" style={{ color: 'var(--pp-text2)' }} />
            <span className="text-[13px] font-bold flex-1" style={{ color: 'var(--pp-text)' }}>Mensajes</span>
            {msgCount > 0 && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--pp-active-bg)', color: 'var(--pp-text8)' }}>{msgCount}</span>}
          </div>
          <div className="flex-1 min-h-0 p-4">
            {chatContent}
          </div>
        </div>
      </div>

      {notifyModal}
    </div>
  );
}
