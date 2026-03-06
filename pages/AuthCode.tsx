
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { IS_LOCAL } from '../services/auth';

const AuthCode: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { verifyOtp, findUserByEmail, loginAs, requestOtp } = useAuth();

  const codeString = otp.join('');

  useEffect(() => {
    if (!email) navigate('/login/email');
    
    if (IS_LOCAL) {
      const raw = sessionStorage.getItem('fnpe_otp_store');
      if (raw) setDevCode(JSON.parse(raw).code);
    }

    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [email, navigate]);

  const handleBack = () => {
    navigate(`/login/email?email=${encodeURIComponent(email)}`);
  };

  const handleChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, 6);
    if (data) {
      const newOtp = data.split('');
      const filledOtp = [...newOtp, ...Array(6 - newOtp.length).fill('')].slice(0, 6);
      setOtp(filledOtp);
      const lastIndex = Math.min(data.length, 5);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codeString.length !== 6 || loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await verifyOtp(email, codeString);
      
      if (result.success) {
        // Busca o perfil atualizado do banco
        const userProfile = await findUserByEmail(email);
        
        if (userProfile && userProfile.nome_completo && userProfile.cpf) {
          loginAs(userProfile);
          navigate('/app', { replace: true });
        } else {
          // Se não houver perfil completo, redireciona para completar
          navigate(`/login/perfil?email=${encodeURIComponent(email)}`, { replace: true });
        }
      } else {
        setError(result.error || 'Código inválido.');
        setLoading(false);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.message || "Erro inesperado.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await requestOtp(email);
      if (IS_LOCAL) {
        const raw = sessionStorage.getItem('fnpe_otp_store');
        if (raw) setDevCode(JSON.parse(raw).code);
      }
      alert("Um novo código foi enviado para seu e-mail.");
    } catch (err: any) {
      alert("Erro ao reenviar código: " + (err.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-500 z-10 pointer-events-auto">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-400 mb-8 transition-colors font-black uppercase text-[10px] tracking-[0.2em] group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Alterar E-mail
        </button>

        <div className="bg-slate-900 rounded-[40px] shadow-2xl p-8 md:p-10 border border-slate-800 relative">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-emerald-50/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Verificação</h2>
            <p className="text-slate-500 text-xs mt-2 font-medium">
              Digite os 6 dígitos enviados para<br />
              <strong className="text-slate-300">{email}</strong>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-8">
            <div className="flex justify-between gap-2 md:gap-3" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(e.target.value, index)}
                  onKeyDown={e => handleKeyDown(e, index)}
                  className="w-full aspect-square bg-slate-950 border border-slate-800 rounded-2xl text-center text-2xl font-black text-emerald-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-inner"
                  required
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-400/5 p-4 rounded-2xl text-xs font-bold border border-red-400/10 animate-in shake duration-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || codeString.length !== 6}
              className="w-full bg-emerald-500 text-slate-950 font-black uppercase text-xs tracking-widest py-5 rounded-2xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? "Validando..." : "Confirmar Código"}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-emerald-400 font-black uppercase text-[10px] tracking-widest py-2 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Reenviar Código
            </button>
          </form>

          {IS_LOCAL && devCode && (
            <div className="mt-8 bg-slate-950/50 border border-slate-800 p-4 rounded-2xl text-center">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">CÓDIGO (DEBUG)</p>
              <p className="text-emerald-500 font-mono text-xl font-black tracking-widest">{devCode}</p>
            </div>
          )}
        </div>
        
        <p className="text-center mt-8 text-slate-700 text-[10px] font-black uppercase tracking-[0.3em]">
          FNPE • Segurança Digital
        </p>
      </div>
    </div>
  );
};

export default AuthCode;
