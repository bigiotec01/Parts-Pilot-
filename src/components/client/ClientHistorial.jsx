import { useMemo, useState } from 'react';
import {
  Calendar, CheckCheck, XCircle
} from 'lucide-react';
import { STATUS_CONFIG, STATUS_ORDER } from '../../constants/status';
import { formatDate } from '../../utils/format';
import { StatusBadge } from '../shared/StatusBadge';
import { EmptyState } from '../shared/FormField';
import { OrderListHeader, OrderListRow } from '../shared/OrderCard';
import { ViewToggle } from '../shared/ViewToggle';

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

const toTime = (d) => {
  if (!d) return 0;
  const date = d?.toDate ? d.toDate() : new Date(d);
  return isNaN(date) ? 0 : date.getTime();
};

const LIST_SORT_VALUE = {
  vehiculo: (p) => (p.referencia || p.vehiculo || '').toLowerCase(),
  folio: (p) => (p.folio || p.id || '').toLowerCase(),
  fecha: (p) => toTime(p.fecha),
  estado: (p) => STATUS_ORDER.indexOf(p.estado),
};

export function ClientHistorial({ pedidos, onSelect }) {
  const [view, setView] = useState('lista');
  const [sortBy, setSortBy] = useState('fecha');
  const [sortDir, setSortDir] = useState('desc');
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    const getValue = LIST_SORT_VALUE[sortBy];
    const arr = [...pedidos];
    arr.sort((a, b) => {
      const va = getValue(a), vb = getValue(b);
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [pedidos, sortBy, sortDir]);

  if (sorted.length === 0) return <EmptyState text="Aún no tienes pedidos en el historial." />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm" style={{ color: 'var(--pp-text3)' }}>{sorted.length} pedido{sorted.length !== 1 ? 's' : ''} en el historial</p>
        <ViewToggle view={view} onChange={setView} />
      </div>
      {view === 'lista' ? (
        <div className="rounded-[15px] border overflow-hidden sm:grid sm:grid-cols-[1.9fr_1fr_0.85fr_1fr_auto_28px]" style={{ borderColor: 'var(--pp-border)', background: 'var(--pp-card)' }}>
          <OrderListHeader sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
          {sorted.map(p => <OrderListRow key={p.id} order={p} onClick={() => onSelect(p.id)} />)}
        </div>
      ) : sorted.map(p => {
        const rechazado = p.estado === 'rechazado';
        return (
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
            {rechazado
              ? <span className="flex items-center gap-1 ml-auto text-red-500"><XCircle className="w-3.5 h-3.5" />Rechazada</span>
              : <span className="flex items-center gap-1 ml-auto text-teal-500"><CheckCheck className="w-3.5 h-3.5" />Completada</span>}
          </div>
        </button>
        );
      })}
    </div>
  );
}
