import {
  Clock, FileText, Building2, ChevronRight, ClipboardList
} from 'lucide-react';
import { hasNewActivity } from '../../utils/activity';
import { formatDate } from '../../utils/format';
import { StatusBadge } from '../shared/StatusBadge';
import { StatCard } from '../shared/StatCard';
import { DashboardChart } from '../shared/DashboardChart';

export function AdminDashboard({ pedidos, solicitudes, talleres, getTaller, onSelect, onGoToPedidos, onGoToEstimados, onGoToNuevo, onShowReporte }) {
  const total = pedidos.length;
  const enProceso = pedidos.filter(p => ['cotizando', 'pedido_fabrica', 'en_transito', 'recibido'].includes(p.estado)).length;
  const toMs = f => f?.toDate ? f.toDate().getTime() : new Date(f).getTime();
  const recientes = [...pedidos].sort((a, b) => toMs(b.fecha) - toMs(a.fecha)).slice(0, 6);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Solicitudes nuevas" value={solicitudes.length} icon={FileText} iconBg="rgba(200,200,200,0.1)" iconColor="#c0c0c0" chipLabel="Atención" chipBg="rgba(200,200,200,0.12)" chipColor="#c0c0c0" highlight />
        <StatCard label="En proceso" value={enProceso} icon={Clock} iconBg="rgba(160,160,160,0.1)" iconColor="#a0a0a0" chipLabel="hoy" chipBg="rgba(160,160,160,0.1)" chipColor="#a0a0a0" />
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
                  <div className="text-[11.5px] truncate" style={{ color: 'var(--pp-text2)' }}>{getTaller(p.tallerId)?.nombre} · {p.pieza || p.notas?.slice(0,30)}</div>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--pp-text3)' }} />
              </button>
            ))}
            {solicitudes.length === 0 && <p className="text-[13px] py-4 text-center" style={{ color: 'var(--pp-text3)' }}>Sin solicitudes pendientes</p>}
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
              {['Folio','Taller','Vehículo / Pieza','Estado','Fecha'].map((h, i) => (
                <th key={h} className={`text-left py-3 text-[10.5px] font-bold uppercase ${i === 0 ? 'px-6' : 'px-3'} ${i === 4 ? 'text-right pr-6' : ''} ${i >= 2 && i <= 2 ? 'hidden sm:table-cell' : ''}`} style={{ color: 'var(--pp-text3)', letterSpacing: '.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recientes.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-sm" style={{ color: 'var(--pp-text3)' }}>Sin pedidos aún.</td></tr>}
            {recientes.map(p => (
              <tr key={p.id} onClick={() => onSelect(p.id)} className="cursor-pointer transition-colors hover:bg-[#1e1e1e]" style={{ borderTop: '1px solid var(--pp-border2)', background: hasNewActivity('admin', p) ? 'rgba(200,200,200,0.05)' : undefined }}>

                <td className="py-3.5 px-6 font-mono text-[12.5px] font-semibold whitespace-nowrap" style={{ color: 'var(--pp-text)' }}>{p.folio || p.id.slice(0,8)}</td>
                <td className="py-3.5 px-3 text-[13px] max-w-[150px] truncate" style={{ color: 'var(--pp-text2)' }}>{getTaller(p.tallerId)?.nombre || '—'}</td>
                <td className="py-3.5 px-3 hidden sm:table-cell">
                  <div className="text-[13px] font-semibold" style={{ color: 'var(--pp-text)' }}>{p.vehiculo || '—'}</div>
                  {p.pieza && <div className="text-[11.5px]" style={{ color: 'var(--pp-text2)' }}>{p.pieza}</div>}
                </td>
                <td className="py-3.5 px-3"><StatusBadge estado={p.estado} /></td>
                <td className="py-3.5 pr-6 text-right text-[12.5px] whitespace-nowrap" style={{ color: 'var(--pp-text2)' }}>{formatDate(p.fecha)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
