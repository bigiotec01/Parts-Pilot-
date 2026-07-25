import { useState } from 'react';
import { Search } from 'lucide-react';
import { inputClass } from '../../constants/styles';
import { lsActivityKey } from '../../utils/activity';
import { EmptyState } from '../shared/FormField';

const AVATAR_GRADIENTS = [
  'linear-gradient(160deg, #3b82f6, #2563eb)',
  'linear-gradient(160deg, #8b5cf6, #7c3aed)',
  'linear-gradient(160deg, #10b981, #059669)',
  'linear-gradient(160deg, #ec4899, #db2777)',
  'linear-gradient(160deg, #06b6d4, #0891b2)',
];

function avatarGradient(seed) {
  const s = String(seed || '');
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

// Mensajes del taller que llegaron después de la última vez que el admin
// abrió este pedido — misma baseline (localStorage) que usa hasNewActivity.
export function unreadTallerCount(order) {
  try {
    const tallerMsgs = (order.mensajes || []).filter(m => m.from === 'taller').length;
    const raw = localStorage.getItem(lsActivityKey('admin', order.id));
    if (!raw) return tallerMsgs;
    const seen = JSON.parse(raw);
    return Math.max(0, tallerMsgs - (seen.tallerMsgs || 0));
  } catch { return 0; }
}

export function AdminMensajes({ pedidos, getTaller, onSelect }) {
  const [filter, setFilter] = useState('todos');
  const [search, setSearch] = useState('');

  const toMs = f => f?.toDate ? f.toDate().getTime() : new Date(f).getTime();
  const conversaciones = pedidos
    .filter(p => (p.mensajes?.length || 0) > 0)
    .map(p => ({ pedido: p, unread: unreadTallerCount(p) }))
    .sort((a, b) => toMs(b.pedido.fecha) - toMs(a.pedido.fecha));

  const totalNoLeidos = conversaciones.filter(c => c.unread > 0).length;

  const filtradas = conversaciones.filter(({ pedido: p, unread }) => {
    if (filter === 'noleidos' && unread === 0) return false;
    if (search) {
      const nombreTaller = getTaller(p.tallerId)?.nombre || '';
      const q = `${nombreTaller} ${p.folio || ''} ${p.vehiculo || ''}`.toLowerCase();
      if (!q.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  if (conversaciones.length === 0) {
    return <EmptyState text="Todavía no hay conversaciones con ningún taller." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-[320px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--pp-text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por taller o folio…" className={`${inputClass} pl-8`} />
        </div>
        <div className="flex items-center gap-1 rounded-[10px] border p-1" style={{ borderColor: 'var(--pp-border4)' }}>
          {[
            { val: 'todos', label: 'Todos' },
            { val: 'noleidos', label: `Sin leer${totalNoLeidos ? ` · ${totalNoLeidos}` : ''}` },
          ].map(f => (
            <button
              key={f.val}
              onClick={() => setFilter(f.val)}
              className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-colors"
              style={{ background: filter === f.val ? 'var(--pp-active-bg2)' : 'transparent', color: filter === f.val ? 'var(--pp-text6)' : 'var(--pp-text2)' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="text-center py-14 text-[13px]" style={{ color: 'var(--pp-text3)' }}>Ninguna conversación coincide.</div>
      ) : (
        <div className="rounded-[16px] border overflow-hidden" style={{ borderColor: 'var(--pp-border2)' }}>
          {filtradas.map(({ pedido: p, unread }) => {
            const taller = getTaller(p.tallerId);
            const mensajes = p.mensajes || [];
            const ultimo = mensajes[mensajes.length - 1];
            const preview = ultimo?.attachment ? `📎 ${ultimo.attachment.name}` : (ultimo?.texto || '');
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderBottom: '1px solid var(--pp-border2)' }}
              >
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[13px] font-extrabold flex-shrink-0 text-white" style={{ background: avatarGradient(p.tallerId || taller?.nombre) }}>
                  {(taller?.nombre || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] truncate" style={{ color: 'var(--pp-text)', fontWeight: unread > 0 ? 800 : 600 }}>{taller?.nombre || 'Taller'}</span>
                    <span className="text-[10.5px] font-mono flex-shrink-0" style={{ color: 'var(--pp-text3)' }}>{p.folio || p.id.slice(0, 8)}</span>
                  </div>
                  <p className="text-[12.5px] truncate" style={{ color: unread > 0 ? 'var(--pp-text7)' : 'var(--pp-text3)', fontWeight: unread > 0 ? 600 : 400 }}>
                    {ultimo?.from === 'admin' ? 'Tú: ' : ''}{preview || 'Sin mensajes de texto'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-[11px]" style={{ color: 'var(--pp-text3)' }}>{ultimo?.hora || ''}</span>
                  {unread > 0 && (
                    <span className="text-[10.5px] font-bold text-white rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center" style={{ background: '#f97316' }}>{unread}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
