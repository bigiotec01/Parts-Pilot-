import { STATUS_ORDER } from '../../constants/status';
import { useTheme } from '../../theme/ThemeContext';

export function StatusBadge({ estado }) {
  const { statusConfig } = useTheme();
  const cfg = statusConfig[estado];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.tx }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.short}
    </span>
  );
}

export function StatusStepper({ estado, onSelect }) {
  const { statusConfig } = useTheme();
  const currentIndex = STATUS_ORDER.indexOf(estado);
  const pct = Math.round((currentIndex / (STATUS_ORDER.length - 1)) * 100);
  const cfg = statusConfig[estado];
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-semibold" style={{ color: cfg.tx }}>{cfg.short}</span>
        <span className="text-[11px]" style={{ color: 'var(--pp-text3)' }}>Paso {currentIndex + 1} de {STATUS_ORDER.length}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: 'var(--pp-progress-bg)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cfg.dot }} />
      </div>
      <div style={{ overflowX: 'auto', overflowY: 'clip', WebkitOverflowScrolling: 'touch' }}>
      <div className="flex items-start" style={{ minWidth: 'max-content', paddingTop: 6, paddingBottom: 6 }}>
        {STATUS_ORDER.map((status, i) => {
          const scfg = statusConfig[status];
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          const active = isDone || isCurrent;
          const Node = onSelect ? 'button' : 'div';
          return (
            <div key={status} className="flex items-center">
              <Node
                type={onSelect ? 'button' : undefined}
                onClick={onSelect ? () => onSelect(status) : undefined}
                className={`flex flex-col items-center gap-1.5 w-14 sm:w-16 ${onSelect ? 'cursor-pointer group' : ''}`}
                title={onSelect ? `Cambiar a: ${scfg.label}` : undefined}
              >
                <div
                  className={onSelect ? 'w-3.5 h-3.5 rounded-full transition-transform group-hover:scale-125' : 'w-3.5 h-3.5 rounded-full'}
                  style={{
                    background: active ? scfg.dot : 'var(--pp-step-inactive)',
                    boxShadow: isCurrent ? `0 0 0 4px ${scfg.bg}` : 'none',
                  }}
                />
                <span
                  className="text-[9.5px] text-center leading-tight"
                  style={{ color: isCurrent ? 'var(--pp-text)' : 'var(--pp-text3)', fontWeight: isCurrent ? 700 : 500 }}
                >
                  {scfg.short}
                </span>
              </Node>
              {i < STATUS_ORDER.length - 1 && (
                <div
                  className="h-0.5 w-6 sm:w-10 -mt-4"
                  style={{ background: isDone ? scfg.dot : 'var(--pp-step-inactive)' }}
                />
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
