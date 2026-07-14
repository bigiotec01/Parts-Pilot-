import { useState, useMemo } from 'react';
import {
  CheckCircle2
} from 'lucide-react';
import { FormField } from '../shared/FormField';
import { inputClass } from '../../constants/styles';

const Required = () => <span style={{ color: '#ef4444' }}> *</span>;

export function AdminNuevoPedido({ talleres, pedidos = [], onCreate }) {
  const [form, setForm] = useState({ tallerId: talleres[0]?.uid ?? '', vehiculo: '', notas: '' });
  const [numeroPO, setNumeroPO] = useState('');
  const [numeroOrden, setNumeroOrden] = useState('');
  const [usarHoy, setUsarHoy] = useState(true);
  const [fechaPersonalizada, setFechaPersonalizada] = useState('');
  const [done, setDone] = useState(false);

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
    onCreate({ ...form, numeroPO: numeroPO.trim(), numeroOrden: numeroOrden.trim(), fechaPersonalizada: usarHoy ? '' : fechaPersonalizada });
    setForm({ tallerId: talleres[0]?.uid ?? '', vehiculo: '', notas: '' });
    setNumeroPO('');
    setNumeroOrden('');
    setUsarHoy(true);
    setFechaPersonalizada('');
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
        <button type="submit" className="w-full text-white font-semibold py-2.5 rounded-lg transition-colors hover:bg-[#707070]" style={{ background: 'var(--pp-accent)' }}>
          Registrar pedido
        </button>
      </form>
    </div>
  );
}
