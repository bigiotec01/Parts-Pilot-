import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2, Clock, FileText, X, ThumbsUp, ThumbsDown, AlertCircle, ClipboardList, Calendar, Send, MessageSquare, Paperclip, Mail, Trash2, Share2, MessageCircle, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { STATUS_CONFIG, STATUS_ORDER } from '../../constants/status';
import { StatusBadge, StatusStepper } from '../shared/StatusBadge';
import { OrderChat } from '../shared/OrderChat';
import { FormField } from '../shared/FormField';
import { Modal } from '../shared/Modal';
import { inputClass } from '../../constants/styles';
import { avgDeliveryLeadDays, suggestDeliveryDate, cleanText, filesOf } from '../../utils/format';

const AUTO_DATE_STATES = ['en_transito', 'recibido'];

function TallerNotes({ text }) {
  const [expanded, setExpanded] = useState(false);
  const clean = cleanText(text) || '';
  const isLong = clean.length > 160;
  return (
    <div className="rounded-[11px] p-3" style={{ background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.4)', borderLeft: '3px solid #f59e0b' }}>
      <p className="text-[10.5px] font-bold uppercase mb-1" style={{ color: '#b45309' }}>Notas del taller</p>
      <p className="text-[13px] whitespace-pre-wrap" style={{ color: '#7c5a14' }}>{isLong && !expanded ? clean.slice(0, 160) + '…' : clean}</p>
      {isLong && (
        <button type="button" onClick={() => setExpanded(v => !v)} className="mt-1 flex items-center gap-1 text-[11.5px] font-bold" style={{ color: '#b7791f' }}>
          {expanded ? <>Ver menos <ChevronUp className="w-3 h-3" /></> : <>Ver más <ChevronDown className="w-3 h-3" /></>}
        </button>
      )}
    </div>
  );
}

export function AdminOrderDrawer({ order, taller, onClose, onChangeStatus, onSendEstimate, onDeleteOrder, onUpdateNotes, onUpdateReferencias, onSendMessage, onDeleteMessage, pedidos = [] }) {
  const [tab, setTab] = useState('detalles');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  const [estado, setEstado]             = useState(order.estado);
  const [fechaEntrega, setFechaEntrega] = useState(order.fechaEntrega || '');
  const [fechaSugerida, setFechaSugerida] = useState(false);
  const [numeroPO, setNumeroPO]         = useState(order.numeroPO ?? '');
  const [numeroOrden, setNumeroOrden]   = useState(order.numeroOrden ?? '');
  const [notasInt, setNotasInt]         = useState(order.notasInternas ?? '');
  const [notasEst, setNotasEst]         = useState(order.estimado?.notas ?? '');
  const [archivos, setArchivos]         = useState(filesOf(order.estimado?.archivo, order.estimado?.archivos));
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [sending, setSending]           = useState(false);
  const [sent, setSent]                 = useState(false);
  const [sendError, setSendError]       = useState('');
  const [copied, setCopied]             = useState(false);
  const [showNotify, setShowNotify]     = useState(false);
  const msgCount = (order.mensajes || []).length;

  const avgLeadDays = useMemo(() => avgDeliveryLeadDays(pedidos), [pedidos]);

  const handleEstadoChange = (newEstado) => {
    setEstado(newEstado);
    if (AUTO_DATE_STATES.includes(newEstado) && !fechaEntrega) {
      setFechaEntrega(suggestDeliveryDate(newEstado, avgLeadDays));
      setFechaSugerida(true);
    }
  };

  const handleFechaChange = (value) => {
    setFechaEntrega(value);
    setFechaSugerida(false);
  };

  const buildShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?order=${order.id}`;
    const folio = order.folio || order.id.slice(0, 8);
    const ref = order.numeroPO || folio;
    const subject = encodeURIComponent(`Estado de tu pedido ${ref} – Parts Pilot`);
    const body = encodeURIComponent(`Hola${taller?.contacto ? ` ${taller.contacto}` : ''},\n\nPuedes ver el estado de tu pedido "${order.vehiculo}" (${ref}) aquí:\n\n${url}\n\nSaludos.`);
    const to = taller?.email ? `&to=${encodeURIComponent(taller.email)}` : '';
    window.open(`https://mail.google.com/mail/?view=cm${to}&su=${subject}&body=${body}`, '_blank');
  };

  const whatsappNumber = (() => {
    const digits = (taller?.telefono || '').replace(/\D/g, '');
    if (digits.length < 10) return null;
    return digits.length === 10 ? `1${digits}` : digits;
  })();

  const [notifyBody, setNotifyBody] = useState('');
  const buildNotifyMessage = () =>
    `Hola ${taller?.contacto || ''},\n\n` +
    `Te informamos que las piezas de tu pedido están listas en nuestra tienda y esperando la fecha de entrega.\n\n` +
    `Detalles del pedido:\n` +
    `• Vehículo: ${order.vehiculo || '—'}\n` +
    (order.pieza ? `• Pieza: ${order.pieza}\n` : '') +
    (order.numeroPO ? `• No. PO: ${order.numeroPO}\n` : '') +
    (order.numeroOrden ? `• No. Orden: ${order.numeroOrden}\n` : '') +
    `\nPor favor contáctanos para coordinar la fecha y hora de entrega.\n\n` +
    `Saludos,\nDepartamento de Piezas — Parts Pilot`;
  const openNotify = () => { setNotifyBody(buildNotifyMessage()); setShowNotify(true); };

  useEffect(() => {
    setEstado(order.estado); setFechaEntrega(order.fechaEntrega || ''); setFechaSugerida(false);
    setNumeroPO(order.numeroPO ?? ''); setNumeroOrden(order.numeroOrden ?? '');
    setNotasInt(order.notasInternas ?? ''); setNotasEst(order.estimado?.notas ?? '');
    setArchivos(filesOf(order.estimado?.archivo, order.estimado?.archivos));
  }, [order.id]); // eslint-disable-line

  const handleSave = async () => {
    setSaving(true);
    try {
      await onChangeStatus(order.id, estado, fechaEntrega);
      await onUpdateReferencias(order.id, { numeroPO: numeroPO.trim(), numeroOrden: numeroOrden.trim() });
      await onUpdateNotes(order.id, notasInt);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  };

  const handleSendEst = async () => {
    setSending(true); setSendError('');
    try {
      await onSendEstimate(order.id, { notas: notasEst, archivos });
      setSent(true); setTimeout(() => setSent(false), 3000);
    } catch (err) { setSendError('Error: ' + (err.message || err.code)); }
    finally { setSending(false); }
  };

  const handleFile = (e) => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    setArchivos(prev => [...prev, ...files.map(file => ({ name: file.name, type: file.type, url: URL.createObjectURL(file), file }))]);
    e.target.value = '';
  };

  const handleRemoveFile = (idx) => setArchivos(prev => prev.filter((_, i) => i !== idx));

  const openDatePicker = (e) => { try { e.target.showPicker(); } catch (_) {} };

  const initials = (n) => (n || '').split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  /* ── Contenido compartido por tab (mobile bottom-sheet y desktop usan lo mismo) ── */
  const detallesContent = (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-[13px] p-3" style={{ background: 'var(--pp-card)' }}>
        <div className="w-10 h-10 rounded-[10px] border flex items-center justify-center font-bold text-[14px] flex-shrink-0" style={{ background: 'var(--pp-surface)', borderColor: 'var(--pp-border)', color: 'var(--pp-text2)' }}>{initials(taller?.nombre)}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-bold truncate" style={{ color: 'var(--pp-text)' }}>{taller?.nombre}</div>
          <div className="text-[12px]" style={{ color: 'var(--pp-text2)' }}>{taller?.contacto}</div>
        </div>
        {whatsappNumber && (
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent([`Hola ${taller?.contacto || ''},`, '', `Estimado para: ${order.vehiculo}`, notasEst ? `Notas: ${notasEst}` : '', '', 'Puedes verlo en Parts Pilot.', '', 'Saludos.'].filter((l, i) => !(i === 3 && !notasEst)).join('\n'))}`}
            target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] border text-[12px] font-semibold hover:bg-[#1a1a1a] transition-colors flex-shrink-0" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </a>
        )}
        <button onClick={buildShareLink} title="Enviar link del pedido" className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 transition-colors hover:bg-[#252525]" style={{ color: 'var(--pp-text3)' }}>
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div>
        <p className="text-[10.5px] font-bold uppercase mb-2" style={{ color: 'var(--pp-text9)', letterSpacing: '.06em' }}>Progreso <span className="normal-case font-medium" style={{ color: 'var(--pp-text3)' }}>· clic en un paso para cambiar el estado</span></p>
        <StatusStepper estado={estado} onSelect={handleEstadoChange} />
      </div>

      {['pedido_fabrica','ordenadas','esperando_piezas','en_transito','recibido','entregado'].includes(estado) && (
        <FormField label="Fecha estimada de entrega">
          <input type="date" value={fechaEntrega} onChange={e => handleFechaChange(e.target.value)} onClick={openDatePicker} className={`${inputClass} cursor-pointer`} />
          {fechaSugerida ? (
            <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: '#a78bfa' }}><Sparkles className="w-3 h-3" /> Sugerida automáticamente{avgLeadDays ? ` (promedio histórico: ${avgLeadDays} días)` : ''}. Puedes ajustarla.</p>
          ) : fechaEntrega && <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: '#2563eb' }}><Calendar className="w-3 h-3" /> El taller verá esta fecha en su portal.</p>}
        </FormField>
      )}

      <div className="grid grid-cols-2 gap-3">
        <FormField label="No. PO"><input value={numeroPO} onChange={e => setNumeroPO(e.target.value)} placeholder="ej. Emma" className={inputClass} /></FormField>
        <FormField label="No. Orden"><input value={numeroOrden} onChange={e => setNumeroOrden(e.target.value)} placeholder="ej. M26243" className={inputClass} /></FormField>
      </div>

      {order.notas && <TallerNotes text={order.notas} />}

      {filesOf(order.archivo, order.archivos).length > 0 && (
        <div>
          <p className="text-[10.5px] font-bold uppercase mb-2" style={{ color: 'var(--pp-text9)', letterSpacing: '.05em' }}>Archivo{filesOf(order.archivo, order.archivos).length > 1 ? 's' : ''} del taller</p>
          <div className="flex flex-wrap gap-2">
            {filesOf(order.archivo, order.archivos).map((f, i) => (
              f.type?.startsWith('image/') ? (
                <a key={i} href={f.url} target="_blank" rel="noreferrer"><img src={f.url} alt="" className="rounded-lg max-h-32 object-cover" /></a>
              ) : (
                <a key={i} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-[10px] px-3 py-2 border text-[13px] hover:border-[#e8632f] hover:text-[#c9491c] transition-colors" style={{ background: '#f8f9fa', borderColor: '#e7e9ed', color: 'var(--pp-text11)' }}>
                  <FileText className="w-4 h-4 flex-shrink-0" /><span className="truncate">{f.name}</span>
                </a>
              )
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[12.5px] font-semibold" style={{ color: 'var(--pp-text2)' }}>Notas internas</p>
          <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-[6px]" style={{ background: 'var(--pp-card)', color: 'var(--pp-text3)' }}>🔒 Solo admin</span>
        </div>
        <textarea value={notasInt} onChange={e => setNotasInt(e.target.value)} placeholder="Observaciones internas, no visibles para el taller…" rows={3}
          className="w-full text-[13px] rounded-[10px] p-3 resize-none border outline-none focus:ring-2 focus:ring-[#a0a0a0]/10 focus:border-[#a0a0a0]"
          style={{ background: 'var(--pp-input-bg)', borderColor: 'var(--pp-border4)', color: 'var(--pp-text)' }} />
      </div>

      {saved && <div className="flex items-center gap-2 px-3 py-2.5 rounded-[11px] text-[13px] font-semibold" style={{ background: '#eafaf2', color: '#059669' }}><CheckCircle2 className="w-4 h-4" /> Cambios guardados.</div>}

      {estado === 'recibido' && (taller?.email || whatsappNumber) && (
        <button
          type="button"
          onClick={openNotify}
          className="flex items-center justify-center gap-2 w-full py-[11px] rounded-[11px] text-white font-bold text-[13px] hover:brightness-105 transition-all"
          style={{ background: 'linear-gradient(160deg, #059669, #047857)', boxShadow: '0 8px 18px -8px rgba(5,150,105,.4)' }}
        >
          <Mail className="w-4 h-4" />
          Notificar al taller — piezas listas
        </button>
      )}

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="flex-1 py-[13px] rounded-[11px] text-white font-bold text-[14px] hover:bg-[#707070] disabled:opacity-60" style={{ background: 'var(--pp-accent)' }}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button onClick={() => { if (window.confirm('¿Eliminar este pedido?')) onDeleteOrder(order.id); }} title="Eliminar pedido" className="w-[46px] h-[46px] flex-shrink-0 rounded-[11px] flex items-center justify-center transition-colors" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#f87171' }}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const estimadoContent = (
    <div className="space-y-4">
      {order.estado === 'cotizando' && order.estimado?.respuesta === 'pendiente' && <div className="flex items-center gap-2 text-[13px] px-3 py-2.5 rounded-[10px]" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Clock className="w-4 h-4 flex-shrink-0" /> Esperando respuesta del taller…</div>}
      {order.estimado?.respuesta && order.estimado.respuesta !== 'pendiente' && (
        <div className="flex items-center gap-2 text-[13px] px-3 py-2.5 rounded-[10px]" style={{ background: order.estimado.respuesta === 'aceptado' ? '#eafaf2' : '#fdecec', color: order.estimado.respuesta === 'aceptado' ? '#059669' : '#dc2626' }}>
          {order.estimado.respuesta === 'aceptado' ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
          El taller {order.estimado.respuesta === 'aceptado' ? 'aceptó' : 'rechazó'} este estimado.
        </div>
      )}
      {sent && <div className="flex items-center gap-2 text-[13px] px-3 py-2.5 rounded-[10px]" style={{ background: '#eafaf2', color: '#059669' }}><CheckCircle2 className="w-4 h-4" /> Estimado enviado.</div>}
      {sendError && <div className="flex items-center gap-2 text-[13px] px-3 py-2.5 rounded-[10px]" style={{ background: '#fdecec', color: '#dc2626' }}><AlertCircle className="w-4 h-4" />{sendError}</div>}
      <FormField label="Notas para el taller">
        <textarea value={notasEst} onChange={e => setNotasEst(e.target.value)} rows={4} placeholder="Tiempo de entrega, condiciones, precio…" className={`${inputClass} resize-none`} />
      </FormField>
      <div>
        <p className="text-[12.5px] font-semibold mb-1.5" style={{ color: 'var(--pp-text11)' }}>PDF <span style={{ color: 'var(--pp-text10)', fontWeight: 400 }}>(opcional)</span></p>
        <div className="space-y-2">
          {archivos.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-[10px] px-3 py-2.5 border" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
              <FileText className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--pp-text8)' }} />
              <a href={f.url} target="_blank" rel="noreferrer" className="text-[13px] truncate flex-1 hover:underline" style={{ color: 'var(--pp-text2)' }}>{f.name}</a>
              <button onClick={() => handleRemoveFile(i)} style={{ color: 'var(--pp-text3)' }}><X className="w-4 h-4" /></button>
            </div>
          ))}
          <label className="flex items-center justify-center gap-2 border-dashed border rounded-[10px] px-3 py-3 text-[13px] cursor-pointer transition-colors hover:border-[#a0a0a0] hover:text-[#a0a0a0]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
            <Paperclip className="w-4 h-4" /> {archivos.length ? 'Adjuntar otro PDF' : 'Adjuntar PDF'}
            <input type="file" accept="application/pdf" multiple onChange={handleFile} className="hidden" />
          </label>
        </div>
      </div>
      <button onClick={handleSendEst} disabled={sending} className="w-full py-[11px] rounded-[11px] text-white font-bold text-[13px] hover:bg-[#707070] disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: 'var(--pp-accent)' }}>
        <Send className="w-4 h-4" /> {sending ? 'Enviando…' : order.estimado ? 'Actualizar estimado' : 'Enviar estimado al taller'}
      </button>
    </div>
  );

  const tabs = [
    { id: 'detalles', label: 'Detalles', icon: ClipboardList },
    { id: 'estimado', label: 'Estimado', icon: FileText },
    { id: 'mensajes', label: 'Mensajes', icon: MessageSquare, badge: msgCount },
  ];

  const chatContent = (
    <OrderChat order={order} role="admin" otherPartyName={taller?.nombre}
      onSendMessage={(orderId, texto, attachment) => onSendMessage(orderId, texto, 'admin', attachment)}
      onDeleteMessage={(mensajes, index) => onDeleteMessage(order.id, mensajes, index)} />
  );

  const notifyModal = showNotify && (
    <Modal title="Notificar al taller · Piezas listas" onClose={() => setShowNotify(false)}>
      <div className="space-y-4">
        <p className="text-[12.5px]" style={{ color: 'var(--pp-text2)' }}>Revisa y edita el mensaje antes de enviarlo por el canal que prefieras.</p>
        <FormField label="Mensaje">
          <textarea value={notifyBody} onChange={e => setNotifyBody(e.target.value)} rows={9} className={`${inputClass} resize-none`} />
        </FormField>
        <div className="grid gap-2.5" style={{ gridTemplateColumns: taller?.email && whatsappNumber ? '1fr 1fr' : '1fr' }}>
          {taller?.email && (
            <a
              href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(taller.email)}&su=${encodeURIComponent(`Piezas listas para entrega — ${order.vehiculo || ''}${order.pieza ? ` (${order.pieza})` : ''}`)}&body=${encodeURIComponent(notifyBody)}`}
              target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 py-[11px] rounded-[11px] text-white font-bold text-[13px] hover:brightness-105 transition-all"
              style={{ background: 'linear-gradient(160deg, #059669, #047857)' }}
            >
              <Mail className="w-4 h-4" /> Abrir en correo
            </a>
          )}
          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(notifyBody)}`}
              target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 py-[11px] rounded-[11px] text-white font-bold text-[13px] hover:brightness-105 transition-all"
              style={{ background: 'linear-gradient(160deg, #25D366, #1DA851)' }}
            >
              <MessageCircle className="w-4 h-4" /> Abrir en WhatsApp
            </a>
          )}
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(notifyBody).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); })}
          className="w-full py-2.5 rounded-[11px] text-[13px] font-semibold border flex items-center justify-center gap-2 hover:bg-[#1e1e1e] transition-colors"
          style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}
        >
          {copied ? <><CheckCircle2 className="w-4 h-4" /> ¡Copiado!</> : <><Paperclip className="w-4 h-4" /> Copiar mensaje</>}
        </button>
      </div>
    </Modal>
  );

  /* ── MÓVIL: bottom sheet con 3 tabs ── */
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0" style={{ background: 'var(--pp-overlay2)', animation: 'ppFade .2s ease both' }} onClick={onClose} />
        <div className="pp-scroll absolute bottom-0 left-0 right-0 max-h-[92%] overflow-y-auto overflow-x-hidden rounded-t-[24px] flex flex-col" style={{ background: 'var(--pp-card)', animation: 'ppSheet .3s cubic-bezier(.2,.8,.2,1) both' }}>
          <div className="sticky top-0 z-10 flex-shrink-0" style={{ background: 'var(--pp-card)', borderBottom: '1px solid var(--pp-border2)' }}>
            <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-3" style={{ background: 'var(--pp-surface)' }} />
            <div className="flex items-center gap-3 px-5 pb-3">
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[11px] font-semibold" style={{ color: 'var(--pp-text3)' }}>{order.folio || order.id?.slice(0,8)}</div>
                <h2 className="text-[17px] font-bold" style={{ color: 'var(--pp-text)' }}>{order.vehiculo}</h2>
              </div>
              <StatusBadge estado={estado} />
              <button onClick={onClose} className="w-8 h-8 rounded-[9px] border flex items-center justify-center flex-shrink-0" style={{ borderColor: 'var(--pp-border)', color: 'var(--pp-text2)' }}><X className="w-4 h-4" /></button>
            </div>
            <div className="flex px-5">
              {tabs.map(({ id, label, icon: Icon, badge }) => (
                <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 py-3 text-[12.5px] font-semibold border-b-2 mr-5 transition-colors`} style={{ borderBottomColor: tab === id ? 'var(--pp-accent)' : 'transparent', color: tab === id ? 'var(--pp-text)' : 'var(--pp-text3)' }}>
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.8} /> {label}
                  {badge > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--pp-card)', color: 'var(--pp-text2)' }}>{badge}</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="p-5 pb-10" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            {tab === 'detalles' && detallesContent}
            {tab === 'estimado' && estimadoContent}
            {tab === 'mensajes' && chatContent}
          </div>
        </div>
        {notifyModal}
      </div>
    );
  }

  /* ── ESCRITORIO: mismo flujo vertical de un solo tab a la vez ── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0" style={{ background: 'var(--pp-overlay)', animation: 'ppFade .2s ease both' }} onClick={onClose} />
      <div className="relative w-full flex flex-col" style={{ maxWidth: 660, maxHeight: '90vh', background: 'var(--pp-card)', borderRadius: 20, boxShadow: '0 40px 80px -20px rgba(0,0,0,.35)', animation: 'ppRise .28s cubic-bezier(.2,.8,.2,1) both' }}>

        {/* ── Header ── */}
        <div className="flex items-center gap-4 px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--pp-border2)' }}>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[12px] font-semibold" style={{ color: 'var(--pp-text3)' }}>{order.folio || order.id?.slice(0,8)}</div>
            <h2 className="text-[19px] font-bold leading-tight" style={{ color: 'var(--pp-text)', letterSpacing: '-.02em' }}>{order.vehiculo || '—'}</h2>
          </div>
          <StatusBadge estado={estado} />
          <button onClick={onClose} className="w-9 h-9 rounded-[10px] border flex items-center justify-center hover:bg-[#1e1e1e] transition-colors flex-shrink-0" style={{ borderColor: 'var(--pp-border)', color: 'var(--pp-text2)' }}>
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex px-7 flex-shrink-0" style={{ borderBottom: '1px solid var(--pp-border2)' }}>
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button key={id} onClick={() => setTab(id)} className="flex items-center gap-1.5 px-1 py-3.5 text-[13px] font-semibold border-b-2 mr-6 transition-colors" style={{ borderBottomColor: tab === id ? 'var(--pp-accent)' : 'transparent', color: tab === id ? 'var(--pp-text)' : 'var(--pp-text3)' }}>
              <Icon className="w-4 h-4" strokeWidth={1.8} /> {label}
              {badge > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5" style={{ background: 'var(--pp-card)', color: 'var(--pp-text2)' }}>{badge}</span>}
            </button>
          ))}
        </div>

        {/* ── Body: un solo tab visible a la vez ── */}
        <div className="flex-1 overflow-y-auto p-7">
          {tab === 'detalles' && detallesContent}
          {tab === 'estimado' && estimadoContent}
          {tab === 'mensajes' && chatContent}
        </div>
      </div>

      {notifyModal}
    </div>
  );
}
