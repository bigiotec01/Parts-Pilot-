import { useMemo, useState } from 'react';
import {
  Search, Printer, X, LayoutGrid, Columns3, List
} from 'lucide-react';
import { STATUS_CONFIG, STATUS_ORDER } from '../../constants/status';
import { OrderCard, OrderListHeader, OrderListRow } from '../shared/OrderCard';
import { EmptyState } from '../shared/FormField';
import { inputClass } from '../../constants/styles';

const toTime = (d) => {
  if (!d) return 0;
  const date = d?.toDate ? d.toDate() : new Date(d + 'T00:00:00');
  return isNaN(date) ? 0 : date.getTime();
};

const LIST_SORT_VALUE = {
  vehiculo: (p) => ((p.numeroPO || p.numeroOrden) ? p.vehiculo : (p.referencia || p.vehiculo) || '').toLowerCase(),
  taller: (p, getTaller) => (getTaller(p.tallerId)?.nombre || '').toLowerCase(),
  folio: (p) => (p.folio || p.id || '').toLowerCase(),
  fecha: (p) => toTime(p.fecha),
  estado: (p) => STATUS_ORDER.indexOf(p.estado),
};

// Columnas del tablero: mismo universo de estados que llega a esta pantalla
// (excluye 'cotizando', que vive en Estimados, y 'entregado', que vive en Historial).
const KANBAN_STATUSES = STATUS_ORDER.filter(s => s !== 'cotizando' && s !== 'entregado');

