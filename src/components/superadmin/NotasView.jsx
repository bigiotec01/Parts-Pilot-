import { useEffect, useState } from 'react';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { ArrowLeft, Check, RotateCcw, StickyNote, Trash2 } from 'lucide-react';
import { db, auth } from '../../firebase';
import { inputClass } from '../../constants/styles';
import { formatDate } from '../../utils/format';

export function NotasView({ onExit }) {
  const [notas, setNotas] = useState(null);
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'notasSuperAdmin'), orderBy('creadoEn', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setNotas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error('NotasView:', err.code || err.message));
    return unsub;
  }, []);

  const agregar = async (e) => {
    e.preventDefault();
    const texto2 = texto.trim();
    if (!texto2) return;
    setError('');
    setGuardando(true);
    try {
      await addDoc(collection(db, 'notasSuperAdmin'), {
        texto: texto2,
        estado: 'pendiente',
        creadoEn: serverTimestamp(),
        creadoPor: auth.currentUser?.email || null,
      });
      setTexto('');
    } catch (err) {
      setError(err.message || 'Error al guardar la nota.');
    } finally {
      setGuardando(false);
    }
  };

  const toggleEstado = async (nota) => {
    try {
      await updateDoc(doc(db, 'notasSuperAdmin', nota.id), {
        estado: nota.estado === 'hecho' ? 'pendiente' : 'hecho',
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const eliminar = async (nota) => {
    if (!confirm('¿Eliminar esta nota?')) return;
    try {
      await deleteDoc(doc(db, 'notasSuperAdmin', nota.id));
    } catch (err) {
      alert(err.message);
    }
  };

  const pendientes = (notas || []).filter(n => n.estado !== 'hecho');
  const hechas = (notas || []).filter(n => n.estado === 'hecho');

  return (
    <div className="min-h-screen" style={{ background: 'var(--pp-bg)' }}>
      <header className="h-[70px] flex items-center gap-3 px-[30px] border-b" style={{ borderColor: 'var(--pp-border2)' }}>
        <button onClick={onExit} className="w-9 h-9 rounded-[10px] flex items-center justify-center border" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <StickyNote className="w-5 h-5" style={{ color: 'var(--pp-text)' }} />
        <div>
          <h1 className="text-[17px] font-bold" style={{ color: 'var(--pp-text)' }}>Notas</h1>
          <p className="text-[12px]" style={{ color: 'var(--pp-text2)' }}>Errores y acciones nuevas a implementar en Parts Pilot</p>
        </div>
      </header>

      <div className="p-[30px] max-w-[720px]">
        <form onSubmit={agregar} className="mb-6 space-y-2">
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            rows={3}
            placeholder="Escribe un error o una acción nueva que quieras que se implemente…"
            className={`${inputClass} resize-none`}
          />
          {error && <p className="text-[12.5px]" style={{ color: '#dc2626' }}>{error}</p>}
          <button
            disabled={guardando || !texto.trim()}
            type="submit"
            className="px-4 py-[9px] rounded-[10px] text-[13px] font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: 'var(--pp-accent)' }}
          >
            {guardando ? 'Guardando…' : 'Agregar nota'}
          </button>
        </form>

        {notas === null ? (
          <p className="text-[13.5px]" style={{ color: 'var(--pp-text3)' }}>Cargando…</p>
        ) : notas.length === 0 ? (
          <p className="text-[13.5px]" style={{ color: 'var(--pp-text3)' }}>Todavía no hay notas.</p>
        ) : (
          <div className="space-y-6">
            {pendientes.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--pp-text3)' }}>
                  Pendientes ({pendientes.length})
                </p>
                <div className="rounded-[16px] border overflow-hidden" style={{ borderColor: 'var(--pp-border2)' }}>
                  {pendientes.map(n => (
                    <NotaRow key={n.id} nota={n} onToggle={() => toggleEstado(n)} onEliminar={() => eliminar(n)} />
                  ))}
                </div>
              </div>
            )}
            {hechas.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--pp-text3)' }}>
                  Hechas ({hechas.length})
                </p>
                <div className="rounded-[16px] border overflow-hidden" style={{ borderColor: 'var(--pp-border2)' }}>
                  {hechas.map(n => (
                    <NotaRow key={n.id} nota={n} onToggle={() => toggleEstado(n)} onEliminar={() => eliminar(n)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NotaRow({ nota, onToggle, onEliminar }) {
  const hecha = nota.estado === 'hecho';
  return (
    <div className="flex items-start justify-between gap-3 px-5 py-3.5" style={{ borderBottom: '1px solid var(--pp-border2)' }}>
      <div className="min-w-0">
        <p
          className="text-[13.5px] whitespace-pre-wrap"
          style={{ color: hecha ? 'var(--pp-text4)' : 'var(--pp-text)', textDecoration: hecha ? 'line-through' : 'none' }}
        >
          {nota.texto}
        </p>
        <p className="text-[11px] mt-1" style={{ color: 'var(--pp-text4)' }}>
          {formatDate(nota.creadoEn)}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onToggle}
          title={hecha ? 'Marcar como pendiente' : 'Marcar como hecha'}
          className="w-8 h-8 rounded-[8px] flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: hecha ? 'var(--pp-text3)' : '#10b981' }}
        >
          {hecha ? <RotateCcw className="w-4 h-4" /> : <Check className="w-4 h-4" />}
        </button>
        <button
          onClick={onEliminar}
          title="Eliminar"
          className="w-8 h-8 rounded-[8px] flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: '#ef4444' }}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
