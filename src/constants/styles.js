export const inputClass = "w-full px-3.5 py-[11px] rounded-[11px] border border-[#2a2a2a] text-[16px] outline-none transition-all focus:border-[#C6202B] focus:ring-2 focus:ring-[#C6202B]/10 bg-[#101010] text-[#e8e8e8]";

/* ------------------------------------------------------------------ */
/*  LOGIN                                                              */
/* ------------------------------------------------------------------ */

// Botones secundarios / selectores de vista: estilo neutro. El rojo de marca
// (--pp-accent) queda reservado para la acción principal (ej. "Nuevo pedido").
export const SEG_ACTIVE = { background: 'var(--pp-text)', color: 'var(--pp-card)' };
export const SEG_IDLE = { background: 'transparent', color: 'var(--pp-text2)' };
export const secondaryBtnClass = 'flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg border transition-colors flex-shrink-0 hover:bg-[var(--pp-hover)] disabled:opacity-60';
export const secondaryBtnStyle = { borderColor: 'var(--pp-border4)', color: 'var(--pp-text)', background: 'var(--pp-card)' };
