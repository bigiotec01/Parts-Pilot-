import {
  Search, Printer, X
} from 'lucide-react';
import { STATUS_CONFIG, STATUS_ORDER } from '../../constants/status';
import { OrderCard } from '../shared/OrderCard';
import { EmptyState } from '../shared/FormField';
import { inputClass } from '../../constants/styles';

export function AdminPedidos({ pedidos, talleres, getTaller, filterTaller, setFilterTaller, filterEstado, setFilterEstado, search, setSearch, onSelect, onExport, onChangeStatus }) {
  const chips = [
    filterTaller !== 'todos' && { key: 'taller', label: talleres.find(t => t.uid === filterTaller)?.nombre || filterTaller, clear: () => setFilterTaller('todos') },
    filterEstado !== 'todos' && { key: 'estado', label: STATUS_CONFIG[filterEstado]?.label || filterEstado, clear: () => setFilterEstado('todos') },
    search && { key: 'search', label: `"${search}"`, clear: () => setSearch('') },
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--pp-text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por vehículo, referencia o folio..." className={`${inputClass} pl-9`} />
        </div>
        <select value={filterTaller} onChange={e => setFilterTaller(e.target.value)} className={`${inputClass} sm:w-56`}>
          <option value="todos">Todos los talleres</option>
          {talleres.map(t => <option key={t.uid} value={t.uid}>{t.nombre}</option>)}
        </select>
        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className={`${inputClass} sm:w-52`}>
          <option value="todos">Todos los estados</option>
          {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
        <button onClick={onExport} className="flex items-center justify-center gap-2 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex-shrink-0 hover:bg-[#707070]" style={{ background: 'var(--pp-accent)' }} title="Vista previa e impresión/PDF de los pedidos activos">
          <Printer className="w-4 h-4" /> Reporte
        </button>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11.5px] font-semibold" style={{ color: 'var(--pp-text3)' }}>Filtros activos:</span>
          {chips.map(c => (
            <button key={c.key} onClick={c.clear} className="flex items-center gap-1.5 text-[12px] font-semibold pl-2.5 pr-2 py-1 rounded-full border transition-colors hover:border-[#a0a0a0]" style={{ background: 'var(--pp-active-bg)', borderColor: 'var(--pp-active-border)', color: 'var(--pp-text)' }}>
              {c.label}<X className="w-3 h-3" />
            </button>
          ))}
          <button onClick={() => { setFilterTaller('todos'); setFilterEstado('todos'); setSearch(''); }} className="text-[12px] font-semibold hover:underline" style={{ color: 'var(--pp-text3)' }}>Limpiar todo</button>
        </div>
      )}

      {pedidos.length === 0 ? (
        <EmptyState text="No hay pedidos que coincidan con los filtros." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {pedidos.map(p => <OrderCard key={p.id} order={p} taller={getTaller(p.tallerId)} showTaller onClick={() => onSelect(p.id)} activityRole="admin" onChangeStatus={onChangeStatus} />)}
        </div>
      )}
    </div>
  );
}
