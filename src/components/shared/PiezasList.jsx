import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate, daysSince } from '../../utils/format';

function PiezaRow({ p }) {
  const dias = p.estado === 'pendiente' ? daysSince(p.primeraDeteccion) : null;
  return (
    <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[8px]" style={{ background: 'var(--pp-input-bg)' }}>
      <div className="min-w-0">
        <p className="text-[12.5px] font-mono font-semibold truncate" style={{ color: 'var(--pp-text)' }}>{p.numeroPieza}</p>
        {p.descripcion && <p className="text-[11px] truncate" style={{ color: 'var(--pp-text3)' }}>{p.descripcion}</p>}
      </div>
      <span className="flex items-center gap-1 text-[11.5px] font-semibold flex-shrink-0 whitespace-nowrap">
        {p.estado === 'recibida' && <span style={{ color: '#059669' }}>🟢 Recibida{p.fechaRecibida && <span className="font-normal" style={{ color: 'var(--pp-text3)' }}> · {formatDate(p.fechaRecibida)}</span>}</span>}
        {p.estado === 'en_tienda' && <span style={{ color: '#2563eb' }}>🔵 En tienda</span>}
        {p.estado === 'pendiente' && (
          <span style={{ color: '#d97706' }}>
            🟡 En espera{dias != null && dias > 0 ? <span className="font-normal"> · hace {dias} día{dias === 1 ? '' : 's'}</span> : ''}
          </span>
        )}
      </span>
    </div>
  );
}

// Separa las piezas en "Pendientes" (arriba, siempre visibles, con días en
// espera para priorizar reclamos a proveedor) y "Recibidas en tienda" (abajo,
// plegadas por defecto para no saturar la vista cuando ya no requieren acción).
export function PiezasList({ piezas }) {
  const [showRecibidas, setShowRecibidas] = useState(false);
  const pendientes = piezas.filter(p => p.estado === 'pendiente');
  const recibidas = piezas.filter(p => p.estado === 'recibida' || p.estado === 'en_tienda');

  return (
    <div className="space-y-2.5">
      {pendientes.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10.5px] font-bold" style={{ color: '#d97706' }}>🟡 Pendientes ({pendientes.length})</p>
          {pendientes.map(p => <PiezaRow key={p.numeroPieza} p={p} />)}
        </div>
      )}
      {recibidas.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowRecibidas(v => !v)} className="w-full flex items-center justify-between gap-2 py-1">
            <span className="text-[10.5px] font-bold" style={{ color: '#059669' }}>🟢 Recibidas en tienda ({recibidas.length})</span>
            {showRecibidas ? <ChevronUp className="w-3.5 h-3.5" style={{ color: 'var(--pp-text3)' }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--pp-text3)' }} />}
          </button>
          {showRecibidas && (
            <div className="space-y-1.5 mt-1.5">
              {recibidas.map(p => <PiezaRow key={p.numeroPieza} p={p} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
