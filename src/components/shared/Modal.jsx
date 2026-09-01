import { useRef } from 'react';
import {
  X
} from 'lucide-react';

export function Modal({ title, onClose, children }) {
  // El cierre "al hacer click afuera" solo debe pasar si el click EMPEZÓ afuera
  // (mousedown en el fondo) — si el usuario hace click y arrastra para
  // seleccionar texto dentro del modal y suelta el mouse fuera del recuadro
  // (algo muy fácil de hacer sin querer), el navegador dispara el click en el
  // fondo aunque el gesto haya empezado adentro, y el modal se cerraba solo.
  const mouseDownEnFondo = useRef(false);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: 'var(--pp-overlay)' }}
      onMouseDown={e => { mouseDownEnFondo.current = e.target === e.currentTarget; }}
      onClick={e => { if (mouseDownEnFondo.current && e.target === e.currentTarget) onClose(); }}
    >
      <div className="rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl h-[92vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto flex flex-col pb-[env(safe-area-inset-bottom)]" style={{ background: 'var(--pp-card)' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="w-10 h-1 rounded-full" style={{ background: 'var(--pp-surface)' }} /></div>
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border2)' }}>
          <h2 className="font-mono tracking-wider text-sm truncate pr-4" style={{ color: 'var(--pp-text2)' }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg flex-shrink-0 hover:bg-[#1e1e1e]"><X className="w-5 h-5" style={{ color: 'var(--pp-text2)' }} /></button>
        </div>
        <div className="p-6 flex-1">{children}</div>
      </div>
    </div>
  );
}
