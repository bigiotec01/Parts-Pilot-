import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';

// Reemplazo de window.confirm / window.alert con el estilo de la app.
// Se usan igual que los nativos pero con await:
//   if (!(await confirmar('¿Eliminar esta factura?', { peligro: true }))) return;
//   await avisar('No se pudo leer el archivo.');
// <DialogHost /> va montado una sola vez en App.jsx.

let mostrar = null;

function abrir(dialogo) {
  // Si el host no está montado (no debería pasar), cae al diálogo nativo.
  if (!mostrar) {
    if (dialogo.tipo === 'confirmar') return Promise.resolve(window.confirm(dialogo.mensaje));
    window.alert(dialogo.mensaje);
    return Promise.resolve();
  }
  return new Promise(resolve => mostrar({ ...dialogo, resolve }));
}

export function confirmar(mensaje, { titulo, confirmarTexto, cancelarTexto = 'Cancelar', peligro = false } = {}) {
  return abrir({
    tipo: 'confirmar', mensaje, cancelarTexto, peligro,
    titulo: titulo || (peligro ? 'Confirmar eliminación' : 'Confirmar'),
    confirmarTexto: confirmarTexto || (peligro ? 'Eliminar' : 'Aceptar'),
  });
}

export function avisar(mensaje, { titulo = 'Aviso' } = {}) {
  return abrir({ tipo: 'avisar', mensaje, titulo, confirmarTexto: 'Entendido' });
}

export function DialogHost() {
  const [dialogo, setDialogo] = useState(null);
  const confirmarRef = useRef(null);

  useEffect(() => {
    mostrar = setDialogo;
    return () => { mostrar = null; };
  }, []);

  const cerrar = (valor) => {
    dialogo?.resolve(dialogo.tipo === 'confirmar' ? valor : undefined);
    setDialogo(null);
  };

  useEffect(() => {
    if (!dialogo) return;
    confirmarRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') cerrar(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialogo]); // eslint-disable-line

  if (!dialogo) return null;
  const { tipo, titulo, mensaje, confirmarTexto, cancelarTexto, peligro } = dialogo;
  const Icon = peligro ? AlertTriangle : Info;
  const color = peligro ? '#dc2626' : 'var(--pp-accent)';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: 'var(--pp-overlay)', animation: 'ppFade .15s ease both' }}
      onMouseDown={e => { if (e.target === e.currentTarget) cerrar(false); }}
    >
      <div role="alertdialog" aria-modal="true" aria-labelledby="pp-dialog-titulo" className="w-full max-w-[400px] rounded-[18px] p-6" style={{ background: 'var(--pp-card)', boxShadow: '0 30px 60px -20px rgba(0,0,0,.45)', animation: 'ppRise .2s cubic-bezier(.2,.8,.2,1) both' }}>
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: peligro ? 'rgba(220,38,38,0.1)' : 'var(--pp-active-bg)', color }}>
            <Icon className="w-[18px] h-[18px]" />
          </div>
          <div className="min-w-0 pt-1">
            <h2 id="pp-dialog-titulo" className="text-[15px] font-bold mb-1.5" style={{ color: 'var(--pp-text)' }}>{titulo}</h2>
            <p className="text-[13px] whitespace-pre-line" style={{ color: 'var(--pp-text2)' }}>{mensaje}</p>
          </div>
        </div>
        <div className="flex gap-2.5 justify-end">
          {tipo === 'confirmar' && (
            <button type="button" onClick={() => cerrar(false)} className="px-4 py-[9px] rounded-[10px] border text-[13px] font-semibold transition-colors hover:bg-[#1e1e1e]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
              {cancelarTexto}
            </button>
          )}
          <button ref={confirmarRef} type="button" onClick={() => cerrar(true)} className="px-4 py-[9px] rounded-[10px] text-white text-[13px] font-bold hover:brightness-110 transition-all" style={{ background: peligro ? '#dc2626' : 'var(--pp-accent)' }}>
            {confirmarTexto}
          </button>
        </div>
      </div>
    </div>
  );
}
