import { PERM_OPTS } from '../../constants/permisos';

export function PermBadge({ val }) {
  const opt = PERM_OPTS.find(o => o.val === val) || PERM_OPTS[0];
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[7px]" style={{ background: opt.bg, color: opt.color }}>
      {opt.label}
    </span>
  );
}

export function PermSelector({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {PERM_OPTS.map(opt => (
        <button key={opt.val} onClick={() => onChange(opt.val)}
          className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all border"
          style={{
            background: value === opt.val ? opt.bg : 'var(--pp-card)',
            color: value === opt.val ? opt.color : 'var(--pp-text2)',
            borderColor: value === opt.val ? opt.color + '40' : 'var(--pp-surface)',
          }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
