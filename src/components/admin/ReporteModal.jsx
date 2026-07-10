import {
  Printer
} from 'lucide-react';
import { STATUS_CONFIG } from '../../constants/status';
import { formatDate } from '../../utils/format';
import { StatusBadge } from '../shared/StatusBadge';
import { Modal } from '../shared/Modal';

export function ReporteModal({ pedidos, talleres, onClose }) {
  const ACTIVOS = ['pendiente', 'cotizando', 'pedido_fabrica', 'en_transito', 'recibido'];
  const activos = [...pedidos]
    .filter(p => ACTIVOS.includes(p.estado))
    .sort((a, b) => {
      const t = f => f?.toDate ? f.toDate().getTime() : new Date(f + 'T00:00:00').getTime();
      return t(a.fecha) - t(b.fecha);
    });
  const getTaller = id => talleres.find(t => t.uid === id);

  const handlePrint = () => {
    const toStr = f => {
      if (!f) return '—';
      const d = f?.toDate ? f.toDate() : new Date(f + 'T00:00:00');
      return isNaN(d) ? '—' : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    };
    const rows = activos.map((p, i) => `
      <tr style="background:${i % 2 === 0 ? '#ffffff' : '#fafaf9'}">
        <td>${i + 1}</td>
        <td style="font-family:monospace;font-size:10px;color:#78716c">${p.id.slice(0, 12)}</td>
        <td><strong>${(p.referencia || '—').replace(/</g, '&lt;')}</strong></td>
        <td>${(getTaller(p.tallerId)?.nombre || '—').replace(/</g, '&lt;')}</td>
        <td>${(p.vehiculo || '—').replace(/</g, '&lt;')}</td>
        <td>${STATUS_CONFIG[p.estado]?.label || p.estado}</td>
        <td>${toStr(p.fecha)}</td>
        <td style="color:#1d4ed8;font-weight:600">${toStr(p.fechaEntrega)}</td>
        <td style="color:#57534e;font-size:10px">${(p.notas || '').replace(/</g, '&lt;')}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="es"><head>
      <meta charset="utf-8">
      <title>Parts Pilot — Reporte ${new Date().toLocaleDateString('es-MX')}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;font-size:11px;margin:0;padding:24px;color:#1c1917}
        header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px;padding-bottom:12px;border-bottom:2px solid #1c1917}
        h1{font-size:20px;font-weight:bold;margin:0}
        .sub{color:#78716c;font-size:11px;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;font-size:10.5px}
        thead th{background:#1c1917;color:#fff;text-align:left;padding:7px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
        td{padding:6px 10px;border-bottom:1px solid #e7e5e4;vertical-align:top}
        tfoot td{font-weight:bold;border-top:2px solid #1c1917;padding-top:8px;background:#fafaf9}
        @media print{@page{size:landscape;margin:1.2cm}body{padding:0}}
      </style>
    </head><body>
      <header>
        <div><h1>Parts Pilot</h1><div style="color:#78716c;font-size:11px">Reporte de Pedidos en Proceso</div></div>
        <div style="color:#78716c;font-size:11px;text-align:right">${new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </header>
      <p class="sub">${activos.length} pedidos activos (excluye Orden Completa)</p>
      <table>
        <thead><tr><th>#</th><th>Folio</th><th>Referencia / Orden</th><th>Taller</th><th>Vehículo</th><th>Estado</th><th>Fecha Reg.</th><th>Entrega Est.</th><th>Notas</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="9">Total: ${activos.length} pedidos activos</td></tr></tfoot>
      </table>
    </body></html>`;

    const w = window.open('', '_blank', 'width=1100,height=750');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  return (
    <Modal title="Reporte · Pedidos en Proceso" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: 'var(--pp-text2)' }}>
            <span className="font-semibold" style={{ color: 'var(--pp-text)' }}>{activos.length}</span> pedidos activos — excluye Orden Completa
          </p>
          <button onClick={handlePrint} className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors hover:bg-[#707070]" style={{ background: 'var(--pp-accent)' }}>
            <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--pp-border)' }}>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider" style={{ background: 'var(--pp-surface)', color: 'var(--pp-text)' }}>
                <th className="text-left px-3 py-2.5 font-medium">#</th>
                <th className="text-left px-3 py-2.5 font-medium">Referencia</th>
                <th className="text-left px-3 py-2.5 font-medium">Taller</th>
                <th className="text-left px-3 py-2.5 font-medium">Vehículo</th>
                <th className="text-left px-3 py-2.5 font-medium">Estado</th>
                <th className="text-left px-3 py-2.5 font-medium whitespace-nowrap">Fecha Reg.</th>
                <th className="text-left px-3 py-2.5 font-medium whitespace-nowrap">Entrega Est.</th>
                <th className="text-left px-3 py-2.5 font-medium">Notas</th>
              </tr>
            </thead>
            <tbody>
              {activos.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--pp-border2)', background: i % 2 === 0 ? 'var(--pp-card)' : 'var(--pp-card)' }}>
                  <td className="px-3 py-2" style={{ color: 'var(--pp-text3)' }}>{i + 1}</td>
                  <td className="px-3 py-2 font-semibold" style={{ color: 'var(--pp-text)' }}>{p.referencia || <span style={{ color: 'var(--pp-text3)', fontWeight: 400 }}>—</span>}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--pp-text2)' }}>{getTaller(p.tallerId)?.nombre || '—'}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--pp-text2)' }}>{p.vehiculo || '—'}</td>
                  <td className="px-3 py-2"><StatusBadge estado={p.estado} /></td>
                  <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--pp-text2)' }}>{formatDate(p.fecha)}</td>
                  <td className="px-3 py-2 font-semibold whitespace-nowrap">
                    {p.fechaEntrega ? <span className="text-blue-400">{formatDate(p.fechaEntrega)}</span> : <span style={{ color: 'var(--pp-text3)' }}>—</span>}
                  </td>
                  <td className="px-3 py-2 max-w-[140px] truncate" style={{ color: 'var(--pp-text2)' }}>{p.notas || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {activos.length === 0 && <div className="py-10 text-center text-sm" style={{ color: 'var(--pp-text3)' }}>No hay pedidos activos en este momento.</div>}
        </div>
      </div>
    </Modal>
  );
}
