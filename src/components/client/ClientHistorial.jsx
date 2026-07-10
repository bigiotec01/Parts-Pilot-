import {
  Calendar, CheckCheck
} from 'lucide-react';
import { STATUS_CONFIG, STATUS_ORDER } from '../../constants/status';
import { formatDate } from '../../utils/format';
import { StatusBadge } from '../shared/StatusBadge';
import { EmptyState } from '../shared/FormField';

export function ClientProgressBar({ estado }) {
  const idx = STATUS_ORDER.indexOf(estado);
  const pct = Math.round((idx / (STATUS_ORDER.length - 1)) * 100);
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1.5" style={{ color: 'var(--pp-text3)' }}>
        <span>Inicio</span>
        <span className="font-medium" style={{ color: 'var(--pp-text2)' }}>{STATUS_CONFIG[estado].label}</span>
        <span>Entregado</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--pp-card)' }}>
        <div className="h-full bg-gradient-to-r from-[#c0c0c0] to-[#808080] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ClientHistorial({ pedidos, onSelect }) {
  const toMs = f => f?.toDate ? f.toDate().getTime() : new Date(f).getTime();
  const sorted = [...pedidos].sort((a, b) => toMs(b.fecha) - toMs(a.fecha));
  if (sorted.length === 0) return <EmptyState text="Aún no tienes órdenes completadas." />;
  return (
    <div className="space-y-3">
      <p className="text-sm" style={{ color: 'var(--pp-text3)' }}>{sorted.length} orden{sorted.length !== 1 ? 'es' : ''} completada{sorted.length !== 1 ? 's' : ''}</p>
      {sorted.map(p => (
        <button key={p.id} onClick={() => onSelect(p.id)} className="w-full text-left rounded-xl p-4 hover:border-[#a0a0a0] hover:shadow-sm transition-all border" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold truncate" style={{ color: 'var(--pp-text)' }}>{p.referencia || p.vehiculo}</h3>
              {p.referencia && <p className="text-sm truncate" style={{ color: 'var(--pp-text2)' }}>{p.vehiculo}</p>}
            </div>
            <StatusBadge estado={p.estado} />
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dashed text-xs" style={{ borderColor: 'var(--pp-border)', color: 'var(--pp-text3)' }}>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(p.fecha)}</span>
            {p.folio && <span className="font-mono font-medium" style={{ color: 'var(--pp-text2)' }}>{p.folio}</span>}
            <span className="flex items-center gap-1 ml-auto text-teal-500"><CheckCheck className="w-3.5 h-3.5" />Completada</span>
          </div>
        </button>
      ))}
    </div>
  );
}