function KanbanBoard({ pedidos, getTaller, onSelect, onChangeStatus, hideEmpty }) {
  const statuses = hideEmpty ? KANBAN_STATUSES.filter(s => pedidos.some(p => p.estado === s)) : KANBAN_STATUSES;
  return (
    <div className="flex gap-3 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
      {statuses.map(status => {
        const cfg = STATUS_CONFIG[status];
        const items = pedidos.filter(p => p.estado === status);
        return (
          <div key={status} className="flex-shrink-0 w-[290px] flex flex-col rounded-[16px] border" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)', maxHeight: 'calc(100vh - 260px)' }}>
            <div className="flex items-center gap-2 px-3.5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--pp-border2)' }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
              <span className="text-[12.5px] font-bold flex-1 truncate" style={{ color: 'var(--pp-text)' }}>{cfg.short}</span>
              <span className="text-[11px] font-bold min-w-[20px] text-center px-2 py-0.5 rounded-full" style={items.length > 0 ? { background: cfg.dot, color: '#fff' } : { background: 'var(--pp-surface)', color: 'var(--pp-text3)' }}>{items.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 pp-scroll">
              {items.length === 0 ? (
                <p className="text-[12px] text-center py-6" style={{ color: 'var(--pp-text3)' }}>Sin pedidos</p>
              ) : items.map(p => (
                <OrderCard key={p.id} order={p} taller={getTaller(p.tallerId)} showTaller onClick={() => onSelect(p.id)} activityRole="admin" onChangeStatus={onChangeStatus} compact />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AdminPedidos({ pedidos, talleres, getTaller, filterTaller, setFilterTaller, filterEstado, setFilterEstado, search, setSearch, onSelect, onExport, onChangeStatus }) {
  const [view, setView] = useState('lista');
  const [hideEmpty, setHideEmpty] = useState(true);
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

  const pedidosOrdenados = useMemo(() => {
    const getValue = LIST_SORT_VALUE[sortBy];
    if (!getValue) return pedidos;
    const arr = [...pedidos];
    arr.sort((a, b) => {
      const va = getValue(a, getTaller), vb = getValue(b, getTaller);
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [pedidos, sortBy, sortDir, getTaller]);

  const chips = [
    filterTaller !== 'todos' && { key: 'taller', label: talleres.find(t => t.uid === filterTaller)?.nombre || filterTaller, clear: () => setFilterTaller('todos') },
    filterEstado !== 'todos' && { key: 'estado', label: STATUS_CONFIG[filterEstado]?.label || filterEstado, clear: () => setFilterEstado('todos') },
    search && { key: 'search', label: `"${search}"`, clear: () => setSearch('') },
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <div className="flex gap-1 p-1 rounded-[10px] flex-shrink-0" style={{ background: 'var(--pp-card)' }}>
          <button onClick={() => setView('lista')} title="Vista de lista" className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12.5px] font-bold transition-all"
            style={view === 'lista' ? { background: 'var(--pp-accent)', color: '#fff' } : { background: 'transparent', color: 'var(--pp-text3)' }}>
            <List className="w-3.5 h-3.5" /> Lista
          </button>
          <button onClick={() => setView('tarjetas')} title="Vista de tarjetas" className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12.5px] font-bold transition-all"
            style={view === 'tarjetas' ? { background: 'var(--pp-accent)', color: '#fff' } : { background: 'transparent', color: 'var(--pp-text3)' }}>
            <LayoutGrid className="w-3.5 h-3.5" /> Tarjetas
          </button>
          <button onClick={() => setView('tablero')} title="Vista de tablero (Kanban)" className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12.5px] font-bold transition-all"
            style={view === 'tablero' ? { background: 'var(--pp-accent)', color: '#fff' } : { background: 'transparent', color: 'var(--pp-text3)' }}>
            <Columns3 className="w-3.5 h-3.5" /> Tablero
          </button>
        </div>
        {view === 'tablero' && (
          <label className="flex items-center gap-1.5 px-1 flex-shrink-0 cursor-pointer select-none">
            <input type="checkbox" checked={hideEmpty} onChange={e => setHideEmpty(e.target.checked)} className="w-3.5 h-3.5" />
            <span className="text-[12px] font-semibold whitespace-nowrap" style={{ color: 'var(--pp-text2)' }}>Ocultar columnas vacías</span>
          </label>
        )}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--pp-text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por vehículo, referencia o folio..." className={`${inputClass} pl-9`} />
        </div>
        <div className="hidden sm:block w-px self-stretch flex-shrink-0" style={{ background: 'var(--pp-border3)' }} />
        <div className="flex gap-2 flex-shrink-0">
          <select value={filterTaller} onChange={e => setFilterTaller(e.target.value)} className={`${inputClass} sm:w-56`} style={{ background: 'var(--pp-surface)' }}>
            <option value="todos">Todos los talleres</option>
            {talleres.map(t => <option key={t.uid} value={t.uid}>{t.nombre}</option>)}
          </select>
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className={`${inputClass} sm:w-52`} style={{ background: 'var(--pp-surface)' }}>
            <option value="todos">Todos los estados</option>
            {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
          </select>
        </div>
        <button onClick={onExport} className="flex items-center justify-center gap-2 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex-shrink-0 hover:bg-[#8E1620]" style={{ background: 'var(--pp-accent)' }} title="Vista previa e impresión/PDF de los pedidos activos">
          <Printer className="w-4 h-4" /> Reporte
        </button>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11.5px] font-semibold" style={{ color: 'var(--pp-text3)' }}>Filtros activos:</span>
          {chips.map(c => (
            <button key={c.key} onClick={c.clear} className="flex items-center gap-1.5 text-[12px] font-semibold pl-2.5 pr-2 py-1 rounded-full border transition-colors hover:border-[#C6202B]" style={{ background: 'var(--pp-active-bg)', borderColor: 'var(--pp-active-border)', color: 'var(--pp-text)' }}>
              {c.label}<X className="w-3 h-3" />
            </button>
          ))}
          <button onClick={() => { setFilterTaller('todos'); setFilterEstado('todos'); setSearch(''); }} className="text-[12px] font-semibold hover:underline" style={{ color: 'var(--pp-text3)' }}>Limpiar todo</button>
        </div>
      )}

      {pedidos.length === 0 ? (
        <EmptyState text="No hay pedidos que coincidan con los filtros." />
      ) : view === 'tablero' ? (
        <KanbanBoard pedidos={pedidos} getTaller={getTaller} onSelect={onSelect} onChangeStatus={onChangeStatus} hideEmpty={hideEmpty} />
      ) : view === 'lista' ? (
        <div className="rounded-[15px] border overflow-hidden sm:grid sm:grid-cols-[1.9fr_1fr_0.85fr_1fr_auto_36px]" style={{ borderColor: 'var(--pp-border)', background: 'var(--pp-card)' }}>
          <OrderListHeader showTaller sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
          {pedidosOrdenados.map(p => <OrderListRow key={p.id} order={p} taller={getTaller(p.tallerId)} showTaller onClick={() => onSelect(p.id)} activityRole="admin" onChangeStatus={onChangeStatus} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pedidos.map(p => <OrderCard key={p.id} order={p} taller={getTaller(p.tallerId)} showTaller onClick={() => onSelect(p.id)} activityRole="admin" onChangeStatus={onChangeStatus} />)}
        </div>
      )}
    </div>
  );
}
