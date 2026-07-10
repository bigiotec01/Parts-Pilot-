import {
  FileText, Calendar, Printer
} from 'lucide-react';
import { STATUS_CONFIG } from '../../constants/status';
import { formatDate } from '../../utils/format';
import { StatusStepper } from '../shared/StatusBadge';
import { InfoItem } from '../shared/FormField';
import { EstimateActions } from './ClientEstimados';
import { ClientProgressBar } from './ClientHistorial';

export function ClientOrderDetail({ order, onRespond }) {
  const handlePrint = () => {
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pedido ${order.folio || order.id.slice(0,8)}</title>
    <style>body{font-family:sans-serif;padding:32px;color:#1c1917}h1{font-size:18px;margin-bottom:4px}p{margin:4px 0;font-size:14px;color:#57534e}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px}th{text-align:left;padding:8px 10px;background:#f5f5f4;font-weight:600}td{padding:8px 10px;border-bottom:1px solid #e7e5e4}.badge{display:inline-block;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:600;background:#f0fdf4;color:#15803d}</style>
    </head><body>
    <h1>${order.referencia || order.vehiculo}</h1>
    <p>${order.referencia ? order.vehiculo : ''}</p>
    <table><tr><th>Folio</th><td>${order.folio || order.id.slice(0,8)}</td></tr>
    <tr><th>Vehículo</th><td>${order.vehiculo || '—'}</td></tr>
    <tr><th>Estado</th><td>${STATUS_CONFIG[order.estado]?.label || order.estado}</td></tr>
    <tr><th>Fecha registro</th><td>${order.fecha ? new Date(order.fecha?.toDate ? order.fecha.toDate() : order.fecha).toLocaleDateString('es-MX') : '—'}</td></tr>
    ${order.fechaEntrega ? `<tr><th>Entrega estimada</th><td>${new Date(order.fechaEntrega + 'T00:00:00').toLocaleDateString('es-MX')}</td></tr>` : ''}
    ${order.notas ? `<tr><th>Notas</th><td>${order.notas}</td></tr>` : ''}
    ${order.estimado?.notas ? `<tr><th>Estimado</th><td>${order.estimado.notas}</td></tr>` : ''}
    </table></body></html>`);
    w.document.close(); w.print();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-lg" style={{ color: 'var(--pp-text)' }}>{order.referencia || order.vehiculo}</h3>
          {order.referencia && <p className="text-sm" style={{ color: 'var(--pp-text2)' }}>{order.vehiculo}</p>}
        </div>
        <button onClick={handlePrint} className="flex items-center gap-1.5 text-xs border rounded-lg px-2.5 py-1.5 transition-colors flex-shrink-0 hover:border-[#a0a0a0]" style={{ color: 'var(--pp-text2)', borderColor: 'var(--pp-border)', background: 'var(--pp-card)' }}>
          <Printer className="w-3.5 h-3.5" /> Imprimir
        </button>
      </div>

      <ClientProgressBar estado={order.estado} />

      <div className="grid grid-cols-2 gap-2 text-sm">
        <InfoItem label="Fecha" value={formatDate(order.fecha)} />
        <InfoItem label="Folio" value={order.folio || order.id.slice(0, 8)} />
        {order.fechaEntrega && <InfoItem label="Entrega est." value={formatDate(order.fechaEntrega)} />}
      </div>

      {order.fechaEntrega && ['pedido_fabrica','en_transito','recibido'].includes(order.estado) && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-blue-600 font-medium">Fecha estimada de entrega</p>
            <p className="font-bold text-blue-900">{formatDate(order.fechaEntrega)}</p>
          </div>
        </div>
      )}

      {order.notas && (
        <div className="rounded-lg p-3 text-sm" style={{ background: 'var(--pp-card)', color: 'var(--pp-text2)' }}>
          <p className="font-medium mb-1" style={{ color: 'var(--pp-text)' }}>Tus notas</p>
          {order.notas}
        </div>
      )}

      <div>
        <p className="font-medium text-sm mb-3" style={{ color: 'var(--pp-text)' }}>Estatus del pedido</p>
        <StatusStepper estado={order.estado} />
      </div>

      {order.estimado && (
        <div className="pt-4 border-t border-dashed" style={{ borderColor: 'var(--pp-border)' }}>
          <p className="font-medium text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--pp-text)' }}><FileText className="w-4 h-4" /> Estimado recibido</p>
          <div className="rounded-lg p-3 mb-3 space-y-2" style={{ background: 'var(--pp-card)' }}>
            {order.estimado.notas ? (
              <p className="text-sm" style={{ color: 'var(--pp-text2)' }}>{order.estimado.notas}</p>
            ) : (
              <p className="text-sm italic" style={{ color: 'var(--pp-text3)' }}>Sin notas adicionales.</p>
            )}
            {order.estimado.archivo && (
              <a href={order.estimado.archivo.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors border hover:border-[#a0a0a0]" style={{ background: 'var(--pp-input-bg)', borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
                <FileText className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{order.estimado.archivo.name}</span>
              </a>
            )}
          </div>
          <EstimateActions order={order} onRespond={onRespond} />
        </div>
      )}
    </div>
  );
}
