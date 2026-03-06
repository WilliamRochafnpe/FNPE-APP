
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ArrowRight, Waves, Shield, User as UserIcon, Trophy } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { IS_LOCAL } from '../services/auth';
import FnpeLogo from '../components/FnpeLogo';

const AuthEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [emailInput, setEmailInput] = useState(email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { requestOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (email) setEmailInput(email);
  }, [email]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      await requestOtp(emailInput);
      navigate(`/login/codigo?email=${encodeURIComponent(emailInput)}`);
    } catch (err: any) {
      console.error("Erro ao solicitar OTP:", err);
      // Se o erro for um objeto vazio ou sem mensagem (comum em timeouts 504/502), define mensagem padrão
      const msg = (err && err.message) ? err.message : "Erro de conexão com o servidor. Tente novamente em 1 minuto.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (type: 'admin' | 'pescador' | 'atleta') => {
    const emails = {
      admin: 'williamrocha_25@icloud.com',
      pescador: 'pescador@demo.com',
      atleta: 'atleta@demo.com'
    };
    setEmailInput(emails[type]);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <Waves className="w-[1000px] h-[1000px] absolute -top-40 -left-40 text-emerald-500" />
      </div>

      <div className="w-full max-w-[440px] z-10 animate-in fade-in zoom-in duration-700">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-40 h-40 mb-6 rotate-3 transform hover:rotate-0 transition-all duration-300 mx-auto">
            <FnpeLogo className="w-full h-full object-contain drop-shadow-2xl" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2">FNPE</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed">
            FEDERAÇÃO NORTE DE PESCA ESPORTIVA
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900 rounded-[48px] shadow-2xl p-8 md:p-12 border border-slate-800/50 backdrop-blur-sm">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-white tracking-tight">Entrar na Conta</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">Acesse sua ID Norte e rankings</p>
          </div>

          <form onSubmit={handleSend} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                E-mail de Acesso
              </label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 w-5 h-5 transition-colors" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium placeholder:text-slate-700"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 py-3 px-4 rounded-xl">
                <p className="text-red-400 text-[10px] font-bold text-center uppercase tracking-wider">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-slate-950 font-black uppercase text-xs tracking-[0.15em] py-5 rounded-2xl hover:bg-emerald-400 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  Receber Código
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Logins */}
          {IS_LOCAL && (
            <div className="mt-10 pt-8 border-t border-slate-800/50">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center mb-5">Acesso Rápido para Testes</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => demoLogin('admin')} className="flex flex-col items-center gap-2 group">
                  <div className="p-4 bg-slate-800 group-hover:bg-slate-700 group-hover:text-emerald-400 rounded-2xl text-slate-500 transition-all shadow-sm border border-slate-700/50"><Shield className="w-5 h-5" /></div>
                  <span className="text-[8px] font-black uppercase text-slate-600">ADM</span>
                </button>
                <button onClick={() => demoLogin('atleta')} className="flex flex-col items-center gap-2 group">
                  <div className="p-4 bg-slate-800 group-hover:bg-slate-700 group-hover:text-amber-400 rounded-2xl text-slate-500 transition-all shadow-sm border border-slate-700/50"><Trophy className="w-5 h-5" /></div>
                  <span className="text-[8px] font-black uppercase text-slate-600">Atleta</span>
                </button>
                <button onClick={() => demoLogin('pescador')} className="flex flex-col items-center gap-2 group">
                  <div className="p-4 bg-slate-800 group-hover:bg-slate-700 group-hover:text-slate-300 rounded-2xl text-slate-500 transition-all shadow-sm border border-slate-700/50"><UserIcon className="w-5 h-5" /></div>
                  <span className="text-[8px] font-black uppercase text-slate-600">Pescador</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Credits */}
        <div className="mt-12 space-y-2">
          <p className="text-center text-slate-600 text-[10px] font-black uppercase tracking-widest opacity-80">
            © 2025 Federação Norte de Pesca Esportiva
          </p>
          <p className="text-center text-slate-700 text-[10px] font-black uppercase tracking-[0.2em]">
            Desenvolvido por <span className="text-slate-500">Rocha & Castro Ltda</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthEmail;
