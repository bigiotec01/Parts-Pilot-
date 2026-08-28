import { useState, useMemo } from 'react';
import {
  Plus, X, Trash2, Printer, Settings, AlertCircle, CheckCircle2, FileText, Pencil, Ban, RotateCcw
} from 'lucide-react';
import { Modal } from '../shared/Modal';
import { FormField, EmptyState } from '../shared/FormField';
import { inputClass } from '../../constants/styles';
import { fmtCur, fmtDateDisp } from '../../utils/format';

const ITEM_VACIO = { descripcion: '', cantidad: 1, precioUnitario: '' };

const ESTADO_CFG = {
  pendiente: { label: 'Pendiente', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  pagada:    { label: 'Pagada',    bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
  anulada:   { label: 'Anulada',   bg: 'rgba(148,163,184,0.14)', color: '#94a3b8' },
};

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function calcularTotales(items, impuestoPct) {
  const subtotal = items.reduce((s, it) => s + (Number(it.cantidad) || 0) * (Number(it.precioUnitario) || 0), 0);
  const impuestoMonto = subtotal * (Number(impuestoPct) || 0) / 100;
  return { subtotal, impuestoMonto, total: subtotal + impuestoMonto };
}

/* ------------------------------------------------------------------ */
/*  Modal: configuración de facturación (membrete de TODAS tus          */
/*  facturas profesionales — nombre, RFC, dirección, impuesto y         */
/*  políticas por defecto). Vive en empresas/{tenantId}.facturacionConfig */
/* ------------------------------------------------------------------ */
function ConfigFacturacionModal({ config, onGuardar, onClose }) {
  const [form, setForm] = useState({
    nombreEmpresa: config?.nombreEmpresa || '',
    rfc: config?.rfc || '',
    direccion: config?.direccion || '',
    telefono: config?.telefono || '',
    email: config?.email || '',
    impuestoDefaultPct: config?.impuestoDefaultPct ?? 0,
    politicasDefault: config?.politicasDefault || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const guardar = async () => {
    if (!form.nombreEmpresa.trim()) { setError('El nombre de tu empresa es obligatorio.'); return; }
    setSaving(true); setError('');
    try {
      await onGuardar(form);
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo guardar.');
    } finally { setSaving(false); }
  };

  return (
    <Modal title="Configuración de facturación" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-[12.5px]" style={{ color: 'var(--pp-text2)' }}>
          Esta información aparece como remitente en cada factura profesional que emitas. El impuesto y las políticas se usan como valor por defecto — podés cambiarlos en cada factura individual.
        </p>
        <FormField label="Nombre de tu empresa">
          <input value={form.nombreEmpresa} onChange={e => set('nombreEmpresa', e.target.value)} placeholder="ej. Parts Pilot Auto Parts LLC" className={inputClass} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="RFC / Tax ID"><input value={form.rfc} onChange={e => set('rfc', e.target.value)} className={`${inputClass} font-mono`} /></FormField>
          <FormField label="Teléfono"><input value={form.telefono} onChange={e => set('telefono', e.target.value)} className={inputClass} /></FormField>
        </div>
        <FormField label="Correo electrónico"><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputClass} /></FormField>
        <FormField label="Dirección"><input value={form.direccion} onChange={e => set('direccion', e.target.value)} className={inputClass} /></FormField>
        <FormField label="Impuesto por defecto (%)">
          <input type="number" step="0.01" min="0" max="100" value={form.impuestoDefaultPct} onChange={e => set('impuestoDefaultPct', e.target.value)} className={`${inputClass} w-32`} />
        </FormField>
        <FormField label="Políticas / términos por defecto">
          <textarea value={form.politicasDefault} onChange={e => set('politicasDefault', e.target.value)} rows={4} placeholder="ej. Pago a 15 días. Precios en USD. Mercancía vendida no tiene devolución sin autorización previa…" className={`${inputClass} resize-none`} />
        </FormField>
        {error && <p className="text-[12.5px]" style={{ color: '#dc2626' }}>{error}</p>}
        <button onClick={guardar} disabled={saving} className="w-full py-[11px] rounded-[11px] text-white font-bold text-[14px] disabled:opacity-50" style={{ background: 'var(--pp-accent)' }}>
          {saving ? 'Guardando…' : 'Guardar configuración'}
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Genera el HTML imprimible/PDF de una factura (mismo patrón que el   */
/*  "Imprimir / PDF" de Facturas y Reportes: ventana nueva + print()).   */
/* ------------------------------------------------------------------ */
// Estilo "factura de mostrador" clásico (formato tipo DMS de dealer: cajas con
// bordes, todo en monoespaciada, franja de membrete en negro, "FACTURAR A" con
// etiqueta vertical al margen, caja de políticas abajo a la izquierda y caja de
// totales abajo a la derecha) — a pedido, para que se sienta como una factura
// impresa "de verdad" en vez de un PDF genérico.
function imprimirFactura(factura, config) {
  const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const rows = (factura.items || []).map(it => `
    <tr>
      <td class="c-cant">${Number(it.cantidad || 0)}</td>
      <td class="c-desc">${(it.descripcion || '').toUpperCase()}</td>
      <td class="c-num">${money(it.precioUnitario)}</td>
      <td class="c-num">${money((Number(it.cantidad) || 0) * (Number(it.precioUnitario) || 0))}</td>
    </tr>`).join('');

  const estadoLabel = (ESTADO_CFG[factura.estado]?.label || factura.estado || '').toUpperCase();

  const html = `<!DOCTYPE html><html lang="es"><head>
    <meta charset="utf-8">
    <title>Factura ${factura.numeroFactura}</title>
    <style>
      *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      html,body{height:100%;margin:0}
      body{font-family:'Courier New',Courier,monospace;font-size:14px;padding:16px 8px;color:#111;display:flex}
      .marco{border:2.5px solid #111;padding:20px 12px;flex:1;display:flex;flex-direction:column;min-height:0}

      /* Franjas tipo "papel continuo" (greenbar) que rellenan el resto de la
         hoja legal, igual que el área en blanco/sombreada del ejemplo — para
         que la factura ocupe la hoja completa aunque tenga pocos ítems. */
      .relleno{flex:1 1 auto;min-height:30px;margin-top:4px;
        background:repeating-linear-gradient(180deg,#fff 0 9mm,#eee 9mm 18mm);
        border-left:1.4px solid #111;border-right:1.4px solid #111}

      .membrete{text-align:center;margin-bottom:16px}
      .membrete .barra{background:#111;color:#fff;display:inline-block;padding:14px 46px;font-size:32px;font-weight:bold;letter-spacing:.09em;text-transform:uppercase}
      .membrete p{margin:9px 0 0;font-size:13.5px;letter-spacing:.02em;text-transform:uppercase}

      table.meta{width:100%;border-collapse:collapse;margin-bottom:0;table-layout:fixed}
      table.meta td{border:1.4px solid #111;padding:9px 14px;vertical-align:top}
      table.meta .lbl{font-size:10.5px;letter-spacing:.04em;display:block;margin-bottom:5px}
      table.meta .val{font-size:16px;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

      .cliente{border:1.4px solid #111;border-top:none;padding:14px 16px 14px 42px;position:relative;min-height:110px}
      .cliente .tag{position:absolute;left:0;top:0;bottom:0;width:26px;background:#111;color:#fff;display:flex;align-items:center;justify-content:center}
      .cliente .tag span{writing-mode:vertical-rl;transform:rotate(180deg);font-size:11px;letter-spacing:.18em;font-weight:bold}
      .cliente .pagina{position:absolute;right:14px;top:10px;font-size:10.5px}
      .cliente .nombre{font-weight:bold;font-size:17px;text-transform:uppercase;margin:0 0 5px}
      .cliente p{margin:2px 0;font-size:13.5px}

      table.items{width:100%;border-collapse:collapse;margin-top:16px}
      table.items thead th{background:#111;color:#fff;font-size:11.5px;letter-spacing:.04em;text-transform:uppercase;padding:10px 14px;text-align:left;border:1.4px solid #111}
      table.items td{border:1px solid #111;padding:11px 14px;font-size:13.5px}
      table.items .c-cant{width:70px;text-align:center}
      table.items .c-desc{width:auto}
      table.items .c-num{width:140px;text-align:right;white-space:nowrap}
      table.items thead th.c-cant,table.items thead th.c-num{text-align:right}
      table.items thead th.c-cant{text-align:center}

      .abajo{display:flex;gap:20px;margin-top:18px;align-items:flex-start}
      .politicas{flex:1;border:1.4px solid #111;padding:14px 16px;font-size:12.5px;min-height:170px}
      .politicas h4{margin:0 0 8px;font-size:12.5px;letter-spacing:.04em;text-transform:uppercase;border-bottom:1px solid #111;padding-bottom:6px}
      .politicas .txt{white-space:pre-wrap;line-height:1.6}
      .politicas .notas{margin-top:12px;padding-top:9px;border-top:1px dashed #111}
      .firma{margin-top:22px;font-size:13.5px}
      .firma .linea{display:inline-block;border-bottom:1px solid #111;width:260px;margin-left:8px}

      .totales{width:290px;border:1.4px solid #111}
      .totales div{display:flex;justify-content:space-between;padding:9px 14px;font-size:13.5px;border-top:1px solid #111}
      .totales div:first-child{border-top:none}
      .totales .total{font-weight:bold;font-size:18px;border-top:2px solid #111;padding-top:11px}

      .pie{text-align:center;margin-top:22px;padding-top:12px;border-top:1.4px solid #111;font-size:13px;letter-spacing:.12em;text-transform:uppercase;font-weight:bold}
      .copyright{margin-top:6px;font-size:9.5px;text-align:left;letter-spacing:.02em;opacity:.7}

      /* Papel legal (8.5 x 14) de punta a punta, como el ejemplo — margen
         chico a los lados para que no sobre tanto espacio en blanco. */
      @page{size:legal;margin:8mm 4mm}
      @media print{body{padding:16px 6px}}
    </style>
  </head><body>
    <div class="marco">

      <div class="membrete">
        <div class="barra">${(config?.nombreEmpresa || 'TU EMPRESA').toUpperCase()}</div>
        <p>
          ${[config?.direccion, config?.telefono ? `Tel: ${config.telefono}` : '', config?.email, config?.rfc ? `RFC/Tax ID: ${config.rfc}` : '']
            .filter(Boolean).join(' &middot; ')}
        </p>
      </div>

      <table class="meta">
        <tr>
          <td style="width:25%"><span class="lbl">FECHA</span><span class="val">${fmtDateDisp(factura.fecha)}</span></td>
          <td style="width:25%"><span class="lbl">FACTURA NO.</span><span class="val">${factura.numeroFactura}</span></td>
          <td style="width:25%"><span class="lbl">VENCE</span><span class="val">${factura.fechaVencimiento ? fmtDateDisp(factura.fechaVencimiento) : '&mdash;'}</span></td>
          <td style="width:25%"><span class="lbl">ESTADO</span><span class="val">${estadoLabel}</span></td>
        </tr>
      </table>

      <div class="cliente">
        <div class="tag"><span>FACTURAR A</span></div>
        <div class="pagina">PÁGINA 1 DE 1</div>
        <p class="nombre">${factura.clienteNombre || ''}</p>
        ${factura.clienteRfc ? `<p>RFC/Tax ID: ${factura.clienteRfc}</p>` : ''}
        ${factura.clienteDireccion ? `<p>${factura.clienteDireccion}</p>` : ''}
        ${factura.clienteTelefono ? `<p>Tel: ${factura.clienteTelefono}</p>` : ''}
        ${factura.clienteEmail ? `<p>${factura.clienteEmail}</p>` : ''}
      </div>

      <table class="items">
        <thead><tr><th class="c-cant">Cant.</th><th class="c-desc">Descripción</th><th class="c-num">Precio</th><th class="c-num">Importe</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="relleno"></div>

      <div class="abajo">
        <div>
          <div class="politicas">
            <h4>Políticas / Términos</h4>
            <div class="txt">${factura.politicas || 'Sin políticas registradas.'}</div>
            ${factura.notas ? `<div class="notas"><strong>NOTAS:</strong> ${factura.notas}</div>` : ''}
          </div>
          <div class="firma">Recibido por: X<span class="linea"></span></div>
        </div>
        <div class="totales">
          <div><span>SUBTOTAL</span><span>${money(factura.subtotal)}</span></div>
          <div><span>IMPUESTO (${Number(factura.impuestoPct || 0)}%)</span><span>${money(factura.impuestoMonto)}</span></div>
          <div class="total"><span>TOTAL</span><span>${money(factura.total)}</span></div>
        </div>
      </div>

      <div class="pie">Copia · Cliente</div>
      <div class="copyright">Generado por Parts Pilot &middot; ${factura.numeroFactura}</div>
    </div>
  </body></html>`;

  const w = window.open('', '_blank', 'width=900,height=1000');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

/* ------------------------------------------------------------------ */
/*  Formulario de creación / edición de una factura profesional         */
/* ------------------------------------------------------------------ */
function FacturaForm({ talleres, empresasClientes, config, initial, onGuardar, onCancelar }) {
  const clientesFacturables = useMemo(() => ([
    ...talleres.map(t => ({ tipo: 'taller', id: t.uid, nombre: t.nombre, telefono: t.telefono, email: t.email })),
    ...empresasClientes.filter(e => e.facturacionHabilitada !== false).map(e => ({ tipo: 'empresa', id: e.id, nombre: e.nombre, rfc: e.rfc, direccion: e.direccion, telefono: e.telefono, email: e.email })),
  ]), [talleres, empresasClientes]);

  const [clienteKey, setClienteKey] = useState(initial ? `${initial.clienteTipo}:${initial.clienteId}` : '');
  const [fecha, setFecha] = useState(initial?.fecha || hoyISO());
  const [fechaVencimiento, setFechaVencimiento] = useState(initial?.fechaVencimiento || '');
  const [numeroFactura, setNumeroFactura] = useState(initial?.numeroFactura || '');
  const [items, setItems] = useState(initial?.items?.length ? initial.items : [{ ...ITEM_VACIO }]);
  const [impuestoPct, setImpuestoPct] = useState(initial?.impuestoPct ?? config?.impuestoDefaultPct ?? 0);
  const [notas, setNotas] = useState(initial?.notas || '');
  const [politicas, setPoliticas] = useState(initial?.politicas ?? config?.politicasDefault ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cliente = clientesFacturables.find(c => `${c.tipo}:${c.id}` === clienteKey);
  const { subtotal, impuestoMonto, total } = calcularTotales(items, impuestoPct);

  const setItem = (idx, field, value) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  const addItem = () => setItems(prev => [...prev, { ...ITEM_VACIO }]);
  const removeItem = (idx) => setItems(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const guardar = async () => {
    if (!cliente) { setError('Elegí a quién le facturás.'); return; }
    const itemsValidos = items.filter(it => it.descripcion.trim() && Number(it.cantidad) > 0);
    if (!itemsValidos.length) { setError('Agregá al menos un ítem con descripción y cantidad.'); return; }
    setSaving(true); setError('');
    try {
      const totales = calcularTotales(itemsValidos, impuestoPct);
      await onGuardar({
        clienteTipo: cliente.tipo,
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        clienteRfc: cliente.rfc || '',
        clienteDireccion: cliente.direccion || '',
        clienteTelefono: cliente.telefono || '',
        clienteEmail: cliente.email || '',
        fecha,
        fechaVencimiento,
        numeroFactura: numeroFactura.trim() || undefined,
        items: itemsValidos.map(it => ({ descripcion: it.descripcion.trim(), cantidad: Number(it.cantidad), precioUnitario: Number(it.precioUnitario) || 0 })),
        impuestoPct: Number(impuestoPct) || 0,
        subtotal: totales.subtotal,
        impuestoMonto: totales.impuestoMonto,
        total: totales.total,
        notas: notas.trim(),
        politicas: politicas.trim(),
        estado: initial?.estado || 'pendiente',
      });
    } catch (err) {
      setError(err.message || 'No se pudo guardar la factura.');
    } finally { setSaving(false); }
  };

  return (
    <div className="rounded-[16px] border p-6 space-y-5" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-bold" style={{ color: 'var(--pp-text)' }}>{initial ? 'Editar factura' : 'Nueva factura'}</p>
        <button onClick={onCancelar} className="w-8 h-8 rounded-[9px] flex items-center justify-center hover:bg-[#1e1e1e] transition-colors" style={{ color: 'var(--pp-text3)' }}><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Facturar a">
          <select value={clienteKey} onChange={e => setClienteKey(e.target.value)} className={inputClass}>
            <option value="">Selecciona un cliente…</option>
            {talleres.length > 0 && (
              <optgroup label="Talleres">
                {talleres.map(t => <option key={`taller:${t.uid}`} value={`taller:${t.uid}`}>{t.nombre}</option>)}
              </optgroup>
            )}
            {empresasClientes.filter(e => e.facturacionHabilitada !== false).length > 0 && (
              <optgroup label="Empresas">
                {empresasClientes.filter(e => e.facturacionHabilitada !== false).map(e => <option key={`empresa:${e.id}`} value={`empresa:${e.id}`}>{e.nombre}</option>)}
              </optgroup>
            )}
          </select>
        </FormField>
        <FormField label="# de factura (opcional, se autogenera)">
          <input value={numeroFactura} onChange={e => setNumeroFactura(e.target.value)} placeholder="ej. INV-0001" className={`${inputClass} font-mono`} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Fecha">
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} onClick={e => { try { e.target.showPicker(); } catch (_) {} }} className={`${inputClass} cursor-pointer`} />
        </FormField>
        <FormField label="Fecha de vencimiento (opcional)">
          <input type="date" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} onClick={e => { try { e.target.showPicker(); } catch (_) {} }} className={`${inputClass} cursor-pointer`} />
        </FormField>
      </div>

      {/* Ítems */}
      <div>
        <p className="text-[12.5px] font-semibold mb-2" style={{ color: 'var(--pp-text2)' }}>Ítems a facturar</p>
        <div className="rounded-[12px] border overflow-hidden" style={{ borderColor: 'var(--pp-border2)' }}>
          <div className="grid gap-2 px-3 py-2" style={{ gridTemplateColumns: '1fr 80px 110px 110px 32px', background: 'var(--pp-surface)' }}>
            {['Descripción', 'Cant.', 'Precio unit.', 'Importe', ''].map(h => (
              <span key={h} className="text-[10px] font-bold uppercase" style={{ color: 'var(--pp-text3)', letterSpacing: '.05em' }}>{h}</span>
            ))}
          </div>
          {items.map((it, idx) => (
            <div key={idx} className="grid gap-2 items-center px-3 py-2" style={{ gridTemplateColumns: '1fr 80px 110px 110px 32px', borderTop: '1px solid var(--pp-border2)' }}>
              <input value={it.descripcion} onChange={e => setItem(idx, 'descripcion', e.target.value)} placeholder="ej. Instalación de bomper delantero" className="px-2 py-1.5 rounded-[8px] border text-[13px] outline-none focus:border-[#C6202B]" style={{ borderColor: 'var(--pp-border4)', background: 'var(--pp-input-bg)', color: 'var(--pp-text)' }} />
              <input type="number" min="0" step="1" value={it.cantidad} onChange={e => setItem(idx, 'cantidad', e.target.value)} className="px-2 py-1.5 rounded-[8px] border text-[13px] outline-none focus:border-[#C6202B]" style={{ borderColor: 'var(--pp-border4)', background: 'var(--pp-input-bg)', color: 'var(--pp-text)' }} />
              <input type="number" min="0" step="0.01" value={it.precioUnitario} onChange={e => setItem(idx, 'precioUnitario', e.target.value)} placeholder="0.00" className="px-2 py-1.5 rounded-[8px] border text-[13px] outline-none focus:border-[#C6202B]" style={{ borderColor: 'var(--pp-border4)', background: 'var(--pp-input-bg)', color: 'var(--pp-text)' }} />
              <span className="text-[12.5px] font-semibold text-right pr-1" style={{ color: 'var(--pp-text)' }}>{fmtCur((Number(it.cantidad) || 0) * (Number(it.precioUnitario) || 0))}</span>
              <button onClick={() => removeItem(idx)} className="w-7 h-7 rounded-[7px] flex items-center justify-center hover:bg-red-900/30 hover:text-red-400 transition-colors" style={{ color: 'var(--pp-text3)' }}><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        <button onClick={addItem} className="mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: 'var(--pp-text8)' }}>
          <Plus className="w-3.5 h-3.5" /> Agregar ítem
        </button>
      </div>

      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex-1 min-w-[220px] space-y-3">
          <FormField label="Impuesto (%)">
            <input type="number" min="0" max="100" step="0.01" value={impuestoPct} onChange={e => setImpuestoPct(e.target.value)} className={`${inputClass} w-32`} />
          </FormField>
          <FormField label="Notas (opcional)">
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} className={`${inputClass} resize-none`} />
          </FormField>
          <FormField label="Políticas / términos">
            <textarea value={politicas} onChange={e => setPoliticas(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
          </FormField>
        </div>
        <div className="w-full sm:w-64 rounded-[13px] p-4 space-y-1.5" style={{ background: 'var(--pp-surface)' }}>
          <div className="flex justify-between text-[13px]" style={{ color: 'var(--pp-text2)' }}><span>Subtotal</span><span>{fmtCur(subtotal)}</span></div>
          <div className="flex justify-between text-[13px]" style={{ color: 'var(--pp-text2)' }}><span>Impuesto</span><span>{fmtCur(impuestoMonto)}</span></div>
          <div className="flex justify-between text-[16px] font-extrabold pt-2" style={{ color: 'var(--pp-text)', borderTop: '1px solid var(--pp-border3)' }}><span>Total</span><span>{fmtCur(total)}</span></div>
        </div>
      </div>

      {error && <div className="flex items-center gap-2 text-[13px] px-3 py-2.5 rounded-[11px]" style={{ background: '#fdecec', color: '#dc2626' }}><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}

      <div className="flex gap-3">
        <button onClick={guardar} disabled={saving} className="flex-1 py-[12px] rounded-[11px] text-white font-bold text-[14px] hover:bg-[#8E1620] disabled:opacity-60" style={{ background: 'var(--pp-accent)' }}>
          {saving ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear factura'}
        </button>
        <button onClick={onCancelar} className="px-5 py-[12px] rounded-[11px] border text-[13.5px] font-semibold hover:bg-[#1e1e1e]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pantalla principal: Facturas profesionales (Invoice)                */
/* ------------------------------------------------------------------ */
export function AdminInvoices({ talleres, empresasClientes, facturasPro, facturacionConfig, onCrear, onActualizar, onEliminar, onActualizarConfig, readOnly = false }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [filtroCliente, setFiltroCliente] = useState('todos');
  const [saved, setSaved] = useState(false);

  const facturasFiltradas = useMemo(() => {
    if (filtroCliente === 'todos') return facturasPro;
    const [tipo, id] = filtroCliente.split(':');
    return facturasPro.filter(f => f.clienteTipo === tipo && f.clienteId === id);
  }, [facturasPro, filtroCliente]);

  const totals = facturasFiltradas.reduce((acc, f) => {
    if (f.estado === 'anulada') return acc;
    acc.total += Number(f.total || 0);
    if (f.estado === 'pagada') acc.cobrado += Number(f.total || 0);
    else acc.pendiente += Number(f.total || 0);
    return acc;
  }, { total: 0, cobrado: 0, pendiente: 0 });

  const clientesConFactura = useMemo(() => {
    const map = new Map();
    facturasPro.forEach(f => map.set(`${f.clienteTipo}:${f.clienteId}`, f.clienteNombre));
    return [...map.entries()];
  }, [facturasPro]);

  const handleCrear = async (data) => {
    await onCrear(data);
    setShowForm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleActualizar = async (data) => {
    await onActualizar(editing.id, data);
    setEditing(null);
  };

  const cambiarEstado = (f, estado) => onActualizar(f.id, { estado });

  const thCls = "text-left py-3 text-[10.5px] font-bold uppercase";
  const thSt = { color: 'var(--pp-text9)', letterSpacing: '.06em' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[15px] font-bold" style={{ color: 'var(--pp-text)' }}>Facturas profesionales</h2>
          <p className="text-[12.5px]" style={{ color: 'var(--pp-text2)' }}>Facturas itemizadas, imprimibles y en PDF, para talleres o cuentas Empresa — cualquier tipo de ítem.</p>
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <button onClick={() => setShowConfig(true)} className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold border transition-colors hover:bg-[#1e1e1e]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
              <Settings className="w-4 h-4" /> Configurar facturación
            </button>
          )}
          {!readOnly && !showForm && !editing && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold text-white hover:bg-[#8E1620]" style={{ background: 'var(--pp-accent)' }}>
              <Plus className="w-4 h-4" strokeWidth={2.2} /> Nueva factura
            </button>
          )}
        </div>
      </div>

      {!facturacionConfig?.nombreEmpresa && !readOnly && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-[11px] text-[13px] font-semibold" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> Configura el nombre de tu empresa antes de emitir tu primera factura para que aparezca en el membrete.
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-[11px] text-[13px] font-semibold" style={{ background: '#eafaf2', color: '#059669' }}>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Factura creada correctamente.
        </div>
      )}

      {showForm && (
        <FacturaForm talleres={talleres} empresasClientes={empresasClientes} config={facturacionConfig} onGuardar={handleCrear} onCancelar={() => setShowForm(false)} />
      )}
      {editing && (
        <FacturaForm talleres={talleres} empresasClientes={empresasClientes} config={facturacionConfig} initial={editing} onGuardar={handleActualizar} onCancelar={() => setEditing(null)} />
      )}

      {!showForm && !editing && (
        <>
          {clientesConFactura.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[12.5px] font-semibold" style={{ color: 'var(--pp-text2)' }}>Cliente:</span>
              <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} className={`${inputClass} w-auto`}>
                <option value="todos">Todos</option>
                {clientesConFactura.map(([key, nombre]) => <option key={key} value={key}>{nombre}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[
              { label: 'Total facturado', val: fmtCur(totals.total),      color: 'var(--pp-text)' },
              { label: 'Cobrado',         val: fmtCur(totals.cobrado),    color: '#34d399' },
              { label: 'Pendiente',       val: fmtCur(totals.pendiente),  color: totals.pendiente > 0 ? '#f59e0b' : '#34d399' },
            ].map(({ label, val, color }) => (
              <div key={label} className="rounded-[15px] p-3 sm:p-4 border min-w-0" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
                <p className="text-[10px] sm:text-[12px] font-medium mb-1 truncate" style={{ color: 'var(--pp-text2)' }}>{label}</p>
                <p className="text-[13px] sm:text-[22px] font-extrabold leading-none break-all" style={{ color }}>{val}</p>
              </div>
            ))}
          </div>

          {facturasFiltradas.length === 0 ? (
            <EmptyState text="Todavía no hay facturas profesionales. Usa &quot;+ Nueva factura&quot; para crear la primera." />
          ) : (
            <div className="rounded-[16px] border overflow-x-auto" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
              <table className="w-full" style={{ minWidth: 760 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--pp-border2)' }}>
                    <th className={`${thCls} pl-5 pr-2`} style={thSt}># Factura</th>
                    <th className={`${thCls} px-2`} style={thSt}>Cliente</th>
                    <th className={`${thCls} px-2 hidden sm:table-cell`} style={thSt}>Fecha</th>
                    <th className={`${thCls} px-2`} style={thSt}>Total</th>
                    <th className={`${thCls} px-2`} style={thSt}>Estado</th>
                    <th className={`${thCls} pr-4`} style={thSt}></th>
                  </tr>
                </thead>
                <tbody>
                  {facturasFiltradas.map(f => {
                    const cfg = ESTADO_CFG[f.estado] || ESTADO_CFG.pendiente;
                    return (
                      <tr key={f.id} style={{ borderTop: '1px solid var(--pp-border2)' }}>
                        <td className="py-3 pl-5 pr-2 font-mono font-semibold text-[12.5px]" style={{ color: 'var(--pp-text)' }}>{f.numeroFactura}</td>
                        <td className="py-3 px-2 text-[12.5px] truncate max-w-[220px]" style={{ color: 'var(--pp-text2)' }}>{f.clienteNombre}</td>
                        <td className="py-3 px-2 text-[12.5px] whitespace-nowrap hidden sm:table-cell" style={{ color: 'var(--pp-text2)' }}>{fmtDateDisp(f.fecha)}</td>
                        <td className="py-3 px-2 text-[12.5px] font-bold" style={{ color: 'var(--pp-text)' }}>{fmtCur(f.total)}</td>
                        <td className="py-3 px-2">
                          <span className="text-[10.5px] font-bold uppercase px-2 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        </td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => imprimirFactura(f, facturacionConfig)} title="Imprimir / PDF" className="w-7 h-7 rounded-[7px] flex items-center justify-center hover:bg-[#1e1e1e] transition-colors" style={{ color: 'var(--pp-text3)' }}><Printer className="w-3.5 h-3.5" /></button>
                            {!readOnly && (
                              <>
                                <button onClick={() => setEditing(f)} title="Editar" className="w-7 h-7 rounded-[7px] flex items-center justify-center hover:bg-[#1e1e1e] transition-colors" style={{ color: 'var(--pp-text3)' }}><Pencil className="w-3.5 h-3.5" /></button>
                                {f.estado === 'pendiente' && (
                                  <button onClick={() => cambiarEstado(f, 'pagada')} title="Marcar como pagada" className="w-7 h-7 rounded-[7px] flex items-center justify-center hover:bg-[rgba(16,185,129,0.12)] hover:text-[#10b981] transition-colors" style={{ color: 'var(--pp-text3)' }}><CheckCircle2 className="w-3.5 h-3.5" /></button>
                                )}
                                {f.estado === 'pagada' && (
                                  <button onClick={() => cambiarEstado(f, 'pendiente')} title="Marcar como pendiente" className="w-7 h-7 rounded-[7px] flex items-center justify-center hover:bg-[#1e1e1e] transition-colors" style={{ color: 'var(--pp-text3)' }}><RotateCcw className="w-3.5 h-3.5" /></button>
                                )}
                                {f.estado !== 'anulada' && (
                                  <button onClick={() => { if (window.confirm(`¿Anular la factura ${f.numeroFactura}? Queda registrada pero fuera de tus totales.`)) cambiarEstado(f, 'anulada'); }} title="Anular" className="w-7 h-7 rounded-[7px] flex items-center justify-center hover:bg-[#1e1e1e] transition-colors" style={{ color: 'var(--pp-text3)' }}><Ban className="w-3.5 h-3.5" /></button>
                                )}
                                <button onClick={() => { if (window.confirm(`¿Eliminar la factura ${f.numeroFactura}? Esta acción no se puede deshacer.`)) onEliminar(f.id); }} title="Eliminar" className="w-7 h-7 rounded-[7px] flex items-center justify-center hover:bg-red-900/30 hover:text-red-400 transition-colors" style={{ color: 'var(--pp-text3)' }}><Trash2 className="w-3.5 h-3.5" /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showConfig && (
        <ConfigFacturacionModal config={facturacionConfig} onGuardar={onActualizarConfig} onClose={() => setShowConfig(false)} />
      )}
    </div>
  );
}
