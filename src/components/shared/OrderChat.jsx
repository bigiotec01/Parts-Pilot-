import { useState } from 'react';
import {
  FileText, AlertCircle, Send, MessageSquare, Paperclip, Trash2
} from 'lucide-react';
import { inputClass } from '../../constants/styles';

export function ChatAttachment({ attachment, isMine }) {
  if (!attachment) return null;
  if (attachment.type?.startsWith('image/')) {
    return <img src={attachment.url} alt={attachment.name} className="rounded-lg max-w-full max-h-48 object-cover" />;
  }
  return (
    <a
      href={attachment.url} target="_blank" rel="noreferrer"
      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors ${isMine ? 'bg-white/15 hover:bg-white/25 text-white' : 'border hover:border-[#a0a0a0]'}`}
      style={!isMine ? { background: 'var(--pp-card)', borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' } : {}}
    >
      <FileText className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm truncate">{attachment.name}</span>
    </a>
  );
}

export function OrderChat({ order, role, otherPartyName, onSendMessage, onDeleteMessage }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const [deletingIndex, setDeletingIndex] = useState(null);
  const mensajes = order.mensajes || [];

  const handleDelete = async (index) => {
    if (!window.confirm('¿Borrar este mensaje? Esta acción no se puede deshacer.')) return;
    setDeletingIndex(index);
    setChatError('');
    try {
      await onDeleteMessage(mensajes, index);
    } catch (err) {
      setChatError('No se pudo borrar: ' + (err.message || err.code));
    } finally {
      setDeletingIndex(null);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setChatError('');
    try {
      await onSendMessage(order.id, text.trim());
      setText('');
    } catch (err) {
      setChatError('No se pudo enviar: ' + (err.message || err.code));
    } finally {
      setSending(false);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setChatError('');
    try {
      await onSendMessage(order.id, '', { name: file.name, type: file.type, file });
    } catch (err) {
      setChatError('No se pudo adjuntar: ' + (err.message || err.code));
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full min-h-[320px]">
      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {mensajes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-sm px-6" style={{ color: 'var(--pp-text3)' }}>
            <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
            Aún no hay mensajes en este pedido.<br />Escribe el primero o adjunta una foto / PDF.
          </div>
        ) : mensajes.map((m, i) => {
          const isMine = m.from === role;
          const canDelete = role === 'admin' && onDeleteMessage;
          return (
            <div key={i} className={`group flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              {!isMine && <span className="text-[11px] mb-0.5 px-1" style={{ color: 'var(--pp-text3)' }}>{otherPartyName}</span>}
              <div className="flex items-center gap-1.5">
                {canDelete && isMine && (
                  <button
                    type="button"
                    onClick={() => handleDelete(i)}
                    disabled={deletingIndex === i}
                    title="Borrar mensaje"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 disabled:opacity-60 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <div
                  className="max-w-[82%] rounded-[14px] px-3.5 py-2.5 text-[13px] leading-snug space-y-1.5"
                  style={{
                    background: isMine ? 'var(--pp-surface)' : 'var(--pp-card)',
                    color: isMine ? 'var(--pp-text)' : 'var(--pp-text)',
                    borderBottomRightRadius: isMine ? 5 : 14,
                    borderBottomLeftRadius: isMine ? 14 : 5,
                  }}
                >
                  {m.attachment && <ChatAttachment attachment={m.attachment} isMine={isMine} />}
                  {m.texto && <p>{m.texto}</p>}
                </div>
                {canDelete && !isMine && (
                  <button
                    type="button"
                    onClick={() => handleDelete(i)}
                    disabled={deletingIndex === i}
                    title="Borrar mensaje"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 disabled:opacity-60 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-[10.5px] mt-1 px-1" style={{ color: 'var(--pp-text3)' }}>{m.hora}</span>
            </div>
          );
        })}
      </div>
      {chatError && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {chatError}
        </div>
      )}
      <form onSubmit={handleSend} className="flex items-center gap-2 pt-3 mt-2 border-t" style={{ borderColor: 'var(--pp-border2)' }}>
        <label className="p-2.5 rounded-lg transition-colors flex-shrink-0 cursor-pointer hover:bg-[#1e1e1e]" style={{ background: 'var(--pp-card)', color: 'var(--pp-text2)' }} title="Adjuntar foto o PDF">
          <Paperclip className="w-4 h-4" />
          <input type="file" accept="image/*,application/pdf" onChange={handleFile} className="hidden" />
        </label>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Escribe un mensaje..." className={`${inputClass} flex-1`} disabled={sending} />
        <button type="submit" disabled={sending} className="disabled:opacity-60 text-white p-2.5 rounded-lg transition-colors flex-shrink-0 hover:bg-[#707070]" style={{ background: 'var(--pp-accent)' }}>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
