import { useState } from 'react';
import {
  CheckCircle2, Plus, Building2, Phone, X, ChevronRight, AlertCircle, Mail, Pencil
} from 'lucide-react';
import { Header } from '../shared/Header';
import { FormField } from '../shared/FormField';
import { inputClass } from '../../constants/styles';

const userTableCols = '1.3fr 0.85fr 1.3fr 56px';

export function TallerSubUsuarios({ tallerId, tallerEmail, usuarios, onCrear, onEliminar, onActualizar }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const miembros = usuarios.filter(u => u.tallerId === tallerId);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.password) return;
    setSaving(true); setError('');
    try {
      await onCrear(tallerId, { nombre: form.nombre.trim(), email: form.email.trim(), password: form.password });
      setForm({ nombre: '', email: '', password: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.message || 'No se pudo crear el usuario.');
    } finally { setSaving(false); }
  };

  const handleSaveEdit = async (uid) => {
    if (!editNombre.trim()) return;
    setSaving(true);
    try {
      await onActualizar(uid, { nombre: editNombre.trim() });
      setEditId(null);
    } finally { setSaving(false); }
  };

  return (
    <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--pp-border3)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase" style={{ color: 'var(--pp-text3)', letterSpacing: '.06em' }}>
          Usuarios ({miembros.length + 1})
        </span>
        <button onClick={() => { setShowForm(s => !s); setError(''); setEditId(null); }}
          className="flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-1 rounded-[7px] border transition-colors hover:bg-[rgba(59,130,246,0.08)]"
          style={{ color: '#3b82f6', borderColor: 'rgba(59,130,246,0.35)' }}>
          <Plus className="w-3 h-3" strokeWidth={2.5} /> Agregar
        </button>
      </div>

      <div className="rounded-[10px] border overflow-hidden" style={{ borderColor: 'var(--pp-border2)' }}>
        <div className="grid gap-2 px-2.5 py-1.5" style={{ gridTemplateColumns: userTableCols, background: 'var(--pp-surface)' }}>
          {['Nombre', 'Rol', 'Correo', ''].map(h => (
            <span key={h} className="text-[9.5px] font-bold uppercase truncate" style={{ color: 'var(--pp-text3)', letterSpacing: '.05em' }}>{h}</span>
          ))}
        </div>

        {/* Cuenta principal */}
        <div className="grid gap-2 items-center px-2.5 py-2" style={{ gridTemplateColumns: userTableCols, borderTop: '1px solid var(--pp-border2)' }}>
          <span className="flex items-center gap-1.5 min-w-0 text-[12px] font-semibold truncate" style={{ color: 'var(--pp-text)' }}>
            <span className="w-5 h-5 rounded-[6px] flex items-center justify-center text-[9.5px] font-bold flex-shrink-0" style={{ background: 'linear-gradient(150deg, #f97316, #ea580c)', color: '#fff' }}>P</span>
            Cuenta principal
          </span>
          <span className="text-[10.5px] font-semibold truncate" style={{ color: 'var(--pp-text8)' }}>Admin taller</span>
          <span className="text-[11px] truncate" style={{ color: 'var(--pp-text3)' }}>{tallerEmail || '—'}</span>
          <span />
        </div>

        {/* Sub-usuarios */}
        {miembros.map(u => (
          editId === u.uid ? (
            /* Edición inline */
            <div key={u.uid} className="flex items-center gap-2 px-2.5 py-2" style={{ borderTop: '1px solid var(--pp-border2)' }}>
              <input
                value={editNombre}
                onChange={e => setEditNombre(e.target.value)}
                className="flex-1 min-w-0 text-[12px] px-2 py-1 rounded-[7px] border outline-none focus:border-[#a0a0a0]"
                style={{ background: 'var(--pp-input-bg)', borderColor: 'var(--pp-border4)', color: 'var(--pp-text)' }}
                autoFocus
              />
              <button onClick={() => handleSaveEdit(u.uid)} disabled={saving} className="w-6 h-6 rounded-[6px] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ background: '#10b981' }}>✓</button>
              <button onClick={() => setEditId(null)} className="w-6 h-6 rounded-[6px] flex items-center justify-center border text-[11px] flex-shrink-0" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>✕</button>
            </div>
          ) : (
            <div key={u.uid} className="grid gap-2 items-center px-2.5 py-2" style={{ gridTemplateColumns: userTableCols, borderTop: '1px solid var(--pp-border2)' }}>
              <span className="flex items-center gap-1.5 min-w-0 text-[12px] font-semibold truncate" style={{ color: 'var(--pp-text)' }}>
                <span className="w-5 h-5 rounded-[6px] flex items-center justify-center text-[9.5px] font-bold flex-shrink-0" style={{ background: 'var(--pp-surface)', color: 'var(--pp-text2)' }}>
                  {(u.nombre || u.email || '?')[0].toUpperCase()}
                </span>
                {u.nombre}
              </span>
              <span className="text-[10.5px] font-semibold truncate" style={{ color: 'var(--pp-text3)' }}>Miembro</span>
              <span className="text-[11px] truncate" style={{ color: 'var(--pp-text3)' }}>{u.email}</span>
              <span className="flex items-center gap-1 justify-end flex-shrink-0">
                <button onClick={() => { setEditId(u.uid); setEditNombre(u.nombre || ''); }}
                  className="w-6 h-6 rounded-[6px] flex items-center justify-center hover:bg-[#2a2a2a] transition-colors flex-shrink-0" style={{ color: 'var(--pp-text3)' }}>
                  <Pencil className="w-3 h-3" />
                </button>
                <button onClick={() => { if (window.confirm(`¿Eliminar a ${u.nombre}?`)) onEliminar(u.uid); }}
                  className="w-6 h-6 rounded-[6px] flex items-center justify-center hover:bg-red-900/30 hover:text-red-400 transition-colors flex-shrink-0" style={{ color: 'var(--pp-text3)' }}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )
        ))}
      </div>

      {/* Formulario nuevo sub-usuario */}
      {showForm && (
        <form onSubmit={handleCreate} className="mt-2 p-3 rounded-[11px] space-y-2 border" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
          <p className="text-[11.5px] font-bold" style={{ color: 'var(--pp-text)' }}>Nuevo usuario</p>
          <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre" className={inputClass} required />
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Correo electrónico" className={inputClass} required />
          <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Contraseña (mín. 6)" className={inputClass} required minLength={6} />
          {error && <p className="text-[12px] px-3 py-2 rounded-[9px]" style={{ background: '#fdecec', color: '#dc2626' }}>{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-[9px] text-white text-[12.5px] font-bold hover:brightness-105 disabled:opacity-60" style={{ background: 'var(--pp-accent)' }}>
              {saving ? 'Creando…' : 'Crear usuario'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="px-3 py-2 rounded-[9px] border text-[12.5px] font-semibold hover:bg-[#1e1e1e]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>✕</button>
          </div>
        </form>
      )}
    </div>
  );
}

export function AdminTalleres({ talleres, pedidos, tallerUsuarios, onVerPedidos, onCreateTaller, onDeleteTaller, onUpdateTaller, onCrearSubUsuario, onEliminarSubUsuario, onActualizarSubUsuario }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', contacto: '', telefono: '', email: '', usuario: '', password: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const handleEditChange = (field, value) => setEditForm(f => ({ ...f, [field]: value }));

  const startEdit = (t) => {
    setEditingId(t.uid);
    setEditForm({ nombre: t.nombre || '', contacto: t.contacto || '', telefono: t.telefono || '', email: t.email || '', usuario: t.usuario || '' });
    setEditError('');
  };

  const handleUpdate = async () => {
    if (!editForm.nombre.trim()) return;
    setEditSaving(true);
    setEditError('');
    try {
      await onUpdateTaller(editingId, editForm);
      setEditingId(null);
    } catch (err) {
      setEditError('Error al actualizar: ' + err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const generarPassword = () => {
    handleChange('password', Math.random().toString(36).slice(-8));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    const usuario = form.usuario.trim().toLowerCase();
    if (usuario && talleres.some(t => t.usuario?.toLowerCase() === usuario)) {
      setError('Ese usuario ya existe, elige otro.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onCreateTaller({ ...form, usuario });
      setForm({ nombre: '', contacto: '', telefono: '', email: '', usuario: '', password: '' });
      setShowForm(false);
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch (err) {
      setError(err.message || 'Error al crear el taller.');
    } finally {
      setSaving(false);
    }
  };

  const initials = (n) => (n || '').split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold" style={{ color: 'var(--pp-text)' }}>Talleres registrados</h2>
          <p className="text-[12.5px]" style={{ color: 'var(--pp-text2)' }}>{talleres.length} taller{talleres.length !== 1 ? 'es' : ''} en el sistema</p>
        </div>
        <button
          onClick={() => { setShowForm(s => !s); setError(''); }}
          className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-[#707070]"
          style={{ background: 'var(--pp-accent)' }}
        >
          <Plus className="w-4 h-4" strokeWidth={2.2} /> Nuevo taller
        </button>
      </div>

      {done && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-[11px] text-[13px] font-semibold" style={{ background: '#eafaf2', color: '#059669' }}>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Taller registrado correctamente.
        </div>
      )}

      {/* Formulario nuevo taller */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-[16px] p-6 border space-y-4" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
          <p className="text-[14px] font-bold" style={{ color: 'var(--pp-text)' }}>Nuevo taller</p>
          <FormField label="Nombre del taller">
            <input value={form.nombre} onChange={e => handleChange('nombre', e.target.value)} placeholder="ej. Hojalatería y Pintura Martínez" className={inputClass} required />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Contacto">
              <input value={form.contacto} onChange={e => handleChange('contacto', e.target.value)} placeholder="Nombre del encargado" className={inputClass} />
            </FormField>
            <FormField label="Teléfono">
              <input value={form.telefono} onChange={e => handleChange('telefono', e.target.value)} placeholder="555-000-0000" className={inputClass} />
            </FormField>
          </div>
          <FormField label="Correo electrónico">
            <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="ej. taller@correo.com" className={inputClass} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Usuario (opcional)">
              <input value={form.usuario} onChange={e => handleChange('usuario', e.target.value)} placeholder="ej. martinez" className={`${inputClass} font-mono`} />
            </FormField>
            <FormField label="Contraseña (opcional)">
              <div className="flex gap-2">
                <input value={form.password} onChange={e => handleChange('password', e.target.value)} placeholder="••••••" className={`${inputClass} font-mono`} />
                <button type="button" onClick={generarPassword} className="px-3 rounded-[11px] border text-[12px] font-semibold whitespace-nowrap transition-colors hover:bg-[#1e1e1e]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
                  Generar
                </button>
              </div>
            </FormField>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-[13px] px-3 py-2.5 rounded-[11px]" style={{ background: '#fdecec', color: '#dc2626' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="flex-1 py-[11px] rounded-[11px] text-white font-bold text-[13.5px] transition-all hover:bg-[#707070] disabled:opacity-60" style={{ background: 'var(--pp-accent)' }}>
              {saving ? 'Creando…' : 'Crear taller'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="px-5 py-[11px] rounded-[11px] border text-[13.5px] font-semibold transition-colors hover:bg-[#1e1e1e]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Grid de talleres */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {talleres.map(t => {
          const pedidosTaller = pedidos.filter(p => p.tallerId === t.uid);
          const activos = pedidosTaller.filter(p => p.estado !== 'entregado').length;

          if (editingId === t.uid) {
            return (
              <div key={t.uid} className="rounded-[15px] border p-5 space-y-3" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-accent)', boxShadow: '0 0 0 3px var(--pp-active-bg)' }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[13.5px] font-bold" style={{ color: 'var(--pp-text)' }}>Editar taller</p>
                  <button onClick={() => setEditingId(null)} className="w-7 h-7 rounded-[7px] flex items-center justify-center hover:bg-[#1e1e1e] transition-colors" style={{ color: 'var(--pp-text3)' }}><X className="w-4 h-4" /></button>
                </div>
                <FormField label="Nombre"><input value={editForm.nombre} onChange={e => handleEditChange('nombre', e.target.value)} className={inputClass} /></FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Contacto"><input value={editForm.contacto} onChange={e => handleEditChange('contacto', e.target.value)} className={inputClass} /></FormField>
                  <FormField label="Teléfono"><input value={editForm.telefono} onChange={e => handleEditChange('telefono', e.target.value)} className={inputClass} /></FormField>
                </div>
                <FormField label="Correo"><input type="email" value={editForm.email} onChange={e => handleEditChange('email', e.target.value)} className={inputClass} /></FormField>
                <FormField label="Usuario"><input value={editForm.usuario} onChange={e => handleEditChange('usuario', e.target.value)} className={`${inputClass} font-mono`} /></FormField>
                {editError && <div className="flex items-center gap-2 text-[13px] px-3 py-2 rounded-[11px]" style={{ background: '#fdecec', color: '#dc2626' }}><AlertCircle className="w-4 h-4 flex-shrink-0" />{editError}</div>}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleUpdate} disabled={editSaving} className="flex-1 py-[10px] rounded-[11px] text-white text-[13px] font-bold transition-all hover:bg-[#707070] disabled:opacity-60" style={{ background: 'var(--pp-accent)' }}>
                    {editSaving ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button onClick={() => setEditingId(null)} className="px-4 py-[10px] rounded-[11px] border text-[13px] font-semibold transition-colors hover:bg-[#1e1e1e]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={t.uid} className="rounded-[15px] border p-[18px]" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
              {/* Cabecera */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[15px] font-extrabold flex-shrink-0" style={{ background: 'var(--pp-surface)', color: 'var(--pp-text2)' }}>
                  {initials(t.nombre)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-bold truncate" style={{ color: 'var(--pp-text)' }}>{t.nombre}</h3>
                  <p className="text-[12px]" style={{ color: 'var(--pp-text2)' }}>{t.contacto}</p>
                </div>
              </div>

              {/* Datos de contacto */}
              <div className="space-y-1.5 mb-4">
                {t.telefono && (
                  <p className="flex items-center gap-2 text-[12.5px]" style={{ color: 'var(--pp-text2)' }}>
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--pp-text3)' }} />{t.telefono}
                  </p>
                )}
                {t.email && (
                  <p className="flex items-center gap-2 text-[12.5px] truncate" style={{ color: 'var(--pp-text2)' }}>
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--pp-text3)' }} />{t.email}
                  </p>
                )}
              </div>

              {/* Pie */}
              <div className="flex flex-col gap-2 pt-3" style={{ borderTop: '1px dashed var(--pp-border)' }}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11.5px] truncate" style={{ color: 'var(--pp-text2)' }}>
                    Usuario: <span className="font-mono font-semibold" style={{ color: 'var(--pp-text2)' }}>{t.usuario || '—'}</span>
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-[7px] whitespace-nowrap flex-shrink-0" style={{ background: activos > 0 ? 'rgba(59,130,246,0.12)' : 'var(--pp-card)', color: activos > 0 ? '#3b82f6' : 'var(--pp-text3)' }}>
                    {activos} pedido{activos !== 1 ? 's' : ''} activo{activos !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => onVerPedidos(t.uid)} className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-[12px] font-bold transition-colors hover:bg-[#1e1e1e] mr-auto" style={{ color: 'var(--pp-text)' }}>
                    Ver <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => startEdit(t)} className="w-7 h-7 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[#1e1e1e] hover:text-[#a0a0a0]" style={{ color: 'var(--pp-text3)' }} title="Editar">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { if (window.confirm(`¿Eliminar el taller "${t.nombre}"? Esta acción no se puede deshacer.`)) onDeleteTaller(t.uid); }} className="w-7 h-7 rounded-[8px] flex items-center justify-center transition-colors hover:bg-red-900/30 hover:text-red-400" style={{ color: 'var(--pp-text3)' }} title="Eliminar">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sub-usuarios del taller */}
              <TallerSubUsuarios
                tallerId={t.uid}
                tallerEmail={t.email}
                usuarios={tallerUsuarios}
                onCrear={onCrearSubUsuario}
                onEliminar={onEliminarSubUsuario}
                onActualizar={onActualizarSubUsuario}
              />
            </div>
          );
        })}
      </div>

      {talleres.length === 0 && !showForm && (
        <div className="text-center py-16" style={{ color: 'var(--pp-text9)' }}>
          <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No hay talleres registrados aún.</p>
        </div>
      )}
    </div>
  );
}
