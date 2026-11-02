import { formatDate, daysSince } from '../../utils/format';
import { Pencil, Trash2 } from 'lucide-react';
import { normalizarPieza } from '../../utils/piezasExcel';

function PiezaRow({ p, i, dupInfo, onEdit, onDelete }) {
  const dias = p.estado === 'pendiente' ? daysSince(p.primeraDeteccion) : null;
  return (
    <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[8px]" style={{ background: 'var(--pp-input-bg)' }}>
      <div className="min-w-0">
        <p className="text-[12.5px] font-mono font-semibold truncate" style={{ color: 'var(--pp-text)' }}>
          {p.numeroPieza || <span className="font-sans font-normal italic" style={{ color: 'var(--pp-text3)' }}>Sin número</span>}
          {dupInfo && (
            <span className="ml-1.5 font-sans font-normal text-[10px] px-1.5 py-0.5 rounded-full align-middle" style={{ background: 'rgba(245,158,11,0.15)', color: '#b45309' }} title="Hay más de una pieza con este mismo número — se identifican por su posición en la lista, no se van a mezclar al editarlas.">
              {dupInfo.n}/{dupInfo.total} repetida
            </span>
          )}
        </p>
        {p.descripcion && <p className="text-[11.5px] truncate" style={{ color: 'var(--pp-text2)' }}>{p.descripcion}</p>}
        {p.referencia && <p className="text-[11px] truncate" style={{ color: 'var(--pp-text3)' }}>Ref. <span className="font-mono font-semibold" style={{ color: 'var(--pp-text2)' }}>{p.referencia}</span></p>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="flex items-center gap-1 text-[11.5px] font-semibold whitespace-nowrap">
          {p.estado === 'recibida' && <span style={{ color: '#059669' }}>🟢 Recibida{p.fechaRecibida && <span className="font-normal" style={{ color: 'var(--pp-text3)' }}> · {formatDate(p.fechaRecibida)}</span>}</span>}
          {p.estado === 'en_tienda' && <span style={{ color: '#2563eb' }}>🔵 En tienda</span>}
          {p.estado === 'entregada' && <span style={{ color: 'var(--pp-text3)' }}>✅ Entregada{p.fechaEntregada && <span className="font-normal"> · {formatDate(p.fechaEntregada)}</span>}</span>}
          {p.estado === 'pendiente' && (
            <span style={{ color: '#d97706' }}>
              🟡 En espera{dias != null && dias > 0 ? <span className="font-normal"> · hace {dias} día{dias === 1 ? '' : 's'}</span> : ''}
            </span>
          )}
        </span>
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-0.5">
            {onEdit && (
              <button type="button" onClick={() => onEdit(p, i)} title="Editar pieza" className="w-6 h-6 rounded-[6px] flex items-center justify-center transition-colors hover:bg-[#ffffff1a]" style={{ color: 'var(--pp-text3)' }}>
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button type="button" onClick={() => onDelete(p, i)} title="Eliminar pieza" className="w-6 h-6 rounded-[6px] flex items-center justify-center transition-colors hover:bg-[#ffffff1a]" style={{ color: 'var(--pp-text3)' }}>
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
// recibidas/en tienda después y las ya entregadas al final.
const ORDEN_ESTADO = { pendiente: 0, en_tienda: 1, recibida: 2, entregada: 3 };

// referencia: ref. por defecto para piezas que llegaron con el formato de Tag Logic.
export function PiezasList({ piezas, onEdit, onDelete, referencia }) {
  // Se guarda el índice original (posición real en order.piezas) junto con
  // cada pieza ANTES de ordenar para mostrar — es lo que se le pasa a
  // onEdit/onDelete, en vez de numeroPieza: dos piezas distintas podían
  // compartir el mismo número y entonces editar/eliminar "una" afectaba a
  // todas las que tuvieran ese número.
  const normalizadas = piezas.map((p, i) => ({ p: normalizarPieza(p, referencia), i }));

  // Cuántas piezas comparten el mismo número (ej. Tag Logic mandó el mismo
  // part# en dos líneas) — se marcan para que no se confundan entre sí, ya
  // que se ven idénticas en la lista pero cada una se edita por separado.
  const conteo = {};
  normalizadas.forEach(({ p }) => { if (p.numeroPieza) conteo[p.numeroPieza] = (conteo[p.numeroPieza] || 0) + 1; });
  const vistos = {};

  const ordenadas = normalizadas
    .map(({ p, i }) => {
      let dupInfo = null;
      if (p.numeroPieza && conteo[p.numeroPieza] > 1) {
        vistos[p.numeroPieza] = (vistos[p.numeroPieza] || 0) + 1;
        dupInfo = { n: vistos[p.numeroPieza], total: conteo[p.numeroPieza] };
      }
      return { p, i, dupInfo };
    })
    .sort((a, b) => (ORDEN_ESTADO[a.p.estado] ?? 99) - (ORDEN_ESTADO[b.p.estado] ?? 99));

  return (
    <div className="space-y-1.5">
      {ordenadas.map(({ p, i, dupInfo }) => <PiezaRow key={i} p={p} i={i} dupInfo={dupInfo} onEdit={onEdit} onDelete={onDelete} />)}
    </div>
  );
}
