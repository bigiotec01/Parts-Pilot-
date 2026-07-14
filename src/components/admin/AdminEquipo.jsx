import { useState } from 'react';
import {
  CheckCircle2, Plus, X, AlertCircle, Pencil, Search
} from 'lucide-react';
import { FormField } from '../shared/FormField';
import { inputClass } from '../../constants/styles';
import { MODULOS_PERM } from '../../constants/permisos';
import { PermBadge, PermSelector } from '../shared/PermSelector';

const AVATAR_GRADIENTS = [
  'linear-gradient(160deg, #3b82f6, #2563eb)',
  'linear-gradient(160deg, #8b5cf6, #7c3aed)',
  'linear-gradient(160deg, #10b981, #059669)',
  'linear-gradient(160deg, #ec4899, #db2777)',
  'linear-gradient(160deg, #06b6d4, #0891b2)',
];

function avatarGradient(seed) {
  const s = String(seed || '');
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

export function AdminEquipo({ equipo, currentUid, perfil, onCrear, onActualizar, onEliminar }) {
  const DEFAULT_P = { pedidos: 'edit', estimados: 'edit', talleres: 'view', facturas: 'view', equipo: false, crearPedidos: true };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', permisos: { ...DEFAULT_P } });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editPermisos, setEditPermisos] = useState({});
  const [search, setSearch] = useState('');

  const isSuperadmin = (u) => !u.permisos;
  const equipoFiltrado = equipo.filter(u =>
    !search || `${u.nombre || ''} ${u.email || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.password) return;
    setSaving(true); setError('');
    try {
      await onCrear({ nombre: form.nombre.trim(), email: form.email.trim(), password: form.password, permisos: form.permisos });
      setForm({ nombre: '', email: '', password: '', permisos: { ...DEFAULT_P } });
      setShowForm(false);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use' ? 'Ese correo ya está registrado.' : 'Error: ' + err.message);
    } finally { setSaving(false); }
  };

  const [editNombreAdmin, setEditNombreAdmin] = useState('');
  const [editEmailAdmin, setEditEmailAdmin] = useState('');

  const startEdit = (u) => {
    setEditId(u.uid);
    setEditPermisos({ ...DEFAULT_P, ...u.permisos });
    setEditNombreAdmin(u.nombre || '');
    setEditEmailAdmin(u.email || '');
  };

  const saveEdit = async () => {
    setSaving(true);
    const isSup = !equipo.find(u => u.uid === editId)?.permisos;
    try {
      if (isSup) {
        await onActualizar(editId, { nombre: editNombreAdmin.trim(), email: editEmailAdmin.trim() });
      } else {
        await onActualizar(editId, { permisos: editPermisos });
      }
      setEditId(null);
    } finally { setSaving(false); }
  };

  const setP = (mod, val) => setForm(f => ({ ...f, permisos: { ...f.permisos, [mod]: val } }));
  const setEP = (mod, val) => setEditPermisos(p => ({ ...p, [mod]: val }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[15px] font-bold" style={{ color: 'var(--pp-text)' }}>Equipo</h2>
          <p className="text-[12.5px]" style={{ color: 'var(--pp-text2)' }}>Usuarios con acceso al panel de administración</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--pp-text3)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuario por nombre o email…" className={`${inputClass} pl-8 w-64`} />
          </div>
          <button onClick={() => { setShowForm(s => !s); setError(''); }}
            className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold text-white hover:bg-[#707070] flex-shrink-0"
            style={{ background: 'var(--pp-accent)' }}>
            <Plus className="w-4 h-4" strokeWidth={2.2} /> Agregar usuario
          </button>
        </div>
      </div>

      {done && <div className="flex items-center gap-2 px-4 py-3 rounded-[11px] text-[13px] font-semibold" style={{ background: '#eafaf2', color: '#059669' }}><CheckCircle2 className="w-4 h-4" /> Usuario creado correctamente.</div>}

      {/* Formulario nuevo usuario */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-[16px] p-6 border space-y-5" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
          <p className="text-[14px] font-bold" style={{ color: 'var(--pp-text)' }}>Nuevo usuario admin</p>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Nombre"><input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="ej. Carlos López" className={inputClass} required /></FormField>
            <FormField label="Correo electrónico"><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="carlos@correo.com" className={inputClass} required /></FormField>
            <FormField label="Contraseña"><input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="mínimo 6 caracteres" className={inputClass} required minLength={6} /></FormField>
          </div>

          {/* Permisos por módulo */}
          <div>
            <p className="text-[12.5px] font-semibold mb-3" style={{ color: 'var(--pp-text2)' }}>Permisos por módulo</p>
            <div className="space-y-3">
              {MODULOS_PERM.map(({ id, label }) => (
                <div key={id} className="flex items-center justify-between gap-4">
                  <span className="text-[13px] font-medium w-28" style={{ color: 'var(--pp-text)' }}>{label}</span>
                  <PermSelector value={form.permisos[id] || 'none'} onChange={val => setP(id, val)} />
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 pt-2" style={{ borderTop: '1px dashed var(--pp-border)' }}>
                <span className="text-[13px] font-medium w-28" style={{ color: 'var(--pp-text)' }}>Crear pedidos</span>
                <div className="flex gap-1">
                  {[{ val: true, label: 'Sí' }, { val: false, label: 'No' }].map(opt => (
                    <button key={String(opt.val)} type="button" onClick={() => setP('crearPedidos', opt.val)}
                      className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border transition-all"
                      style={{ background: form.permisos.crearPedidos === opt.val ? 'var(--pp-active-bg2)' : 'var(--pp-card)', color: form.permisos.crearPedidos === opt.val ? 'var(--pp-text6)' : 'var(--pp-text2)', borderColor: form.permisos.crearPedidos === opt.val ? 'rgba(200,200,200,0.3)' : 'var(--pp-surface)' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[13px] font-medium w-28" style={{ color: 'var(--pp-text)' }}>Gestionar equipo</span>
                <div className="flex gap-1">
                  {[{ val: true, label: 'Sí' }, { val: false, label: 'No' }].map(opt => (
                    <button key={String(opt.val)} type="button" onClick={() => setP('equipo', opt.val)}
                      className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border transition-all"
                      style={{ background: form.permisos.equipo === opt.val ? '#eafaf2' : 'var(--pp-card)', color: form.permisos.equipo === opt.val ? '#059669' : 'var(--pp-text2)', borderColor: form.permisos.equipo === opt.val ? '#059669' + '40' : 'var(--pp-surface)' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {error && <div className="flex items-center gap-2 text-[13px] px-3 py-2.5 rounded-[11px]" style={{ background: '#fdecec', color: '#dc2626' }}><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="flex-1 py-[11px] rounded-[11px] text-white font-bold text-[13.5px] hover:bg-[#707070] disabled:opacity-60" style={{ background: 'var(--pp-accent)' }}>
              {saving ? 'Creando…' : 'Crear usuario'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="px-5 py-[11px] rounded-[11px] border text-[13.5px] font-semibold hover:bg-[#1e1e1e]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>Cancelar</button>
          </div>
        </form>
      )}

      {/* Lista de usuarios */}
      {equipoFiltrado.length === 0 ? (
        <div className="text-center py-14 text-[13px]" style={{ color: 'var(--pp-text3)' }}>Sin usuarios que coincidan con "{search}".</div>
      ) : (
      <div className="grid md:grid-cols-2 gap-4">
        {equipoFiltrado.map(u => (
          <div key={u.uid} className="rounded-[15px] border p-5" style={{ background: 'var(--pp-card)', borderColor: editId === u.uid ? 'var(--pp-accent)' : 'var(--pp-border)', boxShadow: editId === u.uid ? '0 0 0 3px var(--pp-active-bg)' : 'none' }}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[14px] font-extrabold flex-shrink-0"
                  style={{ background: isSuperadmin(u) ? 'linear-gradient(160deg, #f97316, #ea580c)' : avatarGradient(u.uid || u.email || u.nombre), color: '#fff' }}>
                  {(u.nombre || u.email || 'A')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-bold truncate" style={{ color: 'var(--pp-text)' }}>{u.nombre || (isSuperadmin(u) ? 'Administrador' : '—')}</div>
                  <div className="text-[12px] truncate" style={{ color: 'var(--pp-text2)' }}>{u.email || (isSuperadmin(u) ? 'Cuenta principal' : '—')}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isSuperadmin(u) ? (
                  <>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-[8px]" style={{ background: 'var(--pp-active-bg)', color: 'var(--pp-text8)' }}>Superadmin</span>
                    <button onClick={() => editId === u.uid ? setEditId(null) : startEdit(u)} title="Editar"
                      className="w-8 h-8 rounded-[8px] flex items-center justify-center hover:bg-[#1e1e1e] transition-colors" style={{ color: 'var(--pp-text3)' }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : u.uid !== currentUid && (
                  <>
                    <button onClick={() => editId === u.uid ? setEditId(null) : startEdit(u)} title="Editar"
                      className="w-8 h-8 rounded-[8px] flex items-center justify-center hover:bg-[#1e1e1e] transition-colors" style={{ color: 'var(--pp-text3)' }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if (window.confirm(`¿Eliminar a ${u.nombre || u.email}?`)) onEliminar(u.uid); }} title="Eliminar"
                      className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors" style={{ color: 'var(--pp-text3)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.12)'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--pp-text3)'; }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {isSuperadmin(u) && editId !== u.uid ? (
              <div className="grid grid-cols-2 gap-2">
                {MODULOS_PERM.map(({ id, label }) => (
                  <div key={id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-[9px]" style={{ background: 'var(--pp-card)' }}>
                    <span className="text-[12px]" style={{ color: 'var(--pp-text2)' }}>{label}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[7px]" style={{ background: 'var(--pp-active-bg2)', color: 'var(--pp-text6)' }}>Editar</span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-[9px]" style={{ background: 'var(--pp-card)' }}>
                  <span className="text-[12px]" style={{ color: 'var(--pp-text2)' }}>Crear pedidos</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[7px]" style={{ background: 'var(--pp-active-bg2)', color: 'var(--pp-text6)' }}>Sí</span>
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-[9px]" style={{ background: 'var(--pp-card)' }}>
                  <span className="text-[12px]" style={{ color: 'var(--pp-text2)' }}>Equipo</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[7px]" style={{ background: 'var(--pp-active-bg2)', color: 'var(--pp-text6)' }}>Sí</span>
                </div>
              </div>
            ) : editId === u.uid && isSuperadmin(u) ? (
              /* Editar nombre/email del superadmin */
              <div className="space-y-3">
                <FormField label="Nombre"><input value={editNombreAdmin} onChange={e => setEditNombreAdmin(e.target.value)} className={inputClass} placeholder="Tu nombre" /></FormField>
                <FormField label="Correo (referencia)"><input value={editEmailAdmin} onChange={e => setEditEmailAdmin(e.target.value)} className={inputClass} placeholder="tu@correo.com" /></FormField>
                <div className="flex gap-2 pt-1">
                  <button onClick={saveEdit} disabled={saving} className="flex-1 py-[9px] rounded-[10px] text-white text-[13px] font-bold hover:bg-[#707070] disabled:opacity-60" style={{ background: 'var(--pp-accent)' }}>
                    {saving ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button onClick={() => setEditId(null)} className="px-4 py-[9px] rounded-[10px] border text-[13px] font-semibold hover:bg-[#1e1e1e]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>Cancelar</button>
                </div>
              </div>
            ) : editId === u.uid ? (
              /* Edit permisos inline */
              <div className="space-y-3">
                {MODULOS_PERM.map(({ id, label }) => (
                  <div key={id} className="flex items-center justify-between gap-3">
                    <span className="text-[12.5px] font-medium w-24" style={{ color: 'var(--pp-text)' }}>{label}</span>
                    <PermSelector value={editPermisos[id] || 'none'} onChange={val => setEP(id, val)} />
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12.5px] font-medium w-24" style={{ color: 'var(--pp-text)' }}>Crear pedidos</span>
                  <div className="flex gap-1">
                    {[{ val: true, label: 'Sí' }, { val: false, label: 'No' }].map(opt => (
                      <button key={String(opt.val)} onClick={() => setEP('crearPedidos', opt.val)}
                        className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border transition-all"
                        style={{ background: editPermisos.crearPedidos === opt.val ? 'var(--pp-active-bg2)' : 'var(--pp-card)', color: editPermisos.crearPedidos === opt.val ? 'var(--pp-text6)' : 'var(--pp-text2)', borderColor: editPermisos.crearPedidos === opt.val ? 'rgba(200,200,200,0.3)' : 'var(--pp-surface)' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12.5px] font-medium w-24" style={{ color: 'var(--pp-text)' }}>Gestionar equipo</span>
                  <div className="flex gap-1">
                    {[{ val: true, label: 'Sí' }, { val: false, label: 'No' }].map(opt => (
                      <button key={String(opt.val)} onClick={() => setEP('equipo', opt.val)}
                        className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border transition-all"
                        style={{ background: editPermisos.equipo === opt.val ? '#eafaf2' : 'var(--pp-card)', color: editPermisos.equipo === opt.val ? '#059669' : 'var(--pp-text2)', borderColor: editPermisos.equipo === opt.val ? '#059669' + '40' : 'var(--pp-surface)' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={saveEdit} disabled={saving} className="flex-1 py-[9px] rounded-[10px] text-white text-[13px] font-bold hover:bg-[#707070] disabled:opacity-60" style={{ background: 'var(--pp-accent)' }}>
                    {saving ? 'Guardando…' : 'Guardar permisos'}
                  </button>
                  <button onClick={() => setEditId(null)} className="px-4 py-[9px] rounded-[10px] border text-[13px] font-semibold hover:bg-[#1e1e1e]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>Cancelar</button>
                </div>
              </div>
            ) : (
              /* Permisos en modo lectura */
              <div className="grid grid-cols-2 gap-2">
                {MODULOS_PERM.map(({ id, label }) => (
                  <div key={id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-[9px]" style={{ background: 'var(--pp-card)' }}>
                    <span className="text-[12px]" style={{ color: 'var(--pp-text2)' }}>{label}</span>
                    <PermBadge val={u.permisos?.[id] || 'none'} />
                  </div>
                ))}
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-[9px]" style={{ background: 'var(--pp-card)' }}>
                  <span className="text-[12px]" style={{ color: 'var(--pp-text2)' }}>Crear pedidos</span>
                  <PermBadge val={u.permisos?.crearPedidos !== false ? 'edit' : 'none'} />
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-[9px]" style={{ background: 'var(--pp-card)' }}>
                  <span className="text-[12px]" style={{ color: 'var(--pp-text2)' }}>Equipo</span>
                  <PermBadge val={u.permisos?.equipo ? 'edit' : 'none'} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
