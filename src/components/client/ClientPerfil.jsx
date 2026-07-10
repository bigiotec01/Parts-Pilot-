import { useState } from 'react';
import {
  CheckCircle2
} from 'lucide-react';
import { APP_VERSION } from '../../constants/app';
import { FormField } from '../shared/FormField';
import { inputClass } from '../../constants/styles';

export function ClientPerfil({ taller, onUpdate, isSubUser = false }) {
  const [form, setForm] = useState({ nombre: taller.nombre || '', contacto: taller.contacto || '', telefono: taller.telefono || '', email: taller.email || '' });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await onUpdate(form);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    } finally { setSaving(false); }
  };

  const initials = (n) => (n || '').split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'T';

  return (
    <div className="flex flex-col items-center py-4">
      {/* Avatar */}
      <div className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center text-[24px] font-extrabold mb-3" style={{ background: 'var(--pp-surface)', color: 'var(--pp-text2)' }}>
        {initials(taller.nombre)}
      </div>
      <h2 className="text-[17px] font-bold mb-0.5" style={{ color: 'var(--pp-text)' }}>{taller.nombre || 'Mi taller'}</h2>
      <p className="text-[13px] mb-6" style={{ color: 'var(--pp-text2)' }}>{taller.contacto || ''}</p>

      <div className="w-full max-w-md">
        {done && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-[11px] text-[13px] font-semibold" style={{ background: '#eafaf2', color: '#059669' }}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Cambios guardados.
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-[16px] p-[18px] space-y-4 border" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
          {isSubUser ? (
            /* Sub-usuario: solo edita su propio nombre */
            <>
              <div className="px-3 py-2.5 rounded-[11px] text-[12.5px]" style={{ background: 'var(--pp-card)', color: 'var(--pp-text2)' }}>
                Eres usuario de <strong style={{ color: 'var(--pp-text)' }}>{taller.nombre}</strong>. Solo puedes editar tu nombre.
              </div>
              <FormField label="Tu nombre">
                <input value={form.contacto} onChange={e => set('contacto', e.target.value)} className={inputClass} required />
              </FormField>
            </>
          ) : (
            /* Cuenta principal: edita todos los datos del taller */
            <>
              <FormField label="Nombre del taller"><input value={form.nombre} onChange={e => set('nombre', e.target.value)} className={inputClass} required /></FormField>
              <FormField label="Contacto"><input value={form.contacto} onChange={e => set('contacto', e.target.value)} className={inputClass} /></FormField>
              <FormField label="Teléfono"><input value={form.telefono} onChange={e => set('telefono', e.target.value)} className={inputClass} /></FormField>
              <FormField label="Correo electrónico"><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputClass} /></FormField>
            </>
          )}
          {error && <div className="text-[13px] px-3 py-2.5 rounded-[11px]" style={{ background: '#fdecec', color: '#dc2626' }}>{error}</div>}
          <button type="submit" disabled={saving} className="w-full py-[13px] rounded-[11px] text-white font-bold text-[14px] transition-all hover:bg-[#707070] disabled:opacity-60" style={{ background: 'var(--pp-accent)' }}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
        <p className="text-center mt-4 text-[10px]" style={{ color: 'var(--pp-text5)' }}>Parts Pilot v{APP_VERSION}</p>
      </div>
    </div>
  );
}
