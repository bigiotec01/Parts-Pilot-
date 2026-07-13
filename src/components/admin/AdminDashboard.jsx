import { useState, useMemo } from 'react';
import {
  Clock, FileText, Building2, ChevronRight, ClipboardList, CheckCircle2, ChevronUp, ChevronDown, ChevronsUpDown, Eye, ArrowRightCircle
} from 'lucide-react';
import { hasNewActivity } from '../../utils/activity';
import { formatDate, cleanText } from '../../utils/format';
import { StatusBadge } from '../shared/StatusBadge';
import { StatCard } from '../shared/StatCard';
import { DashboardChart } from '../shared/DashboardChart';
import { QuickActionsMenu } from '../shared/QuickActionsMenu';
import { STATUS_ORDER, STATUS_CONFIG, getNextStatus } from '../../constants/status';

const COLUMNS = [
  { key: 'folio',  label: 'Folio' },
  { key: 'taller', label: 'Taller' },
  { key: 'vehiculo', label: 'Vehículo / Pieza', sortable: false, hideSm: true },
  { key: 'estado', label: 'Estado' },
  { key: 'fecha',  label: 'Fecha', align: 'right' },
];

export function AdminDashboard({ pedidos, solicitudes, talleres, getTaller, onSelect, onGoToPedidos, onGoToEstimados, onGoToNuevo, onShowReporte, onChangeStatus }) {
  const [sort, setSort] = useState({ key: 'fecha', dir: 'desc' });

  const total = pedidos.length;
  const enProceso = pedidos.filter(p => ['cotizando', 'pedido_fabrica', 'en_transito', 'recibido'].includes(p.estado));
  const enProcesoConActividad = enProceso.filter(p => hasNewActivity('admin', p)).length;
  const toMs = f => f?.toDate ? f.toDate().getTime() : new Date(f).getTime();

  const recientes = useMemo(() => {
    const base = [...pedidos].sort((a, b) => toMs(b.fecha) - toMs(a.fecha)).slice(0, 6);
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...base].sort((a, b) => {
      switch (sort.key) {
        case 'folio':  return dir * (a.folio || a.id).localeCompare(b.folio || b.id);
        case 'taller': return dir * (getTaller(a.tallerId)?.nombre || '').localeCompare(getTaller(b.tallerId)?.nombre || '');
        case 'estado': return dir * (STATUS_ORDER.indexOf(a.estado) - STATUS_ORDER.indexOf(b.estado));
        case 'fecha':
        default:       return dir * (toMs(a.fecha) - toMs(b.fecha));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidos, sort]);

  const toggleSort = (key) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Solicitudes nuevas" value={solicitudes.length} icon={FileText} iconBg="rgba(200,200,200,0.1)" iconColor="#c0c0c0" chipLabel="Atención" chipBg="rgba(200,200,200,0.12)" chipColor="#c0c0c0" highlight
          hint={solicitudes.length === 0 ? 'Todo al día' : `${solicitudes.length} esperando estimado`} hintTone={solicitudes.length === 0 ? 'ok' : 'warn'} />
        <StatCard label="En proceso" value={enProceso.length} icon={Clock} iconBg="rgba(160,160,160,0.1)" iconColor="#a0a0a0" chipLabel="hoy" chipBg="rgba(160,160,160,0.1)" chipColor="#a0a0a0"
          hint={enProcesoConActividad === 0 ? 'Sin pendientes' : `${enProcesoConActividad} con actividad nueva`} hintTone={enProcesoConActividad === 0 ? 'ok' : 'warn'} />
        <StatCard label="Total pedidos" value={total} icon={ClipboardList} iconBg="rgba(120,120,120,0.1)" iconColor="#888888" chipLabel="Año" chipBg="rgba(120,120,120,0.1)" chipColor="#888888" />
        <StatCard label="Talleres activos" value={talleres.length} icon={Building2} iconBg="rgba(160,160,160,0.1)" iconColor="#a0a0a0" chipLabel="Todos" chipBg="rgba(160,160,160,0.1)" chipColor="#a0a0a0" />
      </div>

      {/* Chart + atención */}
      <div className="grid xl:grid-cols-[1.7fr_1fr] gap-4">
        <div className="rounded-[16px] p-6 border" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: 'var(--pp-text)' }}>Volumen de pedidos</h2>
              <p className="text-[12.5px]" style={{ color: 'var(--pp-text2)' }}>Últimos 6 meses</p>
            </div>
          </div>
          <DashboardChart pedidos={[...pedidos, ...solicitudes]} />
        </div>

        <div className="rounded-[16px] p-6 border flex flex-col" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[15px] font-bold" style={{ color: 'var(--pp-text)' }}>Requiere atención</h2>
            {solicitudes.length > 0 && <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-[7px]" style={{ background: 'var(--pp-active-bg)', color: 'var(--pp-text8)' }}>{solicitudes.length}</span>}
          </div>
          <p className="text-[12.5px] mb-3" style={{ color: 'var(--pp-text2)' }}>Solicitudes esperando estimado</p>
          <div className="flex flex-col gap-2.5 flex-1">
            {solicitudes.slice(0, 3).map(p => (
              <button key={p.id} onClick={() => onSelect(p.id)} className="w-full text-left rounded-[12px] p-3 flex gap-2.5 items-center border transition-colors hover:border-[#a0a0a0]" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{ background: 'var(--pp-accent)' }} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold truncate" style={{ color: 'var(--pp-text)' }}>{p.vehiculo}</div>
                  <div className="text-[11.5px] truncate" style={{ color: 'var(--pp-text2)' }}>{getTaller(p.tallerId)?.nombre} · {p.pieza || cleanText(p.notas)?.slice(0,30)}</div>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--pp-text3)' }} />
              </button>
            ))}
            {solicitudes.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-6 flex-1 text-center">
                <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(20,184,166,0.12)' }}>
                  <CheckCircle2 className="w-6 h-6" style={{ color: '#14b8a6' }} />
                </div>
                <p className="text-[13px] font-bold" style={{ color: 'var(--pp-text)' }}>¡Buen trabajo!</p>
                <p className="text-[12px]" style={{ color: 'var(--pp-text3)' }}>Estás al día, no hay solicitudes pendientes.</p>
              </div>
            )}
          </div>
          <button onClick={onGoToEstimados} className="mt-3 w-full py-[9px] rounded-[10px] text-[12.5px] font-semibold border transition-colors hover:bg-[#1e1e1e]" style={{ borderColor: 'var(--pp-border)', color: 'var(--pp-text2)' }}>Ver todos los estimados</button>
        </div>
      </div>

      {/* Tabla recientes */}
      <div className="rounded-[16px] overflow-hidden border" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
        <div className="flex items-center justify-between px-6 py-[18px]">
          <h2 className="text-[15px] font-bold" style={{ color: 'var(--pp-text)' }}>Pedidos recientes</h2>
          <button onClick={onGoToPedidos} className="flex items-center gap-1 text-[13px] font-bold transition-colors hover:opacity-70" style={{ color: 'var(--pp-text8)' }}>Ver todos <ChevronRight className="w-4 h-4" /></button>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderTop: '1px solid var(--pp-border2)' }}>
              {COLUMNS.map((c, i) => {
                const sortable = c.sortable !== false;
                const active = sort.key === c.key;
                const Icon = active ? (sort.dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
                return (
                  <th key={c.key} className={`text-left py-3 text-[10.5px] font-bold uppercase ${i === 0 ? 'px-6' : 'px-3'} ${c.align === 'right' ? 'text-right pr-6' : ''} ${c.hideSm ? 'hidden sm:table-cell' : ''}`} style={{ color: active ? 'var(--pp-text)' : 'var(--pp-text6)', letterSpacing: '.06em' }}>
                    {sortable ? (
                      <button onClick={() => toggleSort(c.key)} className={`inline-flex items-center gap-1 hover:text-[var(--pp-text)] transition-colors ${c.align === 'right' ? 'flex-row-reverse' : ''}`}>
                        {c.label}<Icon className="w-3 h-3" />
                      </button>
                    ) : c.label}
                  </th>
                );
              })}
              <th className="py-3 px-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {recientes.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-sm" style={{ color: 'var(--pp-text3)' }}>Sin pedidos aún.</td></tr>}
            {recientes.map(p => {
              const nueva = hasNewActivity('admin', p);
              const next = getNextStatus(p.estado);
              return (
                <tr key={p.id} onClick={() => onSelect(p.id)} className="cursor-pointer transition-colors hover:bg-[#1e1e1e]" style={{ borderTop: '1px solid var(--pp-border2)', background: nueva ? 'rgba(245,158,11,0.05)' : undefined }}>
                  <td className="py-3.5 px-6 font-mono text-[12.5px] font-semibold whitespace-nowrap" style={{ color: 'var(--pp-text)' }}>
                    <span className="inline-flex items-center gap-2">
                      {nueva && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#f59e0b', boxShadow: '0 0 0 3px rgba(245,158,11,0.22)' }} title="Actividad nueva" />}
                      {p.folio || p.id.slice(0,8)}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-[13px] max-w-[150px] truncate" style={{ color: 'var(--pp-text2)' }}>{getTaller(p.tallerId)?.nombre || '—'}</td>
                  <td className="py-3.5 px-3 hidden sm:table-cell">
                    <div className="text-[13px] font-semibold" style={{ color: 'var(--pp-text)' }}>{p.vehiculo || '—'}</div>
                    {p.pieza && <div className="text-[11.5px]" style={{ color: 'var(--pp-text2)' }}>{p.pieza}</div>}
                  </td>
                  <td className="py-3.5 px-3"><StatusBadge estado={p.estado} /></td>
                  <td className="py-3.5 pr-6 text-right text-[12.5px] whitespace-nowrap" style={{ color: 'var(--pp-text2)' }}>{formatDate(p.fecha)}</td>
                  <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <QuickActionsMenu size="sm" items={[
                      { label: 'Ver detalles', icon: Eye, onClick: () => onSelect(p.id) },
                      next && onChangeStatus && { label: `Avanzar a: ${STATUS_CONFIG[next].short}`, icon: ArrowRightCircle, onClick: () => onChangeStatus(p.id, next, p.fechaEntrega || '') },
                    ]} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
