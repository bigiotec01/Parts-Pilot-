import { useState } from 'react';
import {
  CheckCircle2, FileText, X, AlertCircle, Send, Paperclip
} from 'lucide-react';
import { FormField } from '../shared/FormField';
import { inputClass } from '../../constants/styles';

export function AdminNuevaCotizacion({ talleres, onCreate }) {
  const [form, setForm] = useState({ tallerId: talleres[0]?.uid ?? '', vehiculo: '', notas: '' });
  const [numeroPO, setNumeroPO] = useState('');
  const [numeroOrden, setNumeroOrden] = useState('');
  const [fechaPersonalizada, setFechaPersonalizada] = useState('');
  const [notasEstimado, setNotasEstimado] = useState('');
  const [archivosEstimado, setArchivosEstimado] = useState([]);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleFile = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setArchivosEstimado(prev => [...prev, ...files.map(file => ({ name: file.name, type: file.type, url: URL.createObjectURL(file), file }))]);
    e.target.value = '';
  };

  const handleRemoveFile = (idx) => setArchivosEstimado(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await onCreate({ ...form, numeroPO: numeroPO.trim(), numeroOrden: numeroOrden.trim(), fechaPersonalizada, notasEstimado, archivosEstimado });
      setForm({ tallerId: talleres[0]?.uid ?? '', vehiculo: '', notas: '' });
      setNumeroPO('');
      setNumeroOrden('');
      setFechaPersonalizada('');
      setNotasEstimado('');
      setArchivosEstimado([]);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      setError('Error al crear: ' + (err.message || err.code));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="font-semibold mb-1 text-lg" style={{ color: 'var(--pp-text)' }}>Nueva cotización</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--pp-text2)' }}>Crea una cotización con estimado incluido. Aparecerá en el portal del taller para que la acepte o rechace.</p>
      {done && (
        <div className="mb-4 text-sm text-emerald-400 bg-emerald-900/20 px-3 py-2 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Cotización creada y enviada al taller.
        </div>
      )}
      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
        <FormField label="Taller">
          <select value={form.tallerId} onChange={e => handleChange('tallerId', e.target.value)} className={inputClass} required>
            {talleres.map(t => <option key={t.uid} value={t.uid}>{t.nombre}</option>)}
          </select>
        </FormField>
        <FormField label="Vehículo">
          <input value={form.vehiculo} onChange={e => handleChange('vehiculo', e.target.value)} placeholder="ej. Toyota Corolla 2020" className={inputClass} required />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="No. PO (opcional)">
            <input value={numeroPO} onChange={e => setNumeroPO(e.target.value)} placeholder="ej. 48213" className={inputClass} />
          </FormField>
          <FormField label="No. Orden (opcional)">
            <input value={numeroOrden} onChange={e => setNumeroOrden(e.target.value)} placeholder="ej. T-7890" className={inputClass} />
          </FormField>
        </div>
        <FormField label="Notas de la cotización">
          <textarea value={notasEstimado} onChange={e => setNotasEstimado(e.target.value)} rows={3} placeholder="Precio, tiempo de entrega, condiciones..." className={`${inputClass} resize-none`} />
        </FormField>
        <FormField label="PDF del estimado (opcional)">
          <div className="space-y-2">
            {archivosEstimado.map((f, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 border" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
                <a href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm truncate hover:underline" style={{ color: 'var(--pp-text)' }}>
                  <FileText className="w-4 h-4 flex-shrink-0" /><span className="truncate">{f.name}</span>
                </a>
                <button type="button" onClick={() => handleRemoveFile(i)} style={{ color: 'var(--pp-text3)' }} className="hover:text-red-400 flex-shrink-0"><X className="w-4 h-4" /></button>
              </div>
            ))}
            <label className="flex items-center justify-center gap-2 border border-dashed rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors hover:border-[#a0a0a0]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
              <Paperclip className="w-4 h-4" /> {archivosEstimado.length ? 'Adjuntar otro PDF' : 'Adjuntar PDF'}
              <input type="file" accept="application/pdf" multiple onChange={handleFile} className="hidden" />
            </label>
          </div>
        </FormField>
        <FormField label="Notas internas (opcional)">
          <textarea value={form.notas} onChange={e => handleChange('notas', e.target.value)} rows={2} placeholder="Observaciones adicionales..." className={`${inputClass} resize-none`} />
        </FormField>
        <FormField label="Fecha del pedido (opcional)">
          <input type="date" value={fechaPersonalizada} onChange={e => setFechaPersonalizada(e.target.value)} className={inputClass} />
          <p className="text-xs mt-1" style={{ color: 'var(--pp-text3)' }}>Vacío = fecha de hoy. Útil para importar órdenes antiguas.</p>
        </FormField>
        <button type="submit" disabled={sending} className="w-full disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 hover:bg-[#707070]" style={{ background: 'var(--pp-accent)' }}>
          <Send className="w-4 h-4" /> {sending ? 'Creando…' : 'Crear y enviar cotización'}
        </button>
      </form>
    </div>
  );
}
