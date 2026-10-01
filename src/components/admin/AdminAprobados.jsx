import { useState } from 'react';
import { BadgeCheck, Building2, ArrowRightCircle, Paperclip } from 'lucide-react';
import { hasNewActivity } from '../../utils/activity';
import { formatDate, cleanText, filesOf } from '../../utils/format';
import { CopyChip } from '../shared/CopyChip';

const toTime = (f) => f?.toDate ? f.toDate().getTime() : new Date(f + 'T00:00:00').getTime();

// Órdenes que llegan de Tag Logic ya aprobadas: no pasan por cotización, solo
// esperan que el admin las revise y las mande a Pedidos ("Por ordenar").
export function AdminAprobados({ aprobados, getTaller, onSelect, onChangeStatus }) {
  const [moviendo, setMoviendo] = useState(null);

  if (aprobados.length === 0) return (
    <div className="text-center py-14" style={{ color: 'var(--pp-text9)' }}>
      <BadgeCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
      <p className="text-sm">No hay órdenes aprobadas pendientes.</p>
    </div>
  );

  const handleMover = async (e, p) => {
    e.stopPropagation();
    setMoviendo(p.id);
    try { await onChangeStatus(p.id, 'pedido_fabrica', p.fechaEntrega || ''); }
    finally { setMoviendo(null); }
  };

  const ordenados = [...aprobados].sort((a, b) => toTime(a.fecha) - toTime(b.fecha));

  return (
    <div className="rounded-[15px] border overflow-hidden" style={{ borderColor: 'var(--pp-border)', background: 'var(--pp-card)' }}>
      {ordenados.map(p => {
        const taller = getTaller(p.tallerId);
        const hasAct = hasNewActivity('admin', p);
        const archivos = filesOf(p.archivo, p.archivos);
        return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(p.id)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSelect(p.id); }}
            className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-[var(--pp-hover)]"
            style={{ borderColor: 'var(--pp-border2)', background: hasAct ? 'rgba(245,158,11,0.06)' : undefined }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-[13.5px] font-bold truncate min-w-0" style={{ color: 'var(--pp-text)' }}>{p.vehiculo || '—'}</h3>
                {p.pieza && <span className="text-[12.5px] truncate" style={{ color: 'var(--pp-text2)' }}>· {p.pieza}</span>}
                {hasAct && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#f59e0b' }} />}
              </div>
              <p className="text-[11.5px] flex items-center gap-1 mt-0.5 min-w-0" style={{ color: 'var(--pp-text3)' }}>
                <Building2 className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{taller?.nombre || p.tallerNombre || '—'} · <span className="font-mono">{p.folio || p.id?.slice(0, 8)}</span> · {formatDate(p.fecha)}</span>
                {archivos.length > 0 && <span className="flex items-center gap-0.5 flex-shrink-0"><Paperclip className="w-3 h-3" />{archivos.length}</span>}
              </p>
              {p.notas && <p className="text-[12px] line-clamp-1 mt-1" style={{ color: 'var(--pp-text2)' }}>{cleanText(p.notas)}</p>}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <CopyChip label="PO#" value={p.numeroPO} size="sm" />
                <CopyChip label="Orden" value={p.numeroOrden} size="sm" />
                <CopyChip label="Ref. Tag Logic" value={p.ref} size="sm" />
              </div>
            </div>
            {onChangeStatus && (
              <button
                onClick={(e) => handleMover(e, p)}
                disabled={moviendo === p.id}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[9px] text-white text-[12.5px] font-bold flex-shrink-0 hover:bg-[#8E1620] disabled:opacity-60"
                style={{ background: 'var(--pp-accent)' }}
                title="Mover a Pedidos con estado Por ordenar"
              >
                <ArrowRightCircle className="w-4 h-4" /> {moviendo === p.id ? 'Moviendo…' : 'Pasar a Pedidos'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
