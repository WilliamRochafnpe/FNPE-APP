
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, ShieldCheck, Mail, RefreshCw, AlertCircle, CheckCircle2, MessageCircle } from 'lucide-react';
import { useApp } from '../App';
import { normalizeCpf, formatCpf } from '../utils/cpf';
import { recoveryService } from '../services/recovery';
import { auth as authProvider, IS_LOCAL } from '../services/auth';

type Step = 'ENTER_CPF' | 'SEND_CODE' | 'ENTER_CODE';

const AuthRecover: React.FC = () => {
  const { db, setUser } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [step, setStep] = useState<Step>('ENTER_CPF');
  const [cpf, setCpf] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);

  // Efeito para capturar CPF da URL
  useEffect(() => {
    const cpfParam = searchParams.get('cpf');
    if (cpfParam) {
      setCpf(formatCpf(cpfParam));
    }
  }, [searchParams]);

  const support = db.settings?.appSupport;

  const handleSupport = () => {
    const msg = encodeURIComponent("Olá! Meu CPF apareceu como já cadastrado no app FNPE e preciso de ajuda para acessar minha conta.");
    if (support?.supportWhatsApp) {
      window.open(`https://wa.me/${support.supportWhatsApp}?text=${msg}`, '_blank');
    } else if (support?.supportEmail) {
      window.open(`mailto:${support.supportEmail}?subject=Ajuda%20para%20acessar%20conta%20(CPF%20já%20cadastrado)&body=${msg}`, '_blank');
    }
  };

  const startRecovery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (normalizeCpf(cpf).length !== 11) return;

    setLoading(true);
    setError(null);

    const result = await recoveryService.requestRecoveryOtp(db, cpf);
    if (result.success) {
      setMaskedEmail(result.maskedEmail!);
      setStep('SEND_CODE');
      if (IS_LOCAL) {
        const raw = sessionStorage.getItem('fnpe_recovery_otp');
        if (raw) setDevCode(JSON.parse(raw).code);
      }
    } else {
      setError(result.error || 'Erro inesperado.');
    }
    setLoading(false);
  };

  const verifyRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setLoading(true);
    setError(null);

    const result = await recoveryService.verifyRecoveryOtp(cpf, code);
    if (result.success && result.email) {
      const user = await authProvider.findUserByEmail(db, result.email);
      if (user) {
        setUser(user);
        alert("Pronto! Você entrou na sua conta.");
        navigate('/app');
      }
    } else {
      setError(result.error || 'Código inválido.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => navigate('/login/email')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors font-bold uppercase text-xs tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Login
        </button>

        <div className="bg-white rounded-[40px] shadow-2xl p-10 border border-slate-100 overflow-hidden">
          {step === 'ENTER_CPF' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Vamos te ajudar a entrar</h2>
                <p className="text-slate-500 text-sm">Digite seu CPF para localizar sua conta.</p>
              </div>

              <form onSubmit={startRecovery} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Seu CPF</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                    <input
                      required
                      type="text"
                      value={cpf}
                      onChange={e => setCpf(formatCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || normalizeCpf(cpf).length !== 11}
                  className="w-full bg-indigo-600 text-white font-black uppercase text-xs tracking-widest py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                >
                  {loading ? "Buscando..." : "Continuar"}
                </button>
              </form>
            </div>
          )}

          {step === 'SEND_CODE' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Encontramos sua conta!</h2>
                  <p className="text-slate-500 text-sm mt-2">
                    Vamos enviar um código de recuperação para o e-mail cadastrado:<br />
                    <strong className="text-indigo-600 text-base">{maskedEmail}</strong>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setStep('ENTER_CODE')}
                  className="w-full bg-indigo-600 text-white font-black uppercase text-xs tracking-widest py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
                >
                  Enviar Código
                </button>
                <button
                  onClick={handleSupport}
                  className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 font-bold uppercase text-[10px] tracking-widest py-3 transition-colors"
                >
                  Não tenho mais acesso a esse e-mail
                </button>
              </div>
            </div>
          )}

          {step === 'ENTER_CODE' && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Digite o código</h2>
                <p className="text-slate-500 text-sm">Coloque aqui o código de 6 dígitos que enviamos para seu e-mail.</p>
              </div>

              <form onSubmit={verifyRecovery} className="space-y-6">
                <div>
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full bg-slate-50 border-none rounded-2xl py-6 text-center text-4xl font-black tracking-[0.5em] focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-indigo-600 text-white font-black uppercase text-xs tracking-widest py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
                >
                  {loading ? "Validando..." : "Confirmar e Entrar"}
                </button>

                <button
                  type="button"
                  onClick={startRecovery}
                  className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 font-bold uppercase text-[10px] tracking-widest py-2 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  Reenviar Código
                </button>
              </form>
            </div>
          )}

          {error && (
            <div className="mt-6 flex items-start gap-3 bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {IS_LOCAL && devCode && step === 'ENTER_CODE' && (
            <div className="mt-8 bg-amber-50 border border-amber-100 p-4 rounded-2xl text-center">
              <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">CÓDIGO DE RECUPERAÇÃO (DEV)</p>
              <p className="text-amber-600 font-mono text-lg font-bold">{devCode}</p>
            </div>
          )}
        </div>

        <div className="mt-10 text-center">
          <button 
            onClick={handleSupport}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-400 transition-colors font-bold text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Precisa de ajuda? Falar com a FNPE
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthRecover;
