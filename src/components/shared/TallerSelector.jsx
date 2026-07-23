// Selector de acceso a talleres para un miembro del equipo: `null` = acceso a todos
// los talleres de la empresa; array = acceso restringido solo a esos talleres.
export function TallerSelector({ talleres, value, onChange }) {
  const restringido = Array.isArray(value);

  const toggleTaller = (uid) => {
    if (!restringido) return;
    onChange(value.includes(uid) ? value.filter(id => id !== uid) : [...value, uid]);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-[13px] font-medium" style={{ color: 'var(--pp-text)' }}>Acceso a talleres</span>
        <div className="flex gap-1">
          <button type="button" onClick={() => onChange(null)}
            className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border transition-all"
            style={{ background: !restringido ? 'var(--pp-active-bg2)' : 'var(--pp-card)', color: !restringido ? 'var(--pp-text6)' : 'var(--pp-text2)', borderColor: !restringido ? 'rgba(200,200,200,0.3)' : 'var(--pp-surface)' }}>
            Todos
          </button>
          <button type="button" onClick={() => onChange(value || [])}
            className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border transition-all"
            style={{ background: restringido ? 'var(--pp-active-bg2)' : 'var(--pp-card)', color: restringido ? 'var(--pp-text6)' : 'var(--pp-text2)', borderColor: restringido ? 'rgba(200,200,200,0.3)' : 'var(--pp-surface)' }}>
            Específicos
          </button>
        </div>
      </div>
      {restringido && (
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 rounded-[9px]" style={{ background: 'var(--pp-card)' }}>
          {talleres.length === 0 && <span className="text-[12px]" style={{ color: 'var(--pp-text3)' }}>No hay talleres registrados todavía.</span>}
          {talleres.map(t => {
            const checked = value.includes(t.uid);
            return (
              <button key={t.uid} type="button" onClick={() => toggleTaller(t.uid)}
                className="px-2.5 py-1 rounded-[7px] text-[12px] font-medium border transition-all"
                style={{ background: checked ? 'var(--pp-active-bg2)' : 'var(--pp-bg)', color: checked ? 'var(--pp-text6)' : 'var(--pp-text2)', borderColor: checked ? 'rgba(200,200,200,0.3)' : 'var(--pp-surface)' }}>
                {t.nombre}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Etiqueta de solo-lectura para mostrar el acceso a talleres de un miembro ya creado.
export function TallerAccessBadge({ tallerIds, talleres }) {
  if (!Array.isArray(tallerIds)) {
    return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[7px]" style={{ background: 'var(--pp-active-bg2)', color: 'var(--pp-text6)' }}>Todos</span>;
  }
  const nombres = tallerIds.map(id => talleres.find(t => t.uid === id)?.nombre).filter(Boolean);
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[7px]" style={{ background: 'rgba(180,180,180,0.1)', color: 'var(--pp-text3)' }} title={nombres.join(', ')}>
      {tallerIds.length === 0 ? 'Ninguno' : `${tallerIds.length} taller${tallerIds.length === 1 ? '' : 'es'}`}
    </span>
  );
}
