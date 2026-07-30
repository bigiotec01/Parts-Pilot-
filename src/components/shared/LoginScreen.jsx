import { useState } from 'react';
import {
  AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff
} from 'lucide-react';
import { FormField } from './FormField';
import { inputClass } from '../../constants/styles';

export function LoginScreen({ onLogin, onResetPassword, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [modoReset, setModoReset] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email.trim(), password.trim());
  };

  if (modoReset) {
    return <ResetPasswordScreen onVolver={() => setModoReset(false)} onResetPassword={onResetPassword} emailInicial={email} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--pp-bg)' }}>
      <div className="w-full max-w-[400px]" style={{ animation: 'ppRise .5s ease both' }}>
        <div className="text-center mb-7">
          <img src="/pwa-192x192.png" alt="Parts Pilot" className="mx-auto mb-[18px] rounded-[16px]" style={{ width: 60, height: 60, boxShadow: '0 12px 30px -8px rgba(0,0,0,0.5)' }} />
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
          <button type="button" onClick={() => setModoReset(true)} className="text-[12.5px] font-semibold -mt-1" style={{ color: 'var(--pp-text9)' }}>
            ¿Olvidaste tu contraseña?
          </button>
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
          Soporte: <a href="mailto:bigio_tec@me.com" style={{ color: 'var(--pp-text9)' }}>bigio_tec@me.com</a>
        </p>
      </div>
    </div>
  );
}

function ResetPasswordScreen({ onVolver, onResetPassword, emailInicial }) {
  const [email, setEmail] = useState(emailInicial || '');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    const res = await onResetPassword(email.trim());
    setEnviando(false);
    if (res.ok) setEnviado(true);
    else setError(res.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--pp-bg)' }}>
      <div className="w-full max-w-[400px]" style={{ animation: 'ppRise .5s ease both' }}>
        <div className="text-center mb-7">
          <img src="/pwa-192x192.png" alt="Parts Pilot" className="mx-auto mb-[18px] rounded-[16px]" style={{ width: 60, height: 60, boxShadow: '0 12px 30px -8px rgba(0,0,0,0.5)' }} />
          <h1 className="font-extrabold text-[26px] tracking-tight" style={{ color: 'var(--pp-text)', letterSpacing: '-.02em' }}>Parts Pilot</h1>
          <p className="mt-1.5 text-[13.5px] font-medium" style={{ color: 'var(--pp-text2)' }}>Recuperar contraseña</p>
        </div>

        <div className="rounded-[18px] p-7 space-y-4" style={{ background: 'var(--pp-card)', boxShadow: '0 30px 60px -20px rgba(0,0,0,.5)' }}>
          {enviado ? (
            <div className="text-center space-y-3 py-2">
              <CheckCircle2 className="w-10 h-10 mx-auto" style={{ color: '#10b981' }} />
              <p className="text-[13.5px]" style={{ color: 'var(--pp-text2)' }}>
                Te enviamos un correo a <strong>{email}</strong> con instrucciones para restablecer tu contraseña.
              </p>
              <button onClick={onVolver} className="text-[12.5px] font-semibold" style={{ color: 'var(--pp-text9)' }}>
                Volver a iniciar sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-[13px]" style={{ color: 'var(--pp-text2)' }}>
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              <FormField label="Correo electrónico">
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="tu@correo.com" className={inputClass} required autoFocus />
              </FormField>
              {error && (
                <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-[11px]" style={{ background: '#fdecec', color: '#dc2626' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}
              <button disabled={enviando} type="submit" className="w-full py-[13px] rounded-[11px] text-white font-bold text-[14.5px] transition-all hover:brightness-105 disabled:opacity-50" style={{ background: 'linear-gradient(160deg, #f97316, #ea580c)', boxShadow: '0 10px 22px -10px rgba(249,115,22,0.5)' }}>
                {enviando ? 'Enviando…' : 'Enviar enlace'}
              </button>
              <button type="button" onClick={onVolver} className="w-full flex items-center justify-center gap-1.5 text-[12.5px] font-semibold py-1" style={{ color: 'var(--pp-text2)' }}>
                <ArrowLeft className="w-3.5 h-3.5" /> Volver a iniciar sesión
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  VISTA ADMINISTRADOR                                                */
/* ------------------------------------------------------------------ */
