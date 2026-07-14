import { useState } from 'react';
import {
  CheckCircle2, FileText, X, Paperclip
} from 'lucide-react';
import { FormField } from '../shared/FormField';
import { inputClass } from '../../constants/styles';

export function ClientNuevaSolicitud({ onCreate }) {
  const [form, setForm] = useState({ vehiculo: '', notas: '' });
  const [archivos, setArchivos] = useState([]);
  const [done, setDone] = useState(false);

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleFile = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setArchivos(prev => [...prev, ...files.map(file => ({ name: file.name, type: file.type, url: URL.createObjectURL(file), file }))]);
    e.target.value = '';
  };

  const handleRemoveFile = (idx) => setArchivos(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ ...form, archivos });
    setForm({ vehiculo: '', notas: '' });
    setArchivos([]);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <div className="max-w-lg">
      <h2 className="font-semibold mb-1 text-lg" style={{ color: 'var(--pp-text)' }}>Solicitar Estimado</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--pp-text2)' }}>El departamento de piezas recibirá tu solicitud y te enviará un estimado.</p>
      {done && (
        <div className="mb-4 text-sm text-emerald-400 bg-emerald-900/20 px-3 py-2 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Solicitud enviada correctamente.
        </div>
      )}
      <form onSubmit={handleSubmit} className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
        <FormField label="Vehículo">
          <input value={form.vehiculo} onChange={e => handleChange('vehiculo', e.target.value)} placeholder="ej. Honda Civic 2021" className={inputClass} required />
        </FormField>
        <FormField label="Notas adicionales">
          <textarea value={form.notas} onChange={e => handleChange('notas', e.target.value)} rows={3} placeholder="Color, urgencia, observaciones..." className={`${inputClass} resize-none`} />
        </FormField>
        <FormField label="Fotos o archivos (opcional)">
          <div className="space-y-2">
            {archivos.map((archivo, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 border" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
                {archivo.type?.startsWith('image/') ? (
                  <img src={archivo.url} alt={archivo.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <FileText className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--pp-text2)' }} />
                )}
                <span className="text-sm truncate flex-1" style={{ color: 'var(--pp-text)' }}>{archivo.name}</span>
                <button type="button" onClick={() => handleRemoveFile(i)} className="hover:text-red-400 flex-shrink-0" style={{ color: 'var(--pp-text3)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <label className="flex items-center justify-center gap-2 border border-dashed rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors hover:border-[#a0a0a0]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
              <Paperclip className="w-4 h-4" /> {archivos.length ? 'Adjuntar otra foto o PDF' : 'Adjuntar foto o PDF'}
              <input type="file" accept="image/*,application/pdf" multiple onChange={handleFile} className="hidden" />
            </label>
          </div>
        </FormField>
        <button type="submit" className="w-full text-white font-semibold py-2.5 rounded-lg transition-colors hover:bg-[#707070]" style={{ background: 'var(--pp-accent)' }}>
          Enviar solicitud
        </button>
      </form>
    </div>
  );
}
