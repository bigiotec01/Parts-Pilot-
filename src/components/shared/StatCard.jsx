export function StatCard({ label, value, icon: Icon, iconBg, iconColor, chipLabel, chipBg, chipColor, highlight }) {
  return (
    <div className="rounded-[15px] p-[18px]" style={{ background: 'var(--pp-card)', border: `1px solid ${highlight ? 'rgba(160,160,160,0.25)' : 'var(--pp-border)'}` }}>
      <div className="flex items-center justify-between mb-3.5">
        <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center" style={{ background: iconBg, color: iconColor }}>
          <Icon className="w-[19px] h-[19px]" strokeWidth={1.8} />
        </div>
        {chipLabel && <span className="text-[11px] font-bold px-2 py-0.5 rounded-[7px]" style={{ background: chipBg, color: chipColor }}>{chipLabel}</span>}
      </div>
      <p className="text-[30px] font-extrabold leading-none" style={{ color: 'var(--pp-text)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em' }}>{value}</p>
      <p className="text-[12.5px] font-medium mt-1.5" style={{ color: 'var(--pp-text2)' }}>{label}</p>
    </div>
  );
}
