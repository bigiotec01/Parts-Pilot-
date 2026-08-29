import { useState } from 'react';
import {
  CheckCircle2, Plus, Building2, Phone, Mail, X, AlertCircle, Pencil, Trash2, MapPin, Hash
} from 'lucide-react';
import { FormField } from '../shared/FormField';
import { EmptyState } from '../shared/FormField';
import { inputClass } from '../../constants/styles';

const FORM_VACIO = { nombre: '', rfc: '', contacto: '', telefono: '', email: '', direccion: '', notas: '', facturacionHabilitada: true };

/* ------------------------------------------------------------------ */
/*  Cuentas Empresa: clientes de facturación que no son Taller — no      */
/*  inician sesión, son solo un registro para poder facturarles (ver     */
/*  la sección Facturas para generar las facturas de cada una).          */
/* ------------------------------------------------------------------ */
export function AdminEmpresas({ empresasClientes, onCrear, onActualizar, onEliminar, readOnly = false }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setSaving(true); setError('');
    try {
      await onCrear({ ...form, nombre: form.nombre.trim() });
      setForm(FORM_VACIO);
      setShowForm(false);
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch (err) {
      setError(err.message || 'No se pudo crear la empresa.');
    } finally { setSaving(false); }
  };

  const startEdit = (e) => {
    setEditingId(e.id);
    setEditForm({
      nombre: e.nombre || '', rfc: e.rfc || '', contacto: e.contacto || '', telefono: e.telefono || '',
      email: e.email || '', direccion: e.direccion || '', notas: e.notas || '',
      facturacionHabilitada: e.facturacionHabilitada !== false,
    });
    setEditError('');
  };

  const handleUpdate = async () => {
    if (!editForm.nombre.trim()) return;
    setEditSaving(true); setEditError('');
    try {
      await onActualizar(editingId, { ...editForm, nombre: editForm.nombre.trim() });
      setEditingId(null);
    } catch (err) {
      setEditError(err.message || 'No se pudo actualizar.');
    } finally { setEditSaving(false); }
  };

  const initials = (n) => (n || '').split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[15px] font-bold" style={{ color: 'var(--pp-text)' }}>Cuentas Empresa</h2>
          <p className="text-[12.5px]" style={{ color: 'var(--pp-text2)' }}>
            {empresasClientes.length} empresa{empresasClientes.length !== 1 ? 's' : ''} registrada{empresasClientes.length !== 1 ? 's' : ''} · clientes de facturación distintos de tus talleres
          </p>
        </div>
        {!readOnly && (
          <button
            onClick={() => { setShowForm(s => !s); setError(''); }}
            className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-[#8E1620]"
            style={{ background: 'var(--pp-accent)' }}
          >
            <Plus className="w-4 h-4" strokeWidth={2.2} /> Nueva empresa
          </button>
        )}
      </div>

      {done && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-[11px] text-[13px] font-semibold" style={{ background: '#eafaf2', color: '#059669' }}>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Empresa registrada correctamente.
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-[16px] p-6 border space-y-4" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
          <p className="text-[14px] font-bold" style={{ color: 'var(--pp-text)' }}>Nueva empresa</p>
          <FormField label="Nombre de la empresa">
            <input value={form.nombre} onChange={e => handleChange('nombre', e.target.value)} placeholder="ej. Distribuidora ACME S.A." className={inputClass} required />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="RFC / Tax ID">
              <input value={form.rfc} onChange={e => handleChange('rfc', e.target.value)} placeholder="ej. ACM010101AAA" className={`${inputClass} font-mono`} />
            </FormField>
            <FormField label="Contacto">
              <input value={form.contacto} onChange={e => handleChange('contacto', e.target.value)} placeholder="Nombre de quien recibe la factura" className={inputClass} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Teléfono">
              <input value={form.telefono} onChange={e => handleChange('telefono', e.target.value)} placeholder="555-000-0000" className={inputClass} />
            </FormField>
            <FormField label="Correo electrónico">
              <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="ej. facturacion@empresa.com" className={inputClass} />
            </FormField>
          </div>
          <FormField label="Dirección de facturación">
            <input value={form.direccion} onChange={e => handleChange('direccion', e.target.value)} placeholder="Calle, número, ciudad, CP" className={inputClass} />
          </FormField>
          <FormField label="Notas (opcional)">
            <textarea value={form.notas} onChange={e => handleChange('notas', e.target.value)} rows={2} placeholder="Condiciones especiales, referencia interna…" className={`${inputClass} resize-none`} />
          </FormField>
          <div className="flex items-center justify-between rounded-[11px] px-4 py-3" style={{ background: 'var(--pp-active-bg)', border: '1px solid var(--pp-active-border)' }}>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--pp-text)' }}>Facturación activa</p>
              <p className="text-[11.5px]" style={{ color: 'var(--pp-text3)' }}>Si está apagada, esta empresa no aparece como opción al crear una factura.</p>
            </div>
            <button type="button" onClick={() => handleChange('facturacionHabilitada', !form.facturacionHabilitada)}
              className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors"
              style={{ background: form.facturacionHabilitada ? 'var(--pp-accent)' : '#9297A3', boxShadow: form.facturacionHabilitada ? 'none' : 'inset 0 0 0 1px rgba(0,0,0,0.08)' }}>
              <span className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: form.facturacionHabilitada ? 'translateX(20px)' : 'translateX(0)' }} />
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-[13px] px-3 py-2.5 rounded-[11px]" style={{ background: '#fdecec', color: '#dc2626' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="flex-1 py-[11px] rounded-[11px] text-white font-bold text-[13.5px] transition-all hover:bg-[#8E1620] disabled:opacity-60" style={{ background: 'var(--pp-accent)' }}>
              {saving ? 'Creando…' : 'Crear empresa'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="px-5 py-[11px] rounded-[11px] border text-[13.5px] font-semibold transition-colors hover:bg-[#1e1e1e]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {empresasClientes.length === 0 && !showForm ? (
        <EmptyState text="Todavía no hay cuentas Empresa. Usa &quot;+ Nueva empresa&quot; para agregar la primera." />
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {empresasClientes.map(emp => {
            if (editingId === emp.id) {
              return (
                <div key={emp.id} className="rounded-[15px] border p-5 space-y-3" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-accent)', boxShadow: '0 0 0 3px var(--pp-active-bg)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[13.5px] font-bold" style={{ color: 'var(--pp-text)' }}>Editar empresa</p>
                    <button onClick={() => setEditingId(null)} className="w-7 h-7 rounded-[7px] flex items-center justify-center hover:bg-[#1e1e1e] transition-colors" style={{ color: 'var(--pp-text3)' }}><X className="w-4 h-4" /></button>
                  </div>
                  <FormField label="Nombre"><input value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} className={inputClass} /></FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="RFC / Tax ID"><input value={editForm.rfc} onChange={e => setEditForm(f => ({ ...f, rfc: e.target.value }))} className={`${inputClass} font-mono`} /></FormField>
                    <FormField label="Contacto"><input value={editForm.contacto} onChange={e => setEditForm(f => ({ ...f, contacto: e.target.value }))} className={inputClass} /></FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Teléfono"><input value={editForm.telefono} onChange={e => setEditForm(f => ({ ...f, telefono: e.target.value }))} className={inputClass} /></FormField>
                    <FormField label="Correo"><input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className={inputClass} /></FormField>
                  </div>
                  <FormField label="Dirección"><input value={editForm.direccion} onChange={e => setEditForm(f => ({ ...f, direccion: e.target.value }))} className={inputClass} /></FormField>
                  <FormField label="Notas"><textarea value={editForm.notas} onChange={e => setEditForm(f => ({ ...f, notas: e.target.value }))} rows={2} className={`${inputClass} resize-none`} /></FormField>
                  <div className="flex items-center justify-between rounded-[11px] px-4 py-3" style={{ background: 'var(--pp-active-bg)', border: '1px solid var(--pp-active-border)' }}>
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--pp-text)' }}>Facturación activa</span>
                    <button type="button" onClick={() => setEditForm(f => ({ ...f, facturacionHabilitada: !f.facturacionHabilitada }))}
                      className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors"
                      style={{ background: editForm.facturacionHabilitada ? 'var(--pp-accent)' : '#9297A3', boxShadow: editForm.facturacionHabilitada ? 'none' : 'inset 0 0 0 1px rgba(0,0,0,0.08)' }}>
                      <span className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: editForm.facturacionHabilitada ? 'translateX(20px)' : 'translateX(0)' }} />
                    </button>
                  </div>
                  {editError && <div className="flex items-center gap-2 text-[13px] px-3 py-2 rounded-[11px]" style={{ background: '#fdecec', color: '#dc2626' }}><AlertCircle className="w-4 h-4 flex-shrink-0" />{editError}</div>}
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleUpdate} disabled={editSaving} className="flex-1 py-[10px] rounded-[11px] text-white text-[13px] font-bold transition-all hover:bg-[#8E1620] disabled:opacity-60" style={{ background: 'var(--pp-accent)' }}>
                      {editSaving ? 'Guardando…' : 'Guardar'}
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-[10px] rounded-[11px] border text-[13px] font-semibold transition-colors hover:bg-[#1e1e1e]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              );
            }

            const activa = emp.facturacionHabilitada !== false;

            return (
              <div key={emp.id} className="rounded-[18px] border p-5" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-[11px] flex items-center justify-center font-bold text-[14px] flex-shrink-0" style={{ background: 'var(--pp-surface)', color: 'var(--pp-text7)' }}>
                    {initials(emp.nombre)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-bold truncate" style={{ color: 'var(--pp-text)' }}>{emp.nombre}</p>
                    {emp.contacto && <p className="text-[12px] truncate" style={{ color: 'var(--pp-text2)' }}>{emp.contacto}</p>}
                  </div>
                  <span className="text-[10.5px] font-bold uppercase px-2 py-1 rounded-full flex-shrink-0" style={activa
                    ? { background: 'rgba(16,185,129,0.12)', color: '#10b981' }
                    : { background: 'rgba(239,68,68,0.10)', color: '#ef4444' }}>
                    {activa ? 'Factura' : 'Inactiva'}
                  </span>
                </div>

                <div className="space-y-1.5 mb-4">
                  {emp.rfc && <p className="flex items-center gap-1.5 text-[12px] font-mono" style={{ color: 'var(--pp-text3)' }}><Hash className="w-3.5 h-3.5 flex-shrink-0" />{emp.rfc}</p>}
                  {emp.telefono && <p className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--pp-text3)' }}><Phone className="w-3.5 h-3.5 flex-shrink-0" />{emp.telefono}</p>}
                  {emp.email && <p className="flex items-center gap-1.5 text-[12px] truncate" style={{ color: 'var(--pp-text3)' }}><Mail className="w-3.5 h-3.5 flex-shrink-0" />{emp.email}</p>}
                  {emp.direccion && <p className="flex items-start gap-1.5 text-[12px]" style={{ color: 'var(--pp-text3)' }}><MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /><span>{emp.direccion}</span></p>}
                </div>

                {!readOnly && (
                  <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--pp-border2)' }}>
                    <button onClick={() => startEdit(emp)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[9px] border text-[12.5px] font-semibold transition-colors hover:bg-[#1e1e1e]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button onClick={() => { if (window.confirm(`¿Eliminar la empresa "${emp.nombre}"? Sus facturas ya emitidas no se borran.`)) onEliminar(emp.id); }} className="w-9 h-9 rounded-[9px] flex items-center justify-center hover:bg-red-900/30 hover:text-red-400 transition-colors flex-shrink-0" style={{ color: 'var(--pp-text3)' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
