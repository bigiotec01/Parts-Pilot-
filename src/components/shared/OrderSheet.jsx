import { useState } from 'react';
import {
  X, MessageSquare
} from 'lucide-react';
import { OrderChat } from './OrderChat';

export function OrderSheet({ order, title, onClose, detailContent, chatProps }) {
  const [tab, setTab] = useState('detalle');
  const messageCount = (order.mensajes || []).length;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0" style={{ background: 'var(--pp-overlay2)', animation: 'ppFade .2s ease both' }} onClick={onClose} />
      <div className="pp-scroll absolute bottom-0 left-0 right-0 max-h-[88%] overflow-y-auto overflow-x-hidden rounded-t-[28px] flex flex-col" style={{ background: 'var(--pp-card)', animation: 'ppSheet .3s cubic-bezier(.2,.8,.2,1) both', WebkitOverflowScrolling: 'touch' }}>
        <div className="sticky top-0 z-10 px-5 pt-3 pb-4 border-b" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border2)' }}>
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--pp-surface)' }} />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-mono text-[11.5px] font-semibold" style={{ color: 'var(--pp-text3)' }}>{order.folio || order.id?.slice(0,8)}</div>
              <h2 className="text-[17px] font-bold mt-0.5" style={{ color: 'var(--pp-text)', letterSpacing: '-.01em' }}>{title}</h2>
              {order.pieza && <p className="text-[12.5px]" style={{ color: 'var(--pp-text2)' }}>{order.pieza}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-[9px] border flex items-center justify-center flex-shrink-0" style={{ borderColor: 'var(--pp-border)', color: 'var(--pp-text2)' }}><X className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-4 mt-3">
            {[['detalle','Detalle'], ['chat','Mensajes']].map(([id, lbl]) => (
              <button key={id} onClick={() => setTab(id)} className={`py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5`} style={{ borderBottomColor: tab === id ? 'var(--pp-accent)' : 'transparent', color: tab === id ? 'var(--pp-text)' : 'var(--pp-text3)' }}>
                {id === 'chat' && <MessageSquare className="w-4 h-4" />}{lbl}
                {id === 'chat' && messageCount > 0 && <span className="text-[10px] rounded-full px-1.5 py-0.5" style={{ background: 'var(--pp-card)', color: 'var(--pp-text2)' }}>{messageCount}</span>}
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
