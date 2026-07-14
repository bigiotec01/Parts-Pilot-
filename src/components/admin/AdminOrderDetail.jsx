import { useState, useEffect } from 'react';
import {
  CheckCircle2, Clock, FileText, X, ThumbsUp, ThumbsDown, AlertCircle, Send, Paperclip, Mail, Trash2, StickyNote, Share2
} from 'lucide-react';
import { STATUS_CONFIG, STATUS_ORDER } from '../../constants/status';
import { formatDate, filesOf } from '../../utils/format';
import { StatusBadge, StatusStepper } from '../shared/StatusBadge';
import { FormField, InfoItem } from '../shared/FormField';
import { inputClass } from '../../constants/styles';

export function AdminOrderDetail({ order, taller, onChangeStatus, onSendEstimate, onDeleteOrder, onUpdateNotes, onUpdateReferencias }) {
  // Estado local — nada se guarda hasta presionar "Actualizar"
  const [estado, setEstado]             = useState(order.estado);
  const [fechaEntrega, setFechaEntrega] = useState(order.fechaEntrega || '');
  const [numeroPO, setNumeroPO]         = useState(order.numeroPO ?? '');
  const [numeroOrden, setNumeroOrden]   = useState(order.numeroOrden ?? '');
  const [notasInt, setNotasInt]         = useState(order.notasInternas ?? '');
  // Estimado (sección separada)
  const [notasEstimado, setNotasEstimado] = useState(order.estimado?.notas ?? '');
  const [archivos, setArchivos]         = useState(filesOf(order.estimado?.archivo, order.estimado?.archivos));
  // UI state
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [sending, setSending]           = useState(false);
  const [sent, setSent]                 = useState(false);
  const [sendError, setSendError]       = useState('');
  const [showEmail, setShowEmail]       = useState(false);
  const [copied, setCopied]             = useState(false);

  // Sincroniza estado local cuando se abre un pedido diferente
  useEffect(() => {
    setEstado(order.estado);
    setFechaEntrega(order.fechaEntrega || '');
    setNumeroPO(order.numeroPO ?? '');
    setNumeroOrden(order.numeroOrden ?? '');
    setNotasInt(order.notasInternas ?? '');
    setNotasEstimado(order.estimado?.notas ?? '');
    setArchivos(filesOf(order.estimado?.archivo, order.estimado?.archivos));
  }, [order.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Botón único — guarda estado, fecha, PO, orden y notas de una vez
  const handleActualizar = async () => {
    setSaving(true);
    try {
      await onChangeStatus(order.id, estado, fechaEntrega);
      await onUpdateReferencias(order.id, { numeroPO: numeroPO.trim(), numeroOrden: numeroOrden.trim() });
      await onUpdateNotes(order.id, notasInt);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  };

  const handleSendEstimate = async () => {
    setSending(true); setSendError('');
    try {
      await onSendEstimate(order.id, { notas: notasEstimado, archivos });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      setSendError('Error al enviar: ' + (err.message || err.code));
    } finally { setSending(false); }
  };

  const handleFile = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setArchivos(prev => [...prev, ...files.map(file => ({ name: file.name, type: file.type, url: URL.createObjectURL(file), file }))]);
    e.target.value = '';
  };

  const handleRemoveFile = (idx) => setArchivos(prev => prev.filter((_, i) => i !== idx));

  const buildEmailContent = () => {
    const subject = `Estimado · ${order.referencia || order.vehiculo}`;
    const lineas = [`Hola ${taller.contacto || ''},`, '', `Te compartimos el estimado para tu pedido (${order.vehiculo}):`, ''];
    if (notasEstimado) lineas.push(`Notas: ${notasEstimado}`);
    lineas.push('', 'Puedes ver el detalle completo, fotos y archivos desde Parts Pilot.');
    if (archivos.length === 1) lineas.push('', `No olvides adjuntar el PDF "${archivos[0].name}" a este correo.`);
    else if (archivos.length > 1) lineas.push('', `No olvides adjuntar los ${archivos.length} PDFs a este correo.`);
    lineas.push('', 'Saludos.');
    return { subject, body: lineas.join('\n') };
  };

  const handleCopyEmail = () => {
    const { subject, body } = buildEmailContent();
    navigator.clipboard.writeText(`Para: ${taller.email}\nAsunto: ${subject}\n\n${body}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?order=${order.id}`;
    const folio = order.folio || order.id.slice(0, 8);
    const ref = order.numeroPO || folio;
    const subject = encodeURIComponent(`Estado de tu pedido ${ref} – Parts Pilot`);
    const body = encodeURIComponent(`Hola${taller?.contacto ? ` ${taller.contacto}` : ''},\n\nPuedes ver el estado de tu pedido "${order.vehiculo}" (${ref}) aquí:\n\n${url}\n\nSaludos.`);
    const to = taller?.email ? `&to=${encodeURIComponent(taller.email)}` : '';
    window.open(`https://mail.google.com/mail/?view=cm${to}&su=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Taller + estado actual */}
      <div className="flex items-center gap-3 rounded-[13px] p-3" style={{ background: 'var(--pp-card)' }}>
        <div className="w-10 h-10 rounded-[10px] border flex items-center justify-center font-bold text-[14px] flex-shrink-0" style={{ background: 'var(--pp-surface)', borderColor: 'var(--pp-border)', color: 'var(--pp-text2)' }}>
          {(taller?.nombre || '?').split(' ').filter(w => w.length > 2).slice(0,2).map(w => w[0]).join('').toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-bold truncate" style={{ color: 'var(--pp-text)' }}>{taller?.nombre}</div>
          <div className="text-[12px]" style={{ color: 'var(--pp-text2)' }}>{taller?.contacto}</div>
        </div>
        <StatusBadge estado={estado} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ── Columna izquierda ── */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <InfoItem label="Fecha" value={formatDate(order.fecha)} />
            <InfoItem label="Folio" value={order.folio || order.id.slice(0,8)} />
          </div>

          <FormField label="Estado del pedido">
            <select value={estado} onChange={e => setEstado(e.target.value)} className={inputClass}>
              {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
            </select>
          </FormField>

          {['pedido_fabrica','ordenadas','esperando_piezas','en_transito','recibido','entregado'].includes(estado) && (
            <FormField label="Fecha estimada de entrega">
              <input type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} className={inputClass} />
              {fechaEntrega && <p className="text-[11px] mt-1" style={{ color: '#2563eb' }}>El taller verá esta fecha en su portal.</p>}
            </FormField>
          )}

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
            <FormField label="No. PO"><input value={numeroPO} onChange={e => setNumeroPO(e.target.value)} placeholder="ej. 48213" className={inputClass} /></FormField>
            <FormField label="No. Orden"><input value={numeroOrden} onChange={e => setNumeroOrden(e.target.value)} placeholder="ej. T-7890" className={inputClass} /></FormField>
          </div>

          {order.notas && (
            <div className="rounded-[12px] p-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-[10.5px] font-bold uppercase mb-1" style={{ color: '#f59e0b', letterSpacing: '.05em' }}>Notas del taller</p>
              <p className="text-[13px] leading-relaxed" style={{ color: '#7c5a14' }}>{order.notas}</p>
            </div>
          )}

          {filesOf(order.archivo, order.archivos).length > 0 && (
            <div className="rounded-[12px] p-3" style={{ background: 'var(--pp-card)' }}>
              <p className="text-[10.5px] font-bold uppercase mb-2" style={{ color: 'var(--pp-text3)', letterSpacing: '.05em' }}>Archivo{filesOf(order.archivo, order.archivos).length > 1 ? 's' : ''} del taller</p>
              <div className="flex flex-wrap gap-2">
                {filesOf(order.archivo, order.archivos).map((f, i) => (
                  f.type?.startsWith('image/') || f.url?.match(/\.(jpg|jpeg|png|webp|gif)/i) ? (
                    <a key={i} href={f.url} target="_blank" rel="noreferrer"><img src={f.url} alt={f.name} className="rounded-lg max-h-36 object-cover" style={{ border: '1px solid var(--pp-border)' }} /></a>
                  ) : (
                    <a key={i} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-[10px] px-3 py-2 text-[13px] border transition-colors hover:border-[#a0a0a0]" style={{ background: 'var(--pp-input-bg)', borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
                      <FileText className="w-4 h-4 flex-shrink-0" /><span className="truncate">{f.name}</span>
                    </a>
                  )
                ))}
              </div>
            </div>
          )}

          <div className="rounded-[12px] p-3" style={{ background: 'var(--pp-card)' }}>
            <p className="text-[10.5px] font-bold uppercase mb-3" style={{ color: 'var(--pp-text3)', letterSpacing: '.06em' }}>Progreso</p>
            <StatusStepper estado={estado} />
          </div>

          <div className="rounded-[12px] p-3" style={{ background: 'var(--pp-card)' }}>
            <p className="text-[10.5px] font-bold uppercase mb-2 flex items-center gap-1.5" style={{ color: 'var(--pp-text3)', letterSpacing: '.05em' }}>
              <StickyNote className="w-3.5 h-3.5" /> Notas internas
            </p>
            <textarea value={notasInt} onChange={e => setNotasInt(e.target.value)} placeholder="Solo visibles para el admin…" rows={3}
              className="w-full text-[13px] rounded-[10px] p-2.5 resize-none border outline-none focus:ring-2 focus:ring-[#a0a0a0]/10 focus:border-[#a0a0a0]"
              style={{ background: 'var(--pp-input-bg)', borderColor: 'var(--pp-border4)', color: 'var(--pp-text)' }} />
          </div>

          {saved && <div className="flex items-center gap-2 px-3 py-2.5 rounded-[11px] text-[13px] font-semibold" style={{ background: '#eafaf2', color: '#059669' }}><CheckCircle2 className="w-4 h-4" /> Cambios guardados.</div>}
          <button onClick={handleActualizar} disabled={saving} className="w-full py-[13px] rounded-[11px] text-white font-bold text-[14px] hover:bg-[#707070] disabled:opacity-60 transition-all" style={{ background: 'var(--pp-accent)' }}>
            {saving ? 'Guardando…' : 'Actualizar'}
          </button>
        </div>

        {/* ── Columna derecha: Estimado ── */}
        <div className="space-y-3">
          <div className="rounded-[13px] p-4 space-y-3 border" style={{ borderColor: 'var(--pp-border)', background: 'var(--pp-card)' }}>
            <p className="text-[10.5px] font-bold uppercase flex items-center gap-1.5" style={{ color: 'var(--pp-text3)', letterSpacing: '.05em' }}>
              <Send className="w-3.5 h-3.5" /> Estimado
            </p>
            {order.estimado?.respuesta === 'pendiente' && <div className="flex items-center gap-2 text-[13px] px-3 py-2 rounded-[10px]" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Clock className="w-4 h-4 flex-shrink-0" /> Esperando respuesta del taller…</div>}
            {order.estimado?.respuesta && order.estimado.respuesta !== 'pendiente' && (
              <div className="flex items-center gap-2 text-[13px] px-3 py-2 rounded-[10px]" style={{ background: order.estimado.respuesta === 'aceptado' ? '#eafaf2' : '#fdecec', color: order.estimado.respuesta === 'aceptado' ? '#059669' : '#dc2626' }}>
                {order.estimado.respuesta === 'aceptado' ? <ThumbsUp className="w-4 h-4 flex-shrink-0" /> : <ThumbsDown className="w-4 h-4 flex-shrink-0" />}
                El taller {order.estimado.respuesta === 'aceptado' ? 'aceptó' : 'rechazó'} este estimado.
              </div>
            )}
            {sent && <div className="flex items-center gap-2 text-[13px] px-3 py-2 rounded-[10px]" style={{ background: '#eafaf2', color: '#059669' }}><CheckCircle2 className="w-4 h-4" /> Estimado enviado.</div>}
            {sendError && <div className="flex items-center gap-2 text-[13px] px-3 py-2 rounded-[10px]" style={{ background: '#fdecec', color: '#dc2626' }}><AlertCircle className="w-4 h-4" />{sendError}</div>}
            <FormField label="Notas para el taller">
              <textarea value={notasEstimado} onChange={e => setNotasEstimado(e.target.value)} rows={3} placeholder="Tiempo de entrega, condiciones, precio…" className={`${inputClass} resize-none`} />
            </FormField>
            <FormField label="PDF del estimado (opcional)">
              <div className="space-y-2">
                {archivos.map((f, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 rounded-[10px] px-3 py-2 border" style={{ background: 'var(--pp-input-bg)', borderColor: 'var(--pp-border4)' }}>
                    <a href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[13px] truncate hover:underline" style={{ color: 'var(--pp-text2)' }}>
                      <FileText className="w-4 h-4 flex-shrink-0" /><span className="truncate">{f.name}</span>
                    </a>
                    <button type="button" onClick={() => handleRemoveFile(i)} style={{ color: 'var(--pp-text3)' }}><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <label className="flex items-center justify-center gap-2 border-dashed border rounded-[10px] px-3 py-2.5 text-[13px] cursor-pointer transition-colors hover:border-[#a0a0a0] hover:text-[#a0a0a0]" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
                  <Paperclip className="w-4 h-4" /> {archivos.length ? 'Adjuntar otro PDF' : 'Adjuntar PDF'}
                  <input type="file" accept="application/pdf" multiple onChange={handleFile} className="hidden" />
                </label>
              </div>
            </FormField>
            <button onClick={handleSendEstimate} disabled={sending} className="w-full py-[11px] rounded-[11px] text-white font-bold text-[13px] hover:bg-[#707070] disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: 'var(--pp-accent)' }}>
              <Send className="w-4 h-4" /> {sending ? 'Enviando…' : order.estimado ? 'Actualizar estimado' : 'Enviar estimado al taller'}
            </button>
          </div>

          {taller?.email && (
            <div className="space-y-2">
              <button type="button" onClick={() => setShowEmail(v => !v)} className="w-full py-[9px] rounded-[10px] text-[13px] font-semibold border flex items-center justify-center gap-2 hover:bg-[#1e1e1e] transition-colors" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
                <Mail className="w-4 h-4" /> Correo a {taller.email}
              </button>
              {showEmail && (() => {
                const subject = `Estimado · ${order.referencia || order.vehiculo}`;
                const body = [`Hola ${taller.contacto || ''},`, '', `Estimado para: ${order.vehiculo}`, notasEstimado ? `Notas: ${notasEstimado}` : '', '', 'Puedes verlo en Parts Pilot.', '', 'Saludos.'].filter((l, i) => !(i === 3 && !notasEstimado)).join('\n');
                return (
                  <div className="rounded-[12px] p-3 border space-y-2 text-[13px]" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
                    <div><span className="font-semibold" style={{ color: 'var(--pp-text2)' }}>Para: </span><span style={{ color: 'var(--pp-text)' }}>{taller.email}</span></div>
                    <div><span className="font-semibold" style={{ color: 'var(--pp-text2)' }}>Asunto: </span><span style={{ color: 'var(--pp-text)' }}>{subject}</span></div>
                    <textarea readOnly value={body} rows={4} className="w-full text-[12px] rounded-[10px] p-2 resize-none outline-none border" style={{ background: 'var(--pp-input-bg)', borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }} />
                    <button type="button" onClick={() => navigator.clipboard.writeText(`Para: ${taller.email}\nAsunto: ${subject}\n\n${body}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); })} className="w-full py-2 rounded-[10px] text-white text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-[#707070]" style={{ background: 'var(--pp-accent)' }}>
                      {copied ? <><CheckCircle2 className="w-4 h-4" /> ¡Copiado!</> : <><Paperclip className="w-4 h-4" /> Copiar correo</>}
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          <button type="button" onClick={handleShareLink}
            className="w-full py-[9px] rounded-[10px] text-[13px] font-semibold border flex items-center justify-center gap-2 hover:bg-[#1e1e1e] transition-colors"
            style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
            <Share2 className="w-4 h-4" /> Enviar link del pedido
          </button>

          <button type="button" onClick={() => { if (window.confirm('¿Eliminar este pedido? Esta acción no se puede deshacer.')) onDeleteOrder(order.id); }}
            className="w-full flex items-center justify-center gap-2 text-[13px] py-2.5 rounded-[10px] border border-dashed transition-colors hover:bg-red-50 hover:text-red-500" style={{ color: 'var(--pp-text10)', borderColor: '#f0b8b8' }}>
            <Trash2 className="w-4 h-4" /> Eliminar pedido
          </button>
        </div>
      </div>
    </div>
  );
}
