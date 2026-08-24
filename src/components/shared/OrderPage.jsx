import { ArrowLeft, MessageSquare } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { OrderChat } from './OrderChat';

/* ------------------------------------------------------------------ */
/*  Vista de escritorio de un pedido para el taller: pagina completa   */
/*  (no modal), con el detalle a la izquierda y Mensajes fijo a la      */
/*  derecha, siempre visible. Recibe las mismas props genericas que     */
/*  OrderDrawer/OrderSheet, asi que no cambia ninguna logica del padre. */
/* ------------------------------------------------------------------ */
export function OrderPage({ order, title, onClose, detailContent, chatProps }) {
  const messageCount = (order.mensajes || []).length;

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onClose} className="w-9 h-9 rounded-[10px] border flex items-center justify-center hover:bg-[#1e1e1e] transition-colors flex-shrink-0" style={{ borderColor: 'var(--pp-border)', color: 'var(--pp-text2)' }} title="Volver">
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[12px] font-semibold" style={{ color: 'var(--pp-text3)' }}>{order.folio || order.id?.slice(0, 8)}</div>
          <h1 className="text-[22px] font-bold leading-tight truncate" style={{ color: 'var(--pp-text)', letterSpacing: '-.02em' }}>{title}</h1>
          {order.pieza && <p className="text-[13px] mt-0.5" style={{ color: 'var(--pp-text2)' }}>{order.pieza}</p>}
        </div>
        <StatusBadge estado={order.estado} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Columna principal: detalle del pedido */}
        <div className="min-w-0 rounded-[16px] border p-6" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
          {detailContent}
        </div>

        {/* Columna fija: mensajes siempre visibles */}
        <div className="lg:sticky lg:top-5 rounded-[16px] border flex flex-col" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)', height: 'calc(100vh - 180px)' }}>
          <div className="flex items-center gap-2 px-4 py-3.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--pp-border2)' }}>
            <MessageSquare className="w-4 h-4" style={{ color: 'var(--pp-text2)' }} />
            <span className="text-[13px] font-bold flex-1" style={{ color: 'var(--pp-text)' }}>Mensajes</span>
            {messageCount > 0 && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--pp-active-bg)', color: 'var(--pp-text8)' }}>{messageCount}</span>}
          </div>
          <div className="flex-1 min-h-0 p-4">
            <OrderChat order={order} {...chatProps} />
          </div>
        </div>
      </div>
    </div>
  );
}
