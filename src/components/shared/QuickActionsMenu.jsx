import { useState, useEffect, useRef } from 'react';
import { MoreVertical } from 'lucide-react';

export function QuickActionsMenu({ items, size = 'md' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const visibleItems = items.filter(Boolean);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (visibleItems.length === 0) return null;

  const btnSize = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';

  return (
    <div className="relative inline-block flex-shrink-0" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className={`${btnSize} rounded-[8px] flex items-center justify-center transition-colors hover:bg-[#252525]`}
        style={{ background: open ? 'var(--pp-active-bg)' : 'transparent', color: 'var(--pp-text2)' }}
        title="Más acciones"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-[calc(100%+4px)] min-w-[190px] rounded-[12px] border py-1.5 z-30"
          style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border3)', boxShadow: '0 16px 40px rgba(0,0,0,0.45)' }}
        >
          {visibleItems.map((item, i) => (
            <button
              key={i}
              onClick={() => { setOpen(false); item.onClick(); }}
              disabled={item.disabled}
              className="w-full flex items-center gap-2.5 text-left px-3.5 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[#1e1e1e] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: item.tone === 'danger' ? '#f87171' : 'var(--pp-text)' }}
            >
              {item.icon && <item.icon className="w-3.5 h-3.5 flex-shrink-0" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
