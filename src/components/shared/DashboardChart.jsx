export function DashboardChart({ pedidos }) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: d.toLocaleDateString('es-MX', { month: 'short' }), year: d.getFullYear(), month: d.getMonth(), total: 0, entregados: 0 };
  });
  pedidos.forEach(p => {
    const d = p.fecha?.toDate ? p.fecha.toDate() : new Date(p.fecha);
    const m = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
    if (m) { m.total++; if (p.estado === 'entregado') m.entregados++; }
  });
  const max = Math.max(...months.map(m => m.total), 1);
  const H = 150;
  return (
    <div className="mt-5">
      <div className="flex items-end gap-3.5" style={{ height: H }}>
        {months.map((m, i) => {
          const totalPx = (m.total / max) * H;
          const donePx = m.total > 0 ? (m.entregados / m.total) * totalPx : 0;
          const procPx = totalPx - donePx;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              {m.total > 0 && <span className="text-[11.5px] font-bold" style={{ color: 'var(--pp-text3)' }}>{m.total}</span>}
              <div className="w-full max-w-[46px] rounded-[7px] overflow-hidden flex flex-col justify-end" style={{ height: totalPx || 0 }}>
                {procPx > 0 && <div style={{ background: 'var(--pp-accent)', height: procPx }} />}
                {donePx > 0 && <div style={{ background: '#14b8a6', height: donePx }} />}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-3.5 mt-2">
        {months.map((m, i) => <div key={i} className="flex-1 text-center text-[11.5px] font-semibold capitalize" style={{ color: 'var(--pp-text10)' }}>{m.label}</div>)}
      </div>
      <div className="flex items-center gap-4 mt-3">
        <span className="flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: 'var(--pp-text2)' }}><span className="w-2.5 h-2.5 rounded-[3px] inline-block" style={{ background: 'var(--pp-accent)' }} />En proceso</span>
        <span className="flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: 'var(--pp-text2)' }}><span className="w-2.5 h-2.5 rounded-[3px] inline-block" style={{ background: '#14b8a6' }} />Completados</span>
      </div>
    </div>
  );
}
