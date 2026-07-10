import { useState } from 'react';
import {
  MessageSquare
} from 'lucide-react';
import { Modal } from './Modal';
import { OrderChat } from './OrderChat';

export function OrderModal({ order, title, onClose, detailContent, chatProps }) {
  const [tab, setTab] = useState('detalle');
  const messageCount = (order.mensajes || []).length;

  return (
    <Modal title={title} onClose={onClose}>
      <div className="flex gap-1 mb-4 -mt-1 border-b" style={{ borderColor: 'var(--pp-border2)' }}>
        <button
          onClick={() => setTab('detalle')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors`}
          style={{ borderBottomColor: tab === 'detalle' ? 'var(--pp-accent)' : 'transparent', color: tab === 'detalle' ? 'var(--pp-text)' : 'var(--pp-text3)' }}
        >
          Detalle
        </button>
        <button
          onClick={() => setTab('chat')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5`}
          style={{ borderBottomColor: tab === 'chat' ? 'var(--pp-accent)' : 'transparent', color: tab === 'chat' ? 'var(--pp-text)' : 'var(--pp-text3)' }}
        >
          <MessageSquare className="w-4 h-4" /> Mensajes
          {messageCount > 0 && <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none" style={{ background: 'var(--pp-card)', color: 'var(--pp-text2)' }}>{messageCount}</span>}
        </button>
      </div>
      {tab === 'detalle' ? detailContent : <OrderChat order={order} {...chatProps} />}
    </Modal>
  );
}
