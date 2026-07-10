import { useState } from 'react';
import {
  ChevronRight, Printer
} from 'lucide-react';
import { EmptyState } from '../shared/FormField';
import { fmtCur, fmtDateDisp } from '../../utils/format';

export function ClientFacturas({ facturas, taller }) {
  const marcasDisponibles = [...new Set(facturas.map(f => f.marca))].sort();
  const [marca, setMarca] = useState(marcasDisponibles[0] || 'KIA');
  const [verHistorial, setVerHistorial] = useState(false);

  const todasMarca = [...facturas]
    .filter(f => f.marca === marca)
    .sort((a, b) => (a.fechaFactura || '').localeCompare(b.fechaFactura || ''));

  const facturasMarca = todasMarca.filter(f => !f.archivada);
  const facturasArch  = todasMarca.filter(f => f.archivada);

  const numeroCuenta = taller?.numeroCuentas?.[marca] || '';

  const totals = facturasMarca.reduce(
    (acc, f) => ({ valor: acc.valor + Number(f.valor || 0), pagado: acc.pagado + Number(f.pagado || 0), pendiente: acc.pendiente + Number(f.pendiente || 0) }),
    { valor: 0, pagado: 0, pendiente: 0 }
  );

  const handlePrint = () => {
    const rows = facturasMarca.map(f => `
      <tr style="background:${Number(f.pendiente) > 0 ? '#fffbf5' : '#fff'}">
        <td>${fmtDateDisp(f.fechaFactura)}</td>
        <td>${f.numeroFactura}</td>
        <td>${f.poTag || ''}</td>
        <td style="text-align:right">$${Number(f.valor || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td style="text-align:right;color:${Number(f.pagado) > 0 ? '#059669' : '#aab0b9'};font-weight:600">${Number(f.pagado) > 0 ? '$' + Number(f.pagado).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}</td>
        <td style="text-align:right;color:${Number(f.pendiente) > 0 ? '#b7791f' : '#059669'};font-weight:600">$${Number(f.pendiente || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td>${f.numeroCheck || ''}</td>
        <td>${fmtDateDisp(f.fechaPago)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="es"><head>
      <meta charset="utf-8">
      <title>Lista de Facturas ${marca} · ${taller.nombre || ''}</title>
      <style>
        *{box-sizing:border-box} body{font-family:Arial,sans-serif;font-size:11px;margin:0;padding:28px;color:#1c1917}
        h1{font-size:22px;font-weight:bold;text-align:center;margin:0 0 4px;text-transform:uppercase;letter-spacing:.04em}
        .sub{text-align:center;font-size:12px;color:#57534e;margin-bottom:22px}
        table{width:100%;border-collapse:collapse;font-size:10.5px}
        thead th{background:#1c1917;color:#fff;text-align:left;padding:7px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
        thead th:nth-child(n+4):nth-child(-n+6){text-align:right}
        td{padding:6px 10px;border-bottom:1px solid #e7e5e4;vertical-align:top}
        td:nth-child(n+4):nth-child(-n+6){text-align:right}
        tfoot td{font-weight:bold;border-top:2px solid #1c1917;padding-top:8px;background:#fafaf9}
        @media print{@page{size:landscape;margin:1.2cm}body{padding:0}}
      </style>
    </head><body>
      <h1>Lista de Facturas ${marca}</h1>
      <div class="sub">${taller.nombre || ''}&nbsp;&nbsp;|&nbsp;&nbsp;# de Cuenta: ${numeroCuenta}</div>
      <table>
        <thead><tr>
          <th>Fecha Factura</th><th># Factura</th><th>PO Tag</th>
          <th>Valor Factura</th><th>Pagado</th><th>Pendiente de Pago</th>
          <th># Check</th><th>Fecha de Pago</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr>
          <td colspan="3">TOTAL</td>
          <td style="text-align:right">$${totals.valor.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td style="text-align:right;color:#059669">$${totals.pagado.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td style="text-align:right;color:${totals.pendiente > 0 ? '#b7791f' : '#059669'}">$${totals.pendiente.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td colspan="2"></td>
        </tr></tfoot>
      </table>
    </body></html>`;

    const w = window.open('', '_blank', 'width=1100,height=750');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  if (facturas.length === 0) return <EmptyState text="No tienes facturas asignadas aún." />;

  // Stats financieras para las tarjetas superiores
  const statsAll = facturas.filter(f => !f.archivada);
  const statsTotals = statsAll.reduce(
    (a, f) => ({ valor: a.valor + Number(f.valor||0), pagado: a.pagado + Number(f.pagado||0), pendiente: a.pendiente + Number(f.pendiente||0) }),
    { valor: 0, pagado: 0, pendiente: 0 }
  );

  const thSt = { color: 'var(--pp-text9)', letterSpacing: '.06em' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 p-1 rounded-[10px]" style={{ background: 'var(--pp-card)' }}>
          {marcasDisponibles.map(m => (
            <button key={m} onClick={() => setMarca(m)} className="px-4 py-1.5 rounded-[8px] text-[13px] font-bold transition-all"
              style={{ background: marca === m ? 'var(--pp-surface)' : 'transparent', color: marca === m ? 'var(--pp-text)' : 'var(--pp-text3)', boxShadow: marca === m ? '0 1px 4px rgba(0,0,0,.2)' : 'none' }}>
              {m}
            </button>
          ))}
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold border transition-colors hover:bg-[#1e1e1e]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
          <Printer className="w-4 h-4" /> Imprimir / PDF
        </button>
      </div>

      {numeroCuenta && (
        <p className="text-[12.5px]" style={{ color: 'var(--pp-text2)' }}>
          # de cuenta: <span className="font-mono font-semibold" style={{ color: 'var(--pp-text)' }}>{numeroCuenta}</span>
        </p>
      )}

      <div className="rounded-[16px] border overflow-x-auto" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
        <table className="w-full" style={{ minWidth: 800 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--pp-border2)' }}>
              {['Fecha', '# Factura', 'PO Tag', 'Valor', 'Pagado', 'Pendiente', '# Check', 'F. Pago'].map((h, i) => (
                <th key={i} className={`text-left py-3 text-[10.5px] font-bold uppercase ${i === 0 ? 'pl-5 pr-3' : 'px-3'} ${i === 7 ? 'pr-5' : ''}`} style={thSt}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {facturasMarca.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-[13px]" style={{ color: 'var(--pp-text3)' }}>Sin facturas para {marca}.</td></tr>}
            {facturasMarca.map(f => {
              const isPending = Number(f.pendiente) > 0;
              return (
                <tr key={f.id} style={{ borderTop: '1px solid var(--pp-border2)', background: isPending ? 'rgba(183,121,31,0.05)' : 'var(--pp-card)' }}>
                  <td className="py-3.5 pl-5 pr-3 text-[12.5px] whitespace-nowrap" style={{ color: 'var(--pp-text2)' }}>{fmtDateDisp(f.fechaFactura)}</td>
                  <td className="py-3.5 px-3 font-mono text-[12.5px] font-semibold" style={{ color: 'var(--pp-text)' }}>{f.numeroFactura}</td>
                  <td className="py-3.5 px-3 font-mono text-[12.5px]" style={{ color: 'var(--pp-text2)' }}>{f.poTag || '—'}</td>
                  <td className="py-3.5 px-3 text-[12.5px] font-semibold" style={{ color: 'var(--pp-text)' }}>{fmtCur(f.valor)}</td>
                  <td className="py-3.5 px-3 text-[12.5px] font-semibold" style={{ color: Number(f.pagado) > 0 ? '#059669' : 'var(--pp-text3)' }}>{Number(f.pagado) > 0 ? fmtCur(f.pagado) : '—'}</td>
                  <td className="py-3.5 px-3 text-[12.5px] font-semibold" style={{ color: isPending ? '#b7791f' : '#059669' }}>{fmtCur(f.pendiente)}</td>
                  <td className="py-3.5 px-3 font-mono text-[12.5px]" style={{ color: 'var(--pp-text2)' }}>{f.numeroCheck || '—'}</td>
                  <td className="py-3.5 pl-3 pr-5 text-[12.5px] whitespace-nowrap" style={{ color: 'var(--pp-text2)' }}>{fmtDateDisp(f.fechaPago)}</td>
                </tr>
              );
            })}
          </tbody>
          {facturasMarca.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--pp-border2)', background: 'var(--pp-card)' }}>
                <td colSpan={3} className="py-3.5 pl-5 text-[12.5px] font-bold" style={{ color: 'var(--pp-text)' }}>TOTAL</td>
                <td className="py-3.5 px-3 text-[12.5px] font-bold" style={{ color: 'var(--pp-text)' }}>{fmtCur(totals.valor)}</td>
                <td className="py-3.5 px-3 text-[12.5px] font-bold" style={{ color: '#059669' }}>{fmtCur(totals.pagado)}</td>
                <td className="py-3.5 px-3 text-[12.5px] font-bold" style={{ color: totals.pendiente > 0 ? '#b7791f' : '#059669' }}>{fmtCur(totals.pendiente)}</td>
                <td colSpan={2} className="pr-5" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Historial de pagadas archivadas */}
      {facturasArch.length > 0 && (
        <div>
          <button onClick={() => setVerHistorial(v => !v)} className="flex items-center gap-2 text-[12.5px] font-semibold transition-colors hover:text-[#a0a0a0]" style={{ color: 'var(--pp-text3)' }}>
            <ChevronRight className={`w-4 h-4 transition-transform ${verHistorial ? 'rotate-90' : ''}`} />
            Historial de pagadas ({facturasArch.length})
          </button>
          {verHistorial && (
            <div className="mt-3 rounded-[16px] border overflow-x-auto" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)', opacity: 0.85 }}>
              <table className="w-full" style={{ minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--pp-border2)' }}>
                    {['Fecha','# Factura','PO Tag','Valor','Pagado','# Check','F. Pago',''].map((h, i) => (
                      <th key={i} className={`text-left py-2.5 text-[10.5px] font-bold uppercase ${i===0?'pl-5 pr-3':'px-3'}`} style={thSt}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {facturasArch.map(f => (
                    <tr key={f.id} style={{ borderTop: '1px solid var(--pp-border2)' }}>
                      <td className="py-3 pl-5 pr-3 text-[12px] whitespace-nowrap" style={{ color: 'var(--pp-text3)' }}>{fmtDateDisp(f.fechaFactura)}</td>
                      <td className="py-3 px-3 font-mono text-[12px]" style={{ color: 'var(--pp-text3)' }}>{f.numeroFactura}</td>
                      <td className="py-3 px-3 font-mono text-[12px]" style={{ color: 'var(--pp-text3)' }}>{f.poTag||'—'}</td>
                      <td className="py-3 px-3 text-[12px]" style={{ color: 'var(--pp-text3)' }}>{fmtCur(f.valor)}</td>
                      <td className="py-3 px-3 text-[12px] font-semibold" style={{ color: '#059669' }}>{fmtCur(f.pagado)}</td>
                      <td className="py-3 px-3 font-mono text-[12px]" style={{ color: 'var(--pp-text10)' }}>{f.numeroCheck||'—'}</td>
                      <td className="py-3 px-3 text-[12px] whitespace-nowrap" style={{ color: 'var(--pp-text10)' }}>{fmtDateDisp(f.fechaPago)}</td>
                      <td className="py-3 pr-4" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ADMIN EQUIPO                                                        */
/* ------------------------------------------------------------------ */
