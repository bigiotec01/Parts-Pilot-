import { useState, useRef } from 'react';
import {
  CheckCircle2, Plus, X, ChevronRight, Archive, RotateCcw, Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Modal } from '../shared/Modal';
import { inputClass } from '../../constants/styles';
import { MARCAS_FACTURA } from '../../constants/facturas';
import { fmtCur, fmtDateDisp, formatDate } from '../../utils/format';

export function FacturaInlineRow({ form, setForm, onSave, onCancel, saving }) {
  const inp = "px-2 py-1 rounded-[8px] border text-[16px] outline-none focus:border-[#a0a0a0]";
  // Si aún no hay monto pagado, asumimos que un # de cheque o fecha de pago
  // significa que se liquidó completa; el admin puede corregirlo si fue parcial.
  const autoFillPagado = (patch) => setForm(f => {
    const next = { ...f, ...patch };
    if (!Number(f.pagado) && Number(f.valor) > 0) next.pagado = f.valor;
    return next;
  });
  return (
    <tr style={{ background: 'var(--pp-active-bg)', boxShadow: 'inset 3px 0 0 var(--pp-accent)', borderTop: '1px solid var(--pp-active-border)', borderBottom: '1px solid var(--pp-active-border)' }}>
      <td className="py-2 pl-5 pr-1"><input type="date" value={form.fechaFactura || ''} onChange={e => setForm(f => ({ ...f, fechaFactura: e.target.value }))} onClick={e => { try { e.target.showPicker(); } catch(_) {} }} className={`w-[130px] cursor-pointer ${inp}`} style={{ borderColor: 'var(--pp-border4)', background: 'var(--pp-input-bg)', color: 'var(--pp-text)', colorScheme: 'var(--pp-color-scheme)' }} /></td>
      <td className="py-2 px-1"><input value={form.numeroFactura || ''} onChange={e => setForm(f => ({ ...f, numeroFactura: e.target.value }))} placeholder="# Factura" className={`w-[88px] font-mono ${inp}`} style={{ borderColor: 'var(--pp-border4)', background: 'var(--pp-input-bg)', color: 'var(--pp-text)' }} /></td>
      <td className="py-2 px-1"><input value={form.poTag || ''} onChange={e => setForm(f => ({ ...f, poTag: e.target.value }))} placeholder="PO Tag" className={`w-[88px] font-mono ${inp}`} style={{ borderColor: 'var(--pp-border4)', background: 'var(--pp-input-bg)', color: 'var(--pp-text)' }} /></td>
      <td className="py-2 px-1"><input type="number" step="0.01" value={form.valor || ''} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="0.00" className={`w-[90px] ${inp}`} style={{ borderColor: 'var(--pp-border4)', background: 'var(--pp-input-bg)', color: 'var(--pp-text)' }} /></td>
      <td className="py-2 px-1"><input type="number" step="0.01" value={form.pagado || ''} onChange={e => setForm(f => ({ ...f, pagado: e.target.value }))} placeholder="0.00" className={`w-[90px] ${inp}`} style={{ borderColor: 'var(--pp-border4)', background: 'var(--pp-input-bg)', color: 'var(--pp-text)' }} /></td>
      <td className="py-2 px-2 text-[12.5px] font-semibold" style={{ color: '#b7791f' }}>{fmtCur(Number(form.valor || 0) - Number(form.pagado || 0))}</td>
      <td className="py-2 px-1"><input value={form.numeroCheck || ''} onChange={e => autoFillPagado({ numeroCheck: e.target.value })} placeholder="Check" className={`w-[80px] font-mono ${inp}`} style={{ borderColor: 'var(--pp-border4)', background: 'var(--pp-input-bg)', color: 'var(--pp-text)' }} /></td>
      <td className="py-2 px-1"><input type="date" value={form.fechaPago || ''} onChange={e => autoFillPagado({ fechaPago: e.target.value })} onClick={e => { try { e.target.showPicker(); } catch(_) {} }} className={`w-[130px] cursor-pointer ${inp}`} style={{ borderColor: 'var(--pp-border4)', background: 'var(--pp-input-bg)', color: 'var(--pp-text)', colorScheme: 'var(--pp-color-scheme)' }} /></td>
      <td className="py-2 pl-1 pr-4">
        <div className="flex gap-1">
          <button onClick={onSave} disabled={saving} className="w-7 h-7 rounded-[8px] flex items-center justify-center text-white text-[13px] font-bold" style={{ background: '#10b981' }}>✓</button>
          <button onClick={onCancel} className="w-7 h-7 rounded-[8px] flex items-center justify-center border text-[13px]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)', background: 'var(--pp-card)' }}>✕</button>
        </div>
      </td>
    </tr>
  );
}

