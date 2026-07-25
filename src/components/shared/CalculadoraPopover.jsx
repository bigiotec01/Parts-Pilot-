import { useState, useRef, useEffect } from 'react';
import {
  X, GripHorizontal
} from 'lucide-react';

// Calculadora simple desplegable — solo aritmética básica, sin conexión con los campos del formulario.
// Se puede arrastrar desde la barra de título a cualquier punto de la pantalla.
export function CalculadoraPopover({ onClose, anchorRef }) {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState(null);
  const [operador, setOperador] = useState(null);
  const [esperandoOperando, setEsperandoOperando] = useState(false);

  const ANCHO = 240;
  const [pos, setPos] = useState(() => {
    const r = anchorRef?.current?.getBoundingClientRect();
    if (!r) return { top: 80, left: 80 };
    return { top: r.bottom + 8, left: Math.max(8, Math.min(r.right - ANCHO, window.innerWidth - ANCHO - 8)) };
  });
  const draggingRef = useRef(null);

  useEffect(() => {
    const puntero = (ev) => (ev.touches ? ev.touches[0] : ev);
    const onMove = (ev) => {
      if (!draggingRef.current) return;
      ev.preventDefault();
      const { offsetX, offsetY } = draggingRef.current;
      const { clientX, clientY } = puntero(ev);
      setPos({
        left: Math.min(Math.max(0, clientX - offsetX), window.innerWidth - ANCHO),
        top: Math.min(Math.max(0, clientY - offsetY), window.innerHeight - 60),
      });
    };
    const onUp = () => { draggingRef.current = null; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
  }, []);

  const startDrag = (ev) => {
    const { clientX, clientY } = ev.touches ? ev.touches[0] : ev;
    draggingRef.current = { offsetX: clientX - pos.left, offsetY: clientY - pos.top };
  };

  const ingresarDigito = (d) => {
    if (esperandoOperando) { setDisplay(d); setEsperandoOperando(false); }
    else setDisplay(display === '0' ? d : display + d);
  };

  const ingresarPunto = () => {
    if (esperandoOperando) { setDisplay('0.'); setEsperandoOperando(false); return; }
    if (!display.includes('.')) setDisplay(display + '.');
  };

  const calcular = (a, b, op) => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? 0 : a / b;
      default:  return b;
    }
  };

  const elegirOperador = (op) => {
    const valor = parseFloat(display);
    if (prev !== null && operador && !esperandoOperando) {
      const resultado = calcular(prev, valor, operador);
      setDisplay(String(resultado));
      setPrev(resultado);
    } else {
      setPrev(valor);
    }
    setOperador(op);
    setEsperandoOperando(true);
  };

  const igual = () => {
    if (prev === null || operador === null) return;
    const resultado = calcular(prev, parseFloat(display), operador);
    setDisplay(String(resultado));
    setPrev(null);
    setOperador(null);
    setEsperandoOperando(true);
  };

  const limpiar = () => { setDisplay('0'); setPrev(null); setOperador(null); setEsperandoOperando(false); };
  const retroceder = () => setDisplay(d => (d.length > 1 ? d.slice(0, -1) : '0'));

  const btn = (label, onClick, opts = {}) => (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-[9px] text-[15px] font-semibold flex items-center justify-center transition-colors hover:brightness-110 ${opts.className || ''}`}
      style={{ background: 'var(--pp-input-bg)', color: 'var(--pp-text)', border: '1px solid var(--pp-border4)', ...opts.style }}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed w-[240px] rounded-[14px] border shadow-lg z-50 p-3" style={{ top: pos.top, left: pos.left, borderColor: 'var(--pp-border2)', background: 'var(--pp-card)' }}>
      <div
        className="flex items-center justify-between mb-2 cursor-move select-none"
        style={{ touchAction: 'none' }}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
      >
        <span className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase" style={{ color: 'var(--pp-text3)', letterSpacing: '.05em' }}>
          <GripHorizontal className="w-3.5 h-3.5" /> Calculadora
        </span>
        <button type="button" onClick={onClose} onMouseDown={ev => ev.stopPropagation()} style={{ color: 'var(--pp-text3)' }}><X className="w-3.5 h-3.5" /></button>
      </div>
      <div className="rounded-[9px] px-3 py-2.5 mb-2 text-right font-mono text-[20px] font-bold truncate" style={{ background: 'var(--pp-input-bg)', color: 'var(--pp-text)' }}>
        {display}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {btn('C', limpiar, { style: { color: '#ef4444' } })}
        {btn('⌫', retroceder)}
        {btn('%', () => setDisplay(String(parseFloat(display) / 100)))}
        {btn('÷', () => elegirOperador('÷'), { style: { color: 'var(--pp-accent)' } })}
        {btn('7', () => ingresarDigito('7'))}
        {btn('8', () => ingresarDigito('8'))}
        {btn('9', () => ingresarDigito('9'))}
        {btn('×', () => elegirOperador('×'), { style: { color: 'var(--pp-accent)' } })}
        {btn('4', () => ingresarDigito('4'))}
        {btn('5', () => ingresarDigito('5'))}
        {btn('6', () => ingresarDigito('6'))}
        {btn('-', () => elegirOperador('-'), { style: { color: 'var(--pp-accent)' } })}
        {btn('1', () => ingresarDigito('1'))}
        {btn('2', () => ingresarDigito('2'))}
        {btn('3', () => ingresarDigito('3'))}
        {btn('+', () => elegirOperador('+'), { style: { color: 'var(--pp-accent)' } })}
        {btn('0', () => ingresarDigito('0'), { className: 'col-span-2' })}
        {btn('.', ingresarPunto)}
        {btn('=', igual, { style: { background: 'var(--pp-accent)', color: '#fff', borderColor: 'var(--pp-accent)' } })}
      </div>
    </div>
  );
}
