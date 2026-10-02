import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

// El menú se monta en <body> con position: fixed para que ningún contenedor con
// overflow (tarjetas, tablas) lo recorte, y se abre hacia arriba si no cabe abajo.
export function QuickActionsMenu({ items, size = 'md' }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const menuRef = useRef(null);
  const visibleItems = items.filter(Boolean);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    const btn = ref.current?.getBoundingClientRect();
    const menuH = menuRef.current?.offsetHeight || 0;
    if (!btn) return;
    const gap = 4;
    const cabeAbajo = btn.bottom + gap + menuH <= window.innerHeight - 8;
    const top = cabeAbajo || btn.top - gap - menuH < 8 ? btn.bottom + gap : btn.top - gap - menuH;
    setPos({ top, right: Math.max(8, window.innerWidth - btn.right) });
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
      {open && createPortal(
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className="fixed min-w-[190px] rounded-[12px] border py-1.5 z-[1000]"
          style={{
            top: pos?.top ?? 0, right: pos?.right ?? 0, visibility: pos ? 'visible' : 'hidden',
            background: 'var(--pp-card)', borderColor: 'var(--pp-border3)', boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
          }}
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
        </div>,
        document.body
      )}
    </div>
  );
}
