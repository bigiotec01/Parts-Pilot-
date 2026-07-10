import { useState } from 'react';
import {
  CheckCircle2
} from 'lucide-react';
import { FormField } from '../shared/FormField';
import { inputClass } from '../../constants/styles';

export function AdminNuevoPedido({ talleres, onCreate }) {
  const [form, setForm] = useState({ tallerId: talleres[0]?.uid ?? '', vehiculo: '', notas: '' });
  const [numeroPO, setNumeroPO] = useState('');
  const [numeroOrden, setNumeroOrden] = useState('');
  const [fechaPersonalizada, setFechaPersonalizada] = useState('');
  const [done, setDone] = useState(false);

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ ...form, numeroPO: numeroPO.trim(), numeroOrden: numeroOrden.trim(), fechaPersonalizada });
    setForm({ tallerId: talleres[0]?.uid ?? '', vehiculo: '', notas: '' });
    setNumeroPO('');
    setNumeroOrden('');
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
        <FormField label="Taller">
          <select value={form.tallerId} onChange={e => handleChange('tallerId', e.target.value)} className={inputClass} required>
            {talleres.map(t => <option key={t.uid} value={t.uid}>{t.nombre}</option>)}
          </select>
        </FormField>
        <FormField label="Vehículo">
          <input value={form.vehiculo} onChange={e => handleChange('vehiculo', e.target.value)} placeholder="ej. Toyota Corolla 2020" className={inputClass} />
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
        <FormField label="Fecha del pedido (opcional)">
          <input type="date" value={fechaPersonalizada} onChange={e => setFechaPersonalizada(e.target.value)} className={inputClass} />
          <p className="text-xs mt-1" style={{ color: 'var(--pp-text3)' }}>Vacío = fecha de hoy. Útil para importar órdenes antiguas.</p>
        </FormField>
        <button type="submit" className="w-full text-white font-semibold py-2.5 rounded-lg transition-colors hover:bg-[#707070]" style={{ background: 'var(--pp-accent)' }}>
          Registrar pedido
        </button>
      </form>
    </div>
  );
}
