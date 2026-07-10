import { useState } from 'react';
import {
  AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { FormField } from './FormField';
import { inputClass } from '../../constants/styles';

export function LoginScreen({ onLogin, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email.trim(), password.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--pp-bg)' }}>
      <div className="w-full max-w-[400px]" style={{ animation: 'ppRise .5s ease both' }}>
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center rounded-[16px] mb-[18px]" style={{ width: 60, height: 60, background: 'linear-gradient(160deg, #f97316, #ea580c)', boxShadow: '0 12px 30px -8px rgba(249,115,22,0.4)' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M12 2.5 21 19.5 12 15.2 3 19.5 12 2.5Z" fill="#fff"/></svg>
          </div>
          <h1 className="font-extrabold text-[26px] tracking-tight" style={{ color: 'var(--pp-text)', letterSpacing: '-.02em' }}>Parts Pilot</h1>
          <p className="mt-1.5 text-[13.5px] font-medium" style={{ color: 'var(--pp-text2)' }}>Portal de pedidos · Departamento de Piezas</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[18px] p-7 space-y-4" style={{ background: 'var(--pp-card)', boxShadow: '0 30px 60px -20px rgba(0,0,0,.5)' }}>
          <FormField label="Correo electrónico">
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="tu@correo.com" className={inputClass} required />
          </FormField>
          <FormField label="Contraseña">
            <div className="relative">
              <input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="••••••" className={`${inputClass} pr-10`} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--pp-text3)' }}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>
          {error && (
            <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-[11px]" style={{ background: '#fdecec', color: '#dc2626' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          <button type="submit" className="w-full py-[13px] rounded-[11px] text-white font-bold text-[14.5px] transition-all hover:brightness-105" style={{ background: 'linear-gradient(160deg, #f97316, #ea580c)', boxShadow: '0 10px 22px -10px rgba(249,115,22,0.5)' }}>
            Iniciar sesión
          </button>
        </form>

        <p className="text-center mt-6 text-[11.5px] leading-loose" style={{ color: 'var(--pp-text2)' }}>
          © 2026 Parts Pilot · Todos los derechos reservados.<br />
          Soporte: <a href="mailto:Bigio_tec@me.com" style={{ color: 'var(--pp-text9)' }}>Bigio_tec@me.com</a>
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  VISTA ADMINISTRADOR                                                */
/* ------------------------------------------------------------------ */
