import { formatDate, daysSince } from '../../utils/format';
import { Pencil, Trash2 } from 'lucide-react';

function PiezaRow({ p, onEdit, onDelete }) {
  const dias = p.estado === 'pendiente' ? daysSince(p.primeraDeteccion) : null;
  return (
    <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[8px]" style={{ background: 'var(--pp-input-bg)' }}>
      <div className="min-w-0">
        <p className="text-[12.5px] font-mono font-semibold truncate" style={{ color: 'var(--pp-text)' }}>{p.numeroPieza}</p>
        {p.descripcion && <p className="text-[11px] truncate" style={{ color: 'var(--pp-text3)' }}>{p.descripcion}</p>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="flex items-center gap-1 text-[11.5px] font-semibold whitespace-nowrap">
          {p.estado === 'recibida' && <span style={{ color: '#059669' }}>🟢 Recibida{p.fechaRecibida && <span className="font-normal" style={{ color: 'var(--pp-text3)' }}> · {formatDate(p.fechaRecibida)}</span>}</span>}
          {p.estado === 'en_tienda' && <span style={{ color: '#2563eb' }}>🔵 En tienda</span>}
          {p.estado === 'pendiente' && (
            <span style={{ color: '#d97706' }}>
              🟡 En espera{dias != null && dias > 0 ? <span className="font-normal"> · hace {dias} día{dias === 1 ? '' : 's'}</span> : ''}
            </span>
          )}
        </span>
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-0.5">
            {onEdit && (
              <button type="button" onClick={() => onEdit(p)} title="Editar pieza" className="w-6 h-6 rounded-[6px] flex items-center justify-center transition-colors hover:bg-[#ffffff1a]" style={{ color: 'var(--pp-text3)' }}>
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button type="button" onClick={() => onDelete(p)} title="Eliminar pieza" className="w-6 h-6 rounded-[6px] flex items-center justify-center transition-colors hover:bg-[#ffffff1a]" style={{ color: 'var(--pp-text3)' }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Un solo despliegue con todas las piezas juntas, ordenadas con las
// pendientes primero (para priorizar reclamos a proveedor) y las ya
// recibidas/en tienda después.
const ORDEN_ESTADO = { pendiente: 0, en_tienda: 1, recibida: 2 };

export function PiezasList({ piezas, onEdit, onDelete }) {
  const ordenadas = [...piezas].sort((a, b) => (ORDEN_ESTADO[a.estado] ?? 99) - (ORDEN_ESTADO[b.estado] ?? 99));

  return (
    <div className="space-y-1.5">
      {ordenadas.map(p => <PiezaRow key={p.numeroPieza} p={p} onEdit={onEdit} onDelete={onDelete} />)}
    </div>
  );
}
