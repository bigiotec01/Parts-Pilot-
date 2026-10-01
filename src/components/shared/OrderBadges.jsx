import { Clock, Zap } from 'lucide-react';
import { antiguedad } from '../../utils/format';
import { contarPiezasEnTienda } from '../../utils/piezasExcel';

// "hace 2 días" con color según cuánto lleva esperando (verde / ámbar / rojo).
export function AgeBadge({ fecha }) {
  const a = antiguedad(fecha);
  if (!a) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold flex-shrink-0 whitespace-nowrap" style={{ background: a.bg, color: a.color }} title={`Esperando ${a.texto.replace('hace ', '')}`}>
      <Clock className="w-3 h-3" /> {a.texto}
    </span>
  );
}

// Marca los pedidos que entraron por la integración con Tag Logic.
export function TagLogicBadge({ order }) {
  if (order?.origen !== 'taglogic') return null;
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0 whitespace-nowrap" style={{ background: 'rgba(99,102,241,0.13)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)' }} title="Orden recibida desde Tag Logic">
      <Zap className="w-2.5 h-2.5" /> Tag Logic
    </span>
  );
}

// Barra "3 de 5 en tienda" — se pone verde cuando ya llegaron todas.
export function PiezasProgress({ piezas, className = '' }) {
  const total = piezas?.length || 0;
  if (!total) return null;
  const enTienda = contarPiezasEnTienda(piezas);
  const pct = Math.round((enTienda / total) * 100);
  const completo = enTienda === total;
  const color = completo ? '#10b981' : pct >= 50 ? '#3b82f6' : '#f59e0b';
  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`} title={`${enTienda} de ${total} piezas en tienda`}>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden min-w-[60px]" style={{ background: 'var(--pp-border2)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10.5px] font-bold whitespace-nowrap flex-shrink-0" style={{ color: completo ? '#059669' : 'var(--pp-text3)' }}>
        {enTienda}/{total} piezas
      </span>
    </div>
  );
}
