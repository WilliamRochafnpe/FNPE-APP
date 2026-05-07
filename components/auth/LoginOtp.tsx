
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { IS_SUPABASE } from '../../services/auth';

interface LoginOtpProps {
    email: string;
    onSuccess: () => void;
    onBack: () => void;
}

const LoginOtp: React.FC<LoginOtpProps> = ({ email, onSuccess, onBack }) => {
    const navigate = useNavigate();
    const { verifyOtp, findUserByEmail, loginAs, requestOtp } = useAuth();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resending, setResending] = useState(false);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = window.setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
        return () => window.clearInterval(t);
    }, [resendCooldown]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError('O código deve ter 6 dígitos.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const result = await verifyOtp(email, otp);
            if (result.success) {
                if (!IS_SUPABASE) {
                    const profile = await findUserByEmail(email);
                    if (profile?.nome_completo && profile?.cpf) {
                        loginAs(profile);
                    } else {
                        navigate(`/login/perfil?email=${encodeURIComponent(email)}`);
                    }
                } else if (result.profileIncomplete) {
                    navigate(`/login/perfil?email=${encodeURIComponent(email)}`);
                }
                onSuccess();
            } else {
                setError(result.error || 'Código inválido ou expirado.');
            }
        } catch (err: any) {
            setError(err.message || 'Erro de validação.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || resending) return;
        setError('');
        setInfo('');
        setResending(true);
        try {
            await requestOtp(email);
            setResendCooldown(60);
            setInfo(
                IS_SUPABASE
                    ? 'Novo código solicitado. Verifique a caixa de entrada, spam e a pasta “Outros” (Outlook/Hotmail).'
                    : 'Novo código gerado — veja o console do navegador (F12 → aba Console).'
            );
        } catch (err: any) {
            setError(err.message || 'Não foi possível reenviar.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <button onClick={onBack} className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4">
                <ArrowLeft className="w-4 h-4" /> Voltar
            </button>

            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight">Validar Acesso</h2>
                <p className="text-slate-400 text-sm">Digite o código de 6 dígitos enviado para <br /><span className="text-emerald-400 font-mono">{email}</span></p>
            </div>

            {IS_SUPABASE ? (
                <div className="rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-3 text-left text-[11px] leading-relaxed text-slate-400">
                    <p className="font-bold text-slate-300 mb-1">Não recebeu o e-mail?</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Aguarde 1–3 minutos e confira <span className="text-slate-300">spam / lixeira / Promoções</span> (Gmail) ou <span className="text-slate-300">Lixo / Spam</span> (Outlook/Hotmail).</li>
                        <li>No painel Supabase: <span className="text-slate-300">Authentication → Users</span> e <span className="text-slate-300">Logs</span> para ver se o envio foi aceito.</li>
                        <li>Para produção, configure <span className="text-slate-300">SMTP próprio</span> em Project Settings → Auth (melhora entrega no Hotmail).</li>
                    </ul>
                </div>
            ) : (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[11px] font-bold text-amber-100/90">
                    Modo local: o código aparece no <span className="underline">Console do navegador</span> (F12), não por e-mail.
                </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Código de 6 Dígitos</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <KeyRound className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            maxLength={6}
                            required
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            className="block w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none font-mono text-xl tracking-[0.5em] text-center"
                            placeholder="______"
                            autoComplete="one-time-code"
                            inputMode="numeric"
                        />
                    </div>
                </div>

                {info && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-200/90 text-xs font-semibold">
                        {info}
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
                        ⚠️ {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-widest py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
                >
                    {loading ? 'Validando...' : (
                        <>
                            Confirmar Código <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>

                <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || resendCooldown > 0}
                    className="w-full flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white border border-slate-800 rounded-xl hover:border-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : resending ? 'Enviando...' : 'Reenviar código'}
                </button>
            </form>
        </div>
    );
};

export default LoginOtp;
