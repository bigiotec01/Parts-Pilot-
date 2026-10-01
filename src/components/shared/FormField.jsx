import {
  Package
} from 'lucide-react';

export function FormField({ label, children }) {
  return (
    <div>
      <label className="text-[12.5px] font-semibold block mb-1.5" style={{ color: 'var(--pp-text2)' }}>{label}</label>
      {children}
    </div>
  );
}

export function InfoItem({ label, value }) {
  return (
    <div className="rounded-[11px] p-3" style={{ background: 'var(--pp-card)' }}>
      <p className="text-[11px] mb-0.5" style={{ color: 'var(--pp-text3)' }}>{label}</p>
      <p className="text-[13.5px] font-semibold truncate" style={{ color: 'var(--pp-text)' }}>{value}</p>
    </div>
  );
}

// Pantalla vacía con ilustración (ícono en anillos) y, opcionalmente, un botón
// que lleva a la siguiente acción útil.
export function EmptyState({ text, title, icon: Icon = Package, tone = '#94a3b8', actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-4" style={{ animation: 'ppRise .3s ease both' }}>
      <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
        <span className="absolute inset-0 rounded-full" style={{ background: tone, opacity: 0.06 }} />
        <span className="absolute inset-3 rounded-full" style={{ background: tone, opacity: 0.1 }} />
        <span className="relative w-12 h-12 rounded-[14px] flex items-center justify-center" style={{ background: 'var(--pp-card)', border: `1px solid ${tone}55`, boxShadow: `0 8px 22px -10px ${tone}` }}>
          <Icon className="w-6 h-6" style={{ color: tone }} />
        </span>
      </div>
      {title && <p className="text-[15px] font-bold mb-1" style={{ color: 'var(--pp-text)' }}>{title}</p>}
      <p className="text-[13px] max-w-[320px]" style={{ color: 'var(--pp-text3)' }}>{text}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="mt-4 px-4 py-2 rounded-[10px] text-[12.5px] font-bold border transition-colors hover:border-[#C6202B]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text)', background: 'var(--pp-surface)' }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
