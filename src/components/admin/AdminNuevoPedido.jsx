import { useState, useMemo } from 'react';
import {
  CheckCircle2, Plus
} from 'lucide-react';
import { FormField } from '../shared/FormField';
import { PiezasList } from '../shared/PiezasList';
import { inputClass } from '../../constants/styles';
import { agregarPiezaManual, ESTADOS_PIEZA } from '../../utils/piezasExcel';

const Required = () => <span style={{ color: '#ef4444' }}> *</span>;

export function AdminNuevoPedido({ talleres, pedidos = [], onCreate }) {
  const [form, setForm] = useState({ tallerId: talleres[0]?.uid ?? '', vehiculo: '', notas: '' });
  const [numeroPO, setNumeroPO] = useState('');
  const [numeroOrden, setNumeroOrden] = useState('');
  const [usarHoy, setUsarHoy] = useState(true);
  const [fechaPersonalizada, setFechaPersonalizada] = useState('');
  const [done, setDone] = useState(false);

  // Piezas en espera que se registran de una vez al crear el pedido (sin
  // tener que entrar después a subir el Excel o agregarlas a mano). Se
  // construyen igual que en "Piezas en espera" dentro del pedido — se van
  // acumulando localmente y se mandan junto con el resto del formulario.
  const [piezas, setPiezas] = useState([]);
  const [piezaNumero, setPiezaNumero] = useState('');
  const [piezaDescripcion, setPiezaDescripcion] = useState('');
  const [piezaEstado, setPiezaEstado] = useState('pendiente');
  const [piezaError, setPiezaError] = useState('');

  const handleAgregarPieza = () => {
    try {
      setPiezas(prev => agregarPiezaManual(prev, { numeroPieza: piezaNumero, descripcion: piezaDescripcion, estado: piezaEstado }));
      setPiezaNumero(''); setPiezaDescripcion(''); setPiezaEstado('pendiente'); setPiezaError('');
    } catch (err) {
      setPiezaError(err.message || 'No se pudo agregar la pieza.');
    }
  };
  const handleQuitarPieza = (index) => setPiezas(prev => prev.filter((_, i) => i !== index));
  const piezaEnterAgrega = (e) => { if (e.key === 'Enter') { e.preventDefault(); handleAgregarPieza(); } };

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  // Vehículos que ese taller ya ha registrado antes, para autocompletar.
  const vehiculosTaller = useMemo(() => {
    const set = new Set(
      pedidos.filter(p => p.tallerId === form.tallerId && p.vehiculo).map(p => p.vehiculo)
    );
    return [...set];
  }, [pedidos, form.tallerId]);

  const openDatePicker = (e) => { try { e.target.showPicker(); } catch (_) {} };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ ...form, numeroPO: numeroPO.trim(), numeroOrden: numeroOrden.trim(), fechaPersonalizada: usarHoy ? '' : fechaPersonalizada, piezas });
    setForm({ tallerId: talleres[0]?.uid ?? '', vehiculo: '', notas: '' });
    setNumeroPO('');
    setNumeroOrden('');
    setUsarHoy(true);
    setFechaPersonalizada('');
    setPiezas([]);
    setPiezaNumero(''); setPiezaDescripcion(''); setPiezaEstado('pendiente'); setPiezaError('');
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="font-semibold mb-1 text-lg" style={{ color: 'var(--pp-text)' }}>Registrar nuevo pedido</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--pp-text2)' }}>Crea el folio a nombre de un taller. Aparecerá de inmediato en su portal.</p>
      {done && (
        <div className="mb-4 text-sm text-emerald-400 bg-emerald-900/20 px-3 py-2 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Pedido registrado correctamente.
        </div>
      )}
      <form onSubmit={handleSubmit} className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
        <FormField label={<>Taller<Required /></>}>
          <select value={form.tallerId} onChange={e => handleChange('tallerId', e.target.value)} className={inputClass} required>
            {talleres.map(t => <option key={t.uid} value={t.uid}>{t.nombre}</option>)}
          </select>
        </FormField>
        <FormField label={<>Vehículo<Required /></>}>
          <input value={form.vehiculo} onChange={e => handleChange('vehiculo', e.target.value)} placeholder="ej. Toyota Corolla 2020" list="vehiculos-taller" className={inputClass} />
          {vehiculosTaller.length > 0 && (
            <datalist id="vehiculos-taller">
              {vehiculosTaller.map(v => <option key={v} value={v} />)}
            </datalist>
          )}
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="No. PO (opcional)">
            <input value={numeroPO} onChange={e => setNumeroPO(e.target.value)} placeholder="ej. 48213" className={inputClass} />
          </FormField>
          <FormField label="No. Orden (opcional)">
            <input value={numeroOrden} onChange={e => setNumeroOrden(e.target.value)} placeholder="ej. T-7890" className={inputClass} />
          </FormField>
        </div>
        <FormField label="Piezas en espera (opcional)">
          <p className="text-xs mb-2" style={{ color: 'var(--pp-text3)' }}>Regístralas de una vez si ya sabes cuáles vas a esperar — luego puedes subir el reporte del proveedor o editarlas desde el pedido.</p>
          {piezas.length > 0 && (
            <div className="mb-2.5">
              <PiezasList piezas={piezas} onDelete={(p, i) => handleQuitarPieza(i)} />
            </div>
          )}
          <div className="rounded-[10px] border p-2.5 space-y-2" style={{ borderColor: 'var(--pp-border4)' }}>
            <div className="grid grid-cols-2 gap-2">
              <input value={piezaNumero} onChange={e => setPiezaNumero(e.target.value)} onKeyDown={piezaEnterAgrega} placeholder="No. de pieza" className={inputClass} />
              <input value={piezaDescripcion} onChange={e => setPiezaDescripcion(e.target.value)} onKeyDown={piezaEnterAgrega} placeholder="Descripción (opcional)" className={inputClass} />
            </div>
            <div className="flex items-center gap-1 rounded-[10px] border p-1" style={{ borderColor: 'var(--pp-border4)' }}>
              {ESTADOS_PIEZA.map(op => (
                <button
                  key={op.value}
                  type="button"
                  onClick={() => setPiezaEstado(op.value)}
                  className="flex-1 px-2 py-1.5 rounded-[8px] text-[12px] font-semibold transition-colors"
                  style={{
                    background: piezaEstado === op.value ? 'var(--pp-accent)' : 'transparent',
                    color: piezaEstado === op.value ? '#fff' : 'var(--pp-text2)',
                  }}
                >
                  {op.label}
                </button>
              ))}
            </div>
            {piezaError && <p className="text-[12px]" style={{ color: '#dc2626' }}>{piezaError}</p>}
            <button
              type="button"
              onClick={handleAgregarPieza}
              disabled={!piezaNumero.trim()}
              className="w-full py-2 rounded-[9px] text-[12.5px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
              style={{ background: 'var(--pp-surface)', color: 'var(--pp-text2)' }}
            >
              <Plus className="w-3.5 h-3.5" /> Agregar pieza
            </button>
          </div>
        </FormField>
        <FormField label="Notas (opcional)">
          <textarea value={form.notas} onChange={e => handleChange('notas', e.target.value)} rows={3} placeholder="Detalles adicionales..." className={`${inputClass} resize-none`} />
        </FormField>
        <FormField label="Fecha del pedido">
          <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
            <input type="checkbox" checked={usarHoy} onChange={e => { setUsarHoy(e.target.checked); if (e.target.checked) setFechaPersonalizada(''); }} className="w-4 h-4" />
            <span className="text-[13px] font-medium" style={{ color: 'var(--pp-text)' }}>Usar fecha de hoy</span>
          </label>
          {!usarHoy && (
            <>
              <input type="date" value={fechaPersonalizada} onChange={e => setFechaPersonalizada(e.target.value)} onClick={openDatePicker} className={`${inputClass} cursor-pointer`} />
              <p className="text-xs mt-1" style={{ color: 'var(--pp-text3)' }}>Útil para importar órdenes antiguas.</p>
            </>
          )}
        </FormField>
        <button type="submit" className="w-full text-white font-semibold py-2.5 rounded-lg transition-colors hover:bg-[#8E1620]" style={{ background: 'var(--pp-accent)' }}>
          Registrar pedido
        </button>
      </form>
    </div>
  );
}
