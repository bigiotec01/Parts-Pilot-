import { List, LayoutGrid } from 'lucide-react';
import { SEG_ACTIVE, SEG_IDLE } from '../../constants/styles';

export function ViewToggle({ view, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-[10px] w-fit flex-shrink-0" style={{ background: 'var(--pp-card)', border: '1px solid var(--pp-border)' }}>
      <button onClick={() => onChange('lista')} title="Vista de lista" className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12.5px] font-bold transition-all"
        style={view === 'lista' ? SEG_ACTIVE : SEG_IDLE}>
        <List className="w-3.5 h-3.5" /> Lista
      </button>
      <button onClick={() => onChange('tarjetas')} title="Vista de tarjetas" className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12.5px] font-bold transition-all"
        style={view === 'tarjetas' ? SEG_ACTIVE : SEG_IDLE}>
        <LayoutGrid className="w-3.5 h-3.5" /> Tarjetas
      </button>
    </div>
  );
}
