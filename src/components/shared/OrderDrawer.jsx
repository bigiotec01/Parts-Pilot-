import {
  X, MessageSquare
} from 'lucide-react';
import { Header } from './Header';
import { StatusBadge } from './StatusBadge';
import { OrderChat } from './OrderChat';

export function OrderDrawer({ order, title, onClose, detailContent, chatProps }) {
  const messageCount = (order.mensajes || []).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0"
        style={{ background: 'var(--pp-overlay)', animation: 'ppFade .2s ease both' }}
        onClick={onClose}
      />
      <div
        className="relative w-full flex flex-col"
        style={{
          maxWidth: 980,
          maxHeight: '90vh',
          background: 'var(--pp-card)',
          borderRadius: 20,
          boxShadow: '0 40px 80px -20px rgba(0,0,0,.35)',
          animation: 'ppRise .28s cubic-bezier(.2,.8,.2,1) both',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-7 py-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--pp-border2)' }}>
          <div className="flex items-center gap-4 min-w-0">
            <div>
              <div className="font-mono text-[12px] font-semibold mb-0.5" style={{ color: 'var(--pp-text3)' }}>
                {order.folio || order.id?.slice(0, 8)}
              </div>
              <h2 className="text-[20px] font-bold leading-tight" style={{ color: 'var(--pp-text)', letterSpacing: '-.02em' }}>
                {title}
              </h2>
              {order.pieza && (
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--pp-text2)' }}>{order.pieza}</p>
              )}
            </div>
            <StatusBadge estado={order.estado} />
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-[10px] border flex items-center justify-center flex-shrink-0 hover:bg-[#1e1e1e] transition-colors"
            style={{ borderColor: 'var(--pp-border)', color: 'var(--pp-text2)' }}
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Body: 2 columnas */}
        <div className="flex-1 overflow-hidden flex min-h-0">
          {/* Columna izquierda — detalle */}
          <div className="flex-1 overflow-y-auto p-7" style={{ borderRight: '1px solid var(--pp-border2)' }}>
            {detailContent}
          </div>

          {/* Columna derecha — mensajes */}
          <div className="flex flex-col" style={{ width: 360, flexShrink: 0 }}>
            <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--pp-border2)' }}>
              <p className="text-[13px] font-bold flex items-center gap-2" style={{ color: 'var(--pp-text)' }}>
                <MessageSquare className="w-4 h-4" strokeWidth={1.8} />
                Mensajes
                {messageCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--pp-card)', color: 'var(--pp-text2)' }}>
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