export function AdminFacturas({ facturas, talleres, onAgregar, onActualizar, onEliminar, onUpdateTaller, readOnly = false, isSuperadmin = false, backups = [], onCrearBackup, onRestaurarBackup, onEliminarBackup }) {
  const [tallerSel, setTallerSel] = useState(talleres[0]?.uid || '');
  const [marca, setMarca] = useState('KIA');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [addingRow, setAddingRow] = useState(false);
  const [newForm, setNewForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [importRows, setImportRows] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();
  const [showArchived, setShowArchived] = useState(false);

  const tallerActual = talleres.find(t => t.uid === tallerSel);
  const numeroCuenta = tallerActual?.numeroCuentas?.[marca] || '';

  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [showPagadas, setShowPagadas] = useState(false);
  const [filtroArchDesde, setFiltroArchDesde] = useState('');
  const [filtroArchHasta, setFiltroArchHasta] = useState('');

  const [showBackups, setShowBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [backupError, setBackupError] = useState('');
  const [cuentaGuardada, setCuentaGuardada] = useState(false);

  const handleCrearBackup = async () => {
    setCreatingBackup(true);
    setBackupError('');
    try {
      await onCrearBackup();
    } catch (err) {
      setBackupError('No se pudo crear el backup: ' + (err.message || err.code));
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestore = async (b) => {
    const paso1 = window.confirm(
      `¿Restaurar el backup del ${formatDate(b.fecha)}?\n\nEsto BORRARÁ las ${facturas.length} facturas actuales de TODOS los talleres y marcas, y las reemplazará por las ${b.count} facturas guardadas en ese backup.\n\nEsta acción no se puede deshacer.`
    );
    if (!paso1) return;
    const paso2 = window.confirm(
      'Confirmación final: se perderán todos los cambios hechos después de ese backup. ¿Continuar con la restauración?'
    );
    if (!paso2) return;
    setRestoringId(b.id);
    setBackupError('');
    try {
      await onRestaurarBackup(b.id);
    } catch (err) {
      setBackupError('No se pudo restaurar: ' + (err.message || err.code));
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeleteBackup = async (backupId) => {
    if (!window.confirm('¿Eliminar este backup? No vas a poder restaurarlo después.')) return;
    setBackupError('');
    try {
      await onEliminarBackup(backupId);
    } catch (err) {
      setBackupError('No se pudo eliminar el backup: ' + (err.message || err.code));
    }
  };

  const todasNoArch = [...facturas]
    .filter(f => f.tallerId === tallerSel && f.marca === marca && !f.archivada)
    .sort((a, b) => (a.fechaFactura || '').localeCompare(b.fechaFactura || ''));

  const facturasPendientes = todasNoArch.filter(f => Number(f.pendiente || 0) > 0);

  const facturasPagadasVivas = todasNoArch.filter(f => Number(f.pendiente || 0) <= 0);

  const applyDateFilter = (fecha, desde, hasta) => {
    if (!fecha) return true; // sin fecha siempre visible
    if (desde && fecha < desde) return false;
    if (hasta && fecha > hasta) return false;
    return true;
  };

  const facturasPagadasFiltradas = facturasPagadasVivas.filter(f =>
    applyDateFilter(f.fechaPago || f.fechaFactura || '', filtroDesde, filtroHasta)
  );

  const facturasArchivadas = [...facturas]
    .filter(f => f.tallerId === tallerSel && f.marca === marca && f.archivada)
    .sort((a, b) => (a.fechaFactura || '').localeCompare(b.fechaFactura || ''));

  const totals = todasNoArch.reduce(
    (acc, f) => ({ valor: acc.valor + Number(f.valor || 0), pagado: acc.pagado + Number(f.pagado || 0), pendiente: acc.pendiente + Number(f.pendiente || 0) }),
    { valor: 0, pagado: 0, pendiente: 0 }
  );

  const pagadasSinArch = facturasPagadasVivas;

  const handleArchivarPagadas = async () => {
    if (!pagadasSinArch.length) return;
    if (!window.confirm(`¿Archivar ${pagadasSinArch.length} factura(s) totalmente pagada(s)? Se moverán al historial.`)) return;
    for (const f of pagadasSinArch) await onActualizar(f.id, { archivada: true });
  };

  const startEdit = (f) => { setEditId(f.id); setEditForm({ ...f }); setAddingRow(false); };
  const cancelEdit = () => setEditId(null);

  const saveEdit = async () => {
    setSaving(true);
    try {
      const pendiente = Number(editForm.valor || 0) - Number(editForm.pagado || 0);
      await onActualizar(editId, { ...editForm, pendiente });
      setEditId(null);
    } finally { setSaving(false); }
  };

  const startAdd = () => {
    setAddingRow(true); setEditId(null);
    const hoy = new Date();
    const todayISO = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;
    setNewForm({ fechaFactura: todayISO, numeroFactura: '', poTag: '', valor: '', pagado: '', numeroCheck: '', fechaPago: '' });
  };

  const saveNew = async () => {
    if (!newForm.numeroFactura) return;
    setSaving(true);
    try {
      const valor = Number(newForm.valor || 0);
      const pagado = Number(newForm.pagado || 0);
      await onAgregar({ tallerId: tallerSel, marca, ...newForm, valor, pagado, pendiente: valor - pagado });
      setAddingRow(false);
    } finally { setSaving(false); }
  };

  const saveCuenta = async (num) => {
    if (!tallerSel) return;
    await onUpdateTaller(tallerSel, { [`numeroCuentas.${marca}`]: num });
    setCuentaGuardada(true);
    setTimeout(() => setCuentaGuardada(false), 2000);
  };

  const toDateStr = (val) => {
    if (!val) return '';
    if (val instanceof Date) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    if (typeof val === 'number' && val > 1000) {
      // Serial de Excel: días desde 1899-12-30
      const d = new Date(Math.round((val - 25569) * 86400 * 1000));
      const y = d.getUTCFullYear();
      const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${mo}-${day}`;
    }
    if (typeof val === 'string') {
      const parts = val.split('/');
      if (parts.length === 3) {
        const [m, d, y] = parts;
        const year = y.length <= 2 ? '20' + y : y;
        return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
    return '';
  };

  const toNum = (val) => {
    if (val === '' || val == null) return 0;
    return parseFloat(String(val).replace(/[$,\s]/g, '')) || 0;
  };

  const handleXlsx = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // Detecta fila de encabezados buscando # FACTURA o FECHA
        let headerIdx = raw.findIndex(row =>
          row.some(c => /FACTURA|FECHA/i.test(String(c)))
        );
        if (headerIdx === -1) headerIdx = 0;

        const dataRows = raw
          .slice(headerIdx + 1)
          .filter(row => {
            const hasData = row.some(c => c !== '' && c != null);
            const isTotal = /TOTAL/i.test(String(row[0])) || /TOTAL/i.test(String(row[1]));
            return hasData && !isTotal;
          });

        const parsed = dataRows.map(row => {
          const valor = toNum(row[3]);
          const pagado = toNum(row[4]);
          const pendiente = toNum(row[5]) > 0 ? toNum(row[5]) : Math.max(0, valor - pagado);
          return {
            fechaFactura:  toDateStr(row[0]),
            numeroFactura: String(row[1] || '').trim(),
            poTag:         String(row[2] || '').trim(),
            valor,
            pagado,
            pendiente,
            numeroCheck:   String(row[6] || '').trim(),
            fechaPago:     toDateStr(row[7]),
          };
        }).filter(r => r.numeroFactura !== '');

        if (parsed.length === 0) {
          alert(`No se encontraron filas de datos.\n\nEl archivo tiene ${raw.length} filas en total. Asegúrate de que la hoja tenga encabezados con la palabra FACTURA y filas de datos debajo.`);
          return;
        }

        setImportRows(parsed);
      } catch (err) {
        alert('Error al leer el archivo: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const confirmImport = async () => {
    if (!importRows?.length) return;
    setImporting(true);
    try {
      for (const row of importRows) {
        await onAgregar({ tallerId: tallerSel, marca, ...row });
      }
      setImportRows(null);
    } finally {
      setImporting(false);
    }
  };

  // InlineRow definido como JSX directo para evitar remount en cada tecla

  const thCls = "text-left py-3 text-[10.5px] font-bold uppercase";
  const thSt = { color: 'var(--pp-text9)', letterSpacing: '.06em' };
  const tdCls = "py-3 text-[12.5px]";

  return (
    <div className="space-y-5">
      {/* Taller + marca */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <select value={tallerSel} onChange={e => setTallerSel(e.target.value)} className={`${inputClass} w-auto`}>
            {talleres.map(t => <option key={t.uid} value={t.uid}>{t.nombre}</option>)}
          </select>
          <div className="flex gap-1 p-1 rounded-[10px]" style={{ background: 'var(--pp-card)' }}>
            {MARCAS_FACTURA.map(m => (
              <button key={m} onClick={() => setMarca(m)} className="px-4 py-1.5 rounded-[8px] text-[13px] font-bold transition-all border"
                style={marca === m
                  ? { background: 'var(--pp-accent)', color: '#fff', borderColor: 'var(--pp-accent)', boxShadow: '0 2px 8px -2px rgba(0,0,0,.35)' }
                  : { background: 'transparent', color: 'var(--pp-text3)', borderColor: 'transparent' }}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {pagadasSinArch.length > 0 && !readOnly && (
            <button onClick={handleArchivarPagadas} className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold border transition-colors" style={{ borderColor: '#059669', color: '#34d399', background: 'rgba(16,185,129,0.08)' }} onMouseEnter={e => e.currentTarget.style.background='rgba(16,185,129,0.15)'} onMouseLeave={e => e.currentTarget.style.background='rgba(16,185,129,0.08)'}>
              <CheckCircle2 className="w-4 h-4" /> Archivar pagadas ({pagadasSinArch.length})
            </button>
          )}
          {!readOnly && (
            <>
              <label className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold border cursor-pointer hover:bg-[#1e1e1e] transition-colors" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Importar CSV / Excel
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleXlsx} className="hidden" />
              </label>
              <button onClick={startAdd} className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold text-white hover:bg-[#707070]" style={{ background: 'var(--pp-accent)' }}>
                <Plus className="w-4 h-4" strokeWidth={2.2} /> Nueva factura
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal previsualización import */}
      {importRows && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'var(--pp-overlay)' }}>
          <div className="relative w-full flex flex-col rounded-[20px] overflow-hidden" style={{ maxWidth: 900, maxHeight: '85vh', background: 'var(--pp-card)', boxShadow: '0 40px 80px -20px rgba(0,0,0,.35)' }}>
            <div className="flex items-center justify-between px-7 py-5 border-b flex-shrink-0" style={{ borderColor: 'var(--pp-border2)' }}>
              <div>
                <h2 className="text-[17px] font-bold" style={{ color: 'var(--pp-text)' }}>Vista previa de importación</h2>
                <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--pp-text2)' }}>{importRows.length} filas detectadas · {marca} · {talleres.find(t => t.uid === tallerSel)?.nombre}</p>
              </div>
              <button onClick={() => setImportRows(null)} className="w-9 h-9 rounded-[10px] border flex items-center justify-center hover:bg-[#1e1e1e]" style={{ borderColor: 'var(--pp-border)', color: 'var(--pp-text2)' }}>
                <X className="w-[17px] h-[17px]" />
              </button>
            </div>
            <div className="flex-1 overflow-auto px-7 py-5">
              <table className="w-full text-[12px]" style={{ minWidth: 780 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--pp-border2)' }}>
                    {['Fecha', '# Factura', 'PO Tag', 'Valor', 'Pagado', 'Pendiente', '# Check', 'F. Pago'].map(h => (
                      <th key={h} className="text-left pb-2 pr-4 text-[10.5px] font-bold uppercase" style={{ color: 'var(--pp-text3)', letterSpacing: '.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importRows.map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--pp-border2)' }}>
                      <td className="py-2 pr-4 whitespace-nowrap" style={{ color: 'var(--pp-text2)' }}>{fmtDateDisp(r.fechaFactura)}</td>
                      <td className="py-2 pr-4 font-mono font-semibold" style={{ color: 'var(--pp-text)' }}>{r.numeroFactura}</td>
                      <td className="py-2 pr-4 font-mono" style={{ color: 'var(--pp-text2)' }}>{r.poTag || '—'}</td>
                      <td className="py-2 pr-4 font-semibold" style={{ color: 'var(--pp-text)' }}>{fmtCur(r.valor)}</td>
                      <td className="py-2 pr-4 font-semibold" style={{ color: r.pagado > 0 ? '#059669' : 'var(--pp-text3)' }}>{r.pagado > 0 ? fmtCur(r.pagado) : '—'}</td>
                      <td className="py-2 pr-4 font-semibold" style={{ color: r.pendiente > 0 ? '#b7791f' : '#059669' }}>{fmtCur(r.pendiente)}</td>
                      <td className="py-2 pr-4 font-mono" style={{ color: 'var(--pp-text2)' }}>{r.numeroCheck || '—'}</td>
                      <td className="py-2 whitespace-nowrap" style={{ color: 'var(--pp-text2)' }}>{fmtDateDisp(r.fechaPago)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-7 py-4 border-t flex-shrink-0" style={{ borderColor: 'var(--pp-border2)' }}>
              <p className="text-[12.5px]" style={{ color: 'var(--pp-text2)' }}>Revisa las filas antes de importar. Se agregarán a las existentes.</p>
              <div className="flex gap-3">
                <button onClick={() => setImportRows(null)} className="px-5 py-[9px] rounded-[10px] border text-[13px] font-semibold hover:bg-[#1e1e1e]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>Cancelar</button>
                <button onClick={confirmImport} disabled={importing} className="px-5 py-[9px] rounded-[10px] text-white text-[13px] font-bold hover:bg-[#707070] disabled:opacity-60" style={{ background: 'var(--pp-accent)' }}>
                  {importing ? 'Importando…' : `Importar ${importRows.length} filas`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* # de cuenta */}
      <div className="flex items-center gap-3">
        <span className="text-[12.5px] font-semibold" style={{ color: 'var(--pp-text2)' }}># de cuenta:</span>
        {isSuperadmin ? (
          <>
            <input
              key={`${tallerSel}_${marca}`}
              defaultValue={numeroCuenta}
              onBlur={e => saveCuenta(e.target.value)}
              placeholder="ej. 517831"
              className="px-3 py-1.5 rounded-[9px] border text-[13px] font-mono w-36 outline-none focus:border-[#a0a0a0]"
              style={{ borderColor: 'var(--pp-border4)', background: 'var(--pp-input-bg)', color: 'var(--pp-text)' }}
            />
            {cuentaGuardada ? (
              <span className="flex items-center gap-1 text-[11.5px] font-semibold" style={{ color: '#34d399', animation: 'ppRise .2s ease both' }}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Guardado
              </span>
            ) : (
              <span className="text-[11.5px]" style={{ color: 'var(--pp-text3)' }}>Se guarda al salir del campo</span>
            )}
          </>
        ) : (
          <span className="px-3 py-1.5 rounded-[9px] border text-[13px] font-mono w-36 select-all" style={{ borderColor: 'var(--pp-border4)', background: 'var(--pp-bg)', color: 'var(--pp-text2)' }}>
            {numeroCuenta || '—'}
          </span>
        )}
      </div>

      {/* Tarjetas de totales */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: 'Total facturas', val: fmtCur(totals.valor),    color: 'var(--pp-text)' },
          { label: 'Pagado',         val: fmtCur(totals.pagado),   color: '#34d399' },
          { label: 'Pendiente',      val: fmtCur(totals.pendiente),color: totals.pendiente > 0 ? '#f59e0b' : '#34d399' },
        ].map(({ label, val, color }) => (
          <div key={label} className="rounded-[15px] p-3 sm:p-4 border min-w-0" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
            <p className="text-[10px] sm:text-[12px] font-medium mb-1 truncate" style={{ color: 'var(--pp-text2)' }}>{label}</p>
            <p className="text-[13px] sm:text-[22px] font-extrabold leading-none break-all" style={{ color }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="rounded-[16px] border" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--pp-border2)' }}>
              <th className={`${thCls} pl-5 pr-2`} style={thSt}>Fecha</th>
              <th className={`${thCls} px-2`} style={thSt}># Factura</th>
              <th className={`${thCls} px-2 hidden sm:table-cell`} style={thSt}>PO Tag</th>
              <th className={`${thCls} px-2`} style={thSt}>Valor</th>
              <th className={`${thCls} px-2 hidden sm:table-cell`} style={thSt}>Pagado</th>
              <th className={`${thCls} px-2`} style={thSt}>Pendiente</th>
              <th className={`${thCls} px-2 hidden lg:table-cell`} style={thSt}># Check</th>
              <th className={`${thCls} px-2 hidden lg:table-cell`} style={thSt}>F. Pago</th>
              <th className={`${thCls} pr-4`} style={thSt}></th>
            </tr>
          </thead>
          <tbody>
            {facturasPendientes.length === 0 && !addingRow && (
              <tr><td colSpan={9} className="py-12 text-center text-[13px]" style={{ color: 'var(--pp-text3)' }}>Sin facturas pendientes. Usa "+ Nueva factura" para agregar.</td></tr>
            )}
            {facturasPendientes.map(f => editId === f.id
              ? <FacturaInlineRow key={f.id} form={editForm} setForm={setEditForm} onSave={saveEdit} onCancel={cancelEdit} saving={saving} />
              : (
                <tr key={f.id} onClick={() => startEdit(f)} className="cursor-pointer hover:bg-[#1e1e1e] transition-colors" style={{ borderTop: '1px solid var(--pp-border2)' }}>
                  <td className={`${tdCls} pl-5 pr-2 whitespace-nowrap`} style={{ color: 'var(--pp-text2)' }}>{fmtDateDisp(f.fechaFactura)}</td>
                  <td className={`${tdCls} px-2 font-mono font-semibold`} style={{ color: 'var(--pp-text)' }}>{f.numeroFactura}</td>
                  <td className={`${tdCls} px-2 font-mono hidden sm:table-cell`} style={{ color: 'var(--pp-text2)' }}>{f.poTag || '—'}</td>
                  <td className={`${tdCls} px-2 font-semibold`} style={{ color: 'var(--pp-text)' }}>{fmtCur(f.valor)}</td>
                  <td className={`${tdCls} px-2 font-semibold hidden sm:table-cell`} style={{ color: Number(f.pagado) > 0 ? '#34d399' : 'var(--pp-text3)' }}>{Number(f.pagado) > 0 ? fmtCur(f.pagado) : '—'}</td>
                  <td className={`${tdCls} px-2 font-semibold`} style={{ color: Number(f.pendiente) > 0 ? '#f59e0b' : '#34d399' }}>{fmtCur(f.pendiente)}</td>
                  <td className={`${tdCls} px-2 font-mono hidden lg:table-cell`} style={{ color: 'var(--pp-text2)' }}>{f.numeroCheck || '—'}</td>
                  <td className={`${tdCls} px-2 whitespace-nowrap hidden lg:table-cell`} style={{ color: 'var(--pp-text2)' }}>{fmtDateDisp(f.fechaPago)}</td>
                  <td className="py-2 pl-1 pr-4">
                    <button onClick={e => { e.stopPropagation(); if (window.confirm('¿Eliminar esta factura?')) onEliminar(f.id); }} className="w-7 h-7 rounded-[8px] flex items-center justify-center hover:bg-red-900/30 hover:text-red-400 transition-colors" style={{ color: 'var(--pp-text3)' }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              )
            )}
            {addingRow && <FacturaInlineRow form={newForm} setForm={setNewForm} onSave={saveNew} onCancel={() => setAddingRow(false)} saving={saving} />}
          </tbody>
          {facturasPendientes.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--pp-border2)', background: 'var(--pp-card)' }}>
                <td colSpan={2} className="py-3 pl-5 text-[12.5px] font-bold" style={{ color: 'var(--pp-text)' }}>TOTAL</td>
                <td className="py-3 px-2 text-[12.5px] font-bold hidden sm:table-cell" style={{ color: 'var(--pp-text3)' }}></td>
                <td className="py-3 px-2 text-[12.5px] font-bold" style={{ color: 'var(--pp-text)' }}>{fmtCur(totals.valor)}</td>
                <td className="py-3 px-2 text-[12.5px] font-bold hidden sm:table-cell" style={{ color: '#34d399' }}>{fmtCur(totals.pagado)}</td>
                <td className="py-3 px-2 text-[12.5px] font-bold" style={{ color: totals.pendiente > 0 ? '#f59e0b' : '#34d399' }}>{fmtCur(totals.pendiente)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Facturas Pagadas — colapsable con filtro por fecha */}
      {facturasPagadasVivas.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowPagadas(v => !v)}
            className="flex items-center gap-2 text-[12.5px] font-semibold transition-colors hover:text-[#a0a0a0]"
            style={{ color: '#34d399' }}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${showPagadas ? 'rotate-90' : ''}`} />
            Facturas pagadas ({facturasPagadasVivas.length})
          </button>
          {showPagadas && (
            <div className="mt-3 space-y-3" style={{ animation: 'ppRise .22s cubic-bezier(.2,.8,.2,1) both' }}>
              {/* Filtros de fecha */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[12.5px] font-semibold" style={{ color: 'var(--pp-text2)' }}>Filtrar por fecha:</span>
                <div className="flex items-center gap-2">
                  <span className="text-[12px]" style={{ color: 'var(--pp-text3)' }}>Desde</span>
                  <input
                    type="date"
                    value={filtroDesde}
                    onChange={e => setFiltroDesde(e.target.value)}
                    onClick={e => { try { e.target.showPicker(); } catch(_) {} }}
                    className="px-2 py-1 rounded-[8px] border text-[13px] outline-none focus:border-[#a0a0a0] cursor-pointer"
                    style={{ borderColor: 'var(--pp-border4)', background: 'var(--pp-input-bg)', color: 'var(--pp-text)', colorScheme: 'var(--pp-color-scheme)' }}
                  />
                  {filtroDesde && <span className="text-[11px] font-mono" style={{ color: 'var(--pp-text3)' }}>({fmtDateDisp(filtroDesde)})</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px]" style={{ color: 'var(--pp-text3)' }}>Hasta</span>
                  <input
                    type="date"
                    value={filtroHasta}
                    onChange={e => setFiltroHasta(e.target.value)}
                    onClick={e => { try { e.target.showPicker(); } catch(_) {} }}
                    className="px-2 py-1 rounded-[8px] border text-[13px] outline-none focus:border-[#a0a0a0] cursor-pointer"
                    style={{ borderColor: 'var(--pp-border4)', background: 'var(--pp-input-bg)', color: 'var(--pp-text)', colorScheme: 'var(--pp-color-scheme)' }}
                  />
                  {filtroHasta && <span className="text-[11px] font-mono" style={{ color: 'var(--pp-text3)' }}>({fmtDateDisp(filtroHasta)})</span>}
                </div>
                {(filtroDesde || filtroHasta) && (
                  <button onClick={() => { setFiltroDesde(''); setFiltroHasta(''); }} className="text-[12px] hover:underline" style={{ color: 'var(--pp-text3)' }}>
                    Limpiar filtro
                  </button>
                )}
                <span className="text-[12px]" style={{ color: 'var(--pp-text3)' }}>
                  {facturasPagadasFiltradas.length} de {facturasPagadasVivas.length} facturas
                </span>
              </div>

              {/* Tabla pagadas */}
              <div className="rounded-[16px] border overflow-x-auto" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)', opacity: 0.9 }}>
                <table className="w-full" style={{ minWidth: 800 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--pp-border2)' }}>
                      {['Fecha','# Factura','PO Tag','Valor','Pagado','# Check','F. Pago',''].map((h, i) => (
                        <th key={i} className={`text-left py-2.5 text-[10.5px] font-bold uppercase ${i===0?'pl-5 pr-2':'px-2'}`} style={{ color: 'var(--pp-text3)', letterSpacing: '.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {facturasPagadasFiltradas.length === 0 ? (
                      <tr><td colSpan={8} className="py-8 text-center text-[13px]" style={{ color: 'var(--pp-text3)' }}>Sin facturas pagadas en ese rango de fechas.</td></tr>
                    ) : facturasPagadasFiltradas.map(f => (
                      <tr key={f.id} onClick={() => startEdit(f)} className="cursor-pointer hover:bg-[#1e1e1e] transition-colors" style={{ borderTop: '1px solid var(--pp-border2)' }}>
                        <td className="py-3 pl-5 pr-2 text-[12px] whitespace-nowrap" style={{ color: 'var(--pp-text2)' }}>{fmtDateDisp(f.fechaFactura)}</td>
                        <td className="py-3 px-2 font-mono font-semibold text-[12px]" style={{ color: 'var(--pp-text)' }}>{f.numeroFactura}</td>
                        <td className="py-3 px-2 font-mono text-[12px]" style={{ color: 'var(--pp-text3)' }}>{f.poTag||'—'}</td>
                        <td className="py-3 px-2 text-[12px] font-semibold" style={{ color: 'var(--pp-text)' }}>{fmtCur(f.valor)}</td>
                        <td className="py-3 px-2 text-[12px] font-semibold" style={{ color: '#34d399' }}>{fmtCur(f.pagado)}</td>
                        <td className="py-3 px-2 font-mono text-[12px]" style={{ color: 'var(--pp-text3)' }}>{f.numeroCheck||'—'}</td>
                        <td className="py-3 px-2 text-[12px] whitespace-nowrap" style={{ color: 'var(--pp-text3)' }}>{fmtDateDisp(f.fechaPago)}</td>
                        <td className="py-3 pr-4">
                          <button onClick={e => { e.stopPropagation(); if (window.confirm('¿Eliminar esta factura?')) onEliminar(f.id); }} className="w-7 h-7 rounded-[8px] flex items-center justify-center hover:bg-red-900/30 hover:text-red-400 transition-colors" style={{ color: 'var(--pp-text3)' }}>
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {facturasPagadasFiltradas.length > 0 && (
                    <tfoot>
                      <tr style={{ borderTop: '2px solid var(--pp-border2)', background: 'var(--pp-card)' }}>
                        <td colSpan={3} className="py-2.5 pl-5 text-[12px] font-bold" style={{ color: 'var(--pp-text3)' }}>TOTAL PAGADAS</td>
                        <td className="py-2.5 px-2 text-[12px] font-bold" style={{ color: 'var(--pp-text)' }}>{fmtCur(facturasPagadasFiltradas.reduce((s,f)=>s+Number(f.valor||0),0))}</td>
                        <td className="py-2.5 px-2 text-[12px] font-bold" style={{ color: '#34d399' }}>{fmtCur(facturasPagadasFiltradas.reduce((s,f)=>s+Number(f.pagado||0),0))}</td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historial de archivadas */}
      {facturasArchivadas.length > 0 && (() => {
        const archFiltradas = facturasArchivadas.filter(f =>
          applyDateFilter(f.fechaPago || f.fechaFactura || '', filtroArchDesde, filtroArchHasta)
        );
        return (
          <div className="mt-2">
            <button
              onClick={() => setShowArchived(v => !v)}
              className="flex items-center gap-2 text-[12.5px] font-semibold transition-colors hover:text-[#a0a0a0]"
              style={{ color: 'var(--pp-text3)' }}
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${showArchived ? 'rotate-90' : ''}`} />
              Historial de pagadas archivadas ({facturasArchivadas.length})
            </button>
            {showArchived && (
              <div className="mt-3 space-y-3" style={{ animation: 'ppRise .22s cubic-bezier(.2,.8,.2,1) both' }}>
                {/* Filtros de fecha archivadas */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[12.5px] font-semibold" style={{ color: 'var(--pp-text2)' }}>Filtrar por fecha:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px]" style={{ color: 'var(--pp-text3)' }}>Desde</span>
                    <input type="date" value={filtroArchDesde} onChange={e => setFiltroArchDesde(e.target.value)} onClick={e => { try { e.target.showPicker(); } catch(_) {} }}
                      className="px-2 py-1 rounded-[8px] border text-[13px] outline-none focus:border-[#a0a0a0] cursor-pointer"
                      style={{ borderColor: 'var(--pp-border4)', background: 'var(--pp-input-bg)', color: 'var(--pp-text)', colorScheme: 'var(--pp-color-scheme)' }} />
                    {filtroArchDesde && <span className="text-[11px] font-mono" style={{ color: 'var(--pp-text3)' }}>({fmtDateDisp(filtroArchDesde)})</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px]" style={{ color: 'var(--pp-text3)' }}>Hasta</span>
                    <input type="date" value={filtroArchHasta} onChange={e => setFiltroArchHasta(e.target.value)} onClick={e => { try { e.target.showPicker(); } catch(_) {} }}
                      className="px-2 py-1 rounded-[8px] border text-[13px] outline-none focus:border-[#a0a0a0] cursor-pointer"
                      style={{ borderColor: 'var(--pp-border4)', background: 'var(--pp-input-bg)', color: 'var(--pp-text)', colorScheme: 'var(--pp-color-scheme)' }} />
                    {filtroArchHasta && <span className="text-[11px] font-mono" style={{ color: 'var(--pp-text3)' }}>({fmtDateDisp(filtroArchHasta)})</span>}
                  </div>
                  {(filtroArchDesde || filtroArchHasta) && (
                    <button onClick={() => { setFiltroArchDesde(''); setFiltroArchHasta(''); }} className="text-[12px] hover:underline" style={{ color: 'var(--pp-text3)' }}>
                      Limpiar filtro
                    </button>
                  )}
                  <span className="text-[12px]" style={{ color: 'var(--pp-text3)' }}>{archFiltradas.length} de {facturasArchivadas.length} facturas</span>
                </div>
                <div className="rounded-[16px] border overflow-x-auto" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)', opacity: 0.85 }}>
                  <table className="w-full" style={{ minWidth: 800 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--pp-border2)' }}>
                        {['Fecha','# Factura','PO Tag','Valor','Pagado','Pendiente','# Check','F. Pago',''].map((h,i) => (
                          <th key={i} className={`text-left py-2.5 text-[10.5px] font-bold uppercase ${i===0?'pl-5 pr-2':'px-2'}`} style={{ color: 'var(--pp-text3)', letterSpacing: '.06em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {archFiltradas.length === 0 ? (
                        <tr><td colSpan={9} className="py-8 text-center text-[13px]" style={{ color: 'var(--pp-text3)' }}>Sin facturas archivadas en ese rango de fechas.</td></tr>
                      ) : archFiltradas.map(f => (
                        <tr key={f.id} style={{ borderTop: '1px solid var(--pp-border2)' }}>
                          <td className="py-3 pl-5 pr-2 text-[12px] whitespace-nowrap" style={{ color: 'var(--pp-text3)' }}>{fmtDateDisp(f.fechaFactura)}</td>
                          <td className="py-3 px-2 font-mono text-[12px]" style={{ color: 'var(--pp-text3)' }}>{f.numeroFactura}</td>
                          <td className="py-3 px-2 font-mono text-[12px]" style={{ color: 'var(--pp-text3)' }}>{f.poTag||'—'}</td>
                          <td className="py-3 px-2 text-[12px]" style={{ color: 'var(--pp-text3)' }}>{fmtCur(f.valor)}</td>
                          <td className="py-3 px-2 text-[12px] font-semibold" style={{ color: '#059669' }}>{fmtCur(f.pagado)}</td>
                          <td className="py-3 px-2 text-[12px] font-semibold" style={{ color: '#059669' }}>{fmtCur(f.pendiente)}</td>
                          <td className="py-3 px-2 font-mono text-[12px]" style={{ color: 'var(--pp-text3)' }}>{f.numeroCheck||'—'}</td>
                          <td className="py-3 px-2 text-[12px] whitespace-nowrap" style={{ color: 'var(--pp-text3)' }}>{fmtDateDisp(f.fechaPago)}</td>
                          <td className="py-3 pr-4">
                            <button onClick={() => onActualizar(f.id, { archivada: false })} className="text-[11px] font-semibold hover:underline" style={{ color: 'var(--pp-text8)' }}>
                              Restaurar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {archFiltradas.length > 0 && (
                      <tfoot>
                        <tr style={{ borderTop: '2px solid var(--pp-border2)', background: 'var(--pp-card)' }}>
                          <td colSpan={3} className="py-2.5 pl-5 text-[12px] font-bold" style={{ color: 'var(--pp-text3)' }}>TOTAL</td>
                          <td className="py-2.5 px-2 text-[12px] font-bold" style={{ color: 'var(--pp-text3)' }}>{fmtCur(archFiltradas.reduce((s,f)=>s+Number(f.valor||0),0))}</td>
                          <td className="py-2.5 px-2 text-[12px] font-bold" style={{ color: '#059669' }}>{fmtCur(archFiltradas.reduce((s,f)=>s+Number(f.pagado||0),0))}</td>
                          <td colSpan={4} />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Respaldo de facturas — solo superadmin */}
      {isSuperadmin && (
        <div className="mt-2">
          <button
            onClick={() => setShowBackups(v => !v)}
            className="flex items-center gap-2 text-[12.5px] font-semibold transition-colors hover:text-[#a0a0a0]"
            style={{ color: 'var(--pp-text3)' }}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${showBackups ? 'rotate-90' : ''}`} />
            Respaldo de facturas ({backups.length})
          </button>
          {showBackups && (
            <div className="mt-3 space-y-3 rounded-[16px] border p-4" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)', animation: 'ppRise .22s cubic-bezier(.2,.8,.2,1) both' }}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-[12.5px] max-w-md" style={{ color: 'var(--pp-text2)' }}>
                  Guarda una copia con fecha de las {facturas.length} facturas actuales (todos los talleres y marcas). Podés usarla más adelante para restaurar si algo sale mal.
                </p>
                <button
                  onClick={handleCrearBackup}
                  disabled={creatingBackup}
                  className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold text-white hover:bg-[#707070] disabled:opacity-60 flex-shrink-0"
                  style={{ background: 'var(--pp-accent)' }}
                >
                  <Archive className="w-4 h-4" /> {creatingBackup ? 'Creando backup…' : 'Crear backup ahora'}
                </button>
              </div>

              {backupError && (
                <div className="text-[12.5px] px-3 py-2 rounded-lg" style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626' }}>
                  {backupError}
                </div>
              )}

              <div className="rounded-[12px] border overflow-hidden" style={{ borderColor: 'var(--pp-border2)' }}>
                {backups.length === 0 ? (
                  <div className="py-6 text-center text-[13px]" style={{ color: 'var(--pp-text3)' }}>Todavía no hay backups.</div>
                ) : backups.map(b => (
                  <div key={b.id} className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderTop: '1px solid var(--pp-border2)' }}>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold" style={{ color: 'var(--pp-text)' }}>{formatDate(b.fecha)}</p>
                      <p className="text-[11.5px]" style={{ color: 'var(--pp-text3)' }}>{b.count} factura{b.count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleRestore(b)}
                        disabled={restoringId === b.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] border text-[12.5px] font-semibold transition-colors disabled:opacity-60"
                        style={{ borderColor: '#a0a0a0', color: 'var(--pp-text)' }}
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> {restoringId === b.id ? 'Restaurando…' : 'Restaurar'}
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(b.id)}
                        className="w-8 h-8 rounded-[9px] flex items-center justify-center hover:bg-red-900/30 hover:text-red-400 transition-colors"
                        style={{ color: 'var(--pp-text3)' }}
                        title="Eliminar backup"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CLIENT FACTURAS                                                     */
/* ------------------------------------------------------------------ */
