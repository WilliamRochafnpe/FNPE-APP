
import React, { useState } from 'react';
import { KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabaseAuth } from '../../services/auth/supabaseAuth';

interface LoginOtpProps {
    email: string;
    onSuccess: () => void;
    onBack: () => void;
}

const LoginOtp: React.FC<LoginOtpProps> = ({ email, onSuccess, onBack }) => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError('O código deve ter 6 dígitos.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const result = await supabaseAuth.verifyOtp(email, otp);
            if (result.success) {
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

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <button onClick={onBack} className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4">
                <ArrowLeft className="w-4 h-4" /> Voltar
            </button>

            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight">Validar Acesso</h2>
                <p className="text-slate-400 text-sm">Digite o código enviado para <br /><span className="text-emerald-400 font-mono">{email}</span></p>
            </div>

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
                            placeholder="000000"
                        />
                    </div>
                </div>

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
            </form>
        </div>
    );
};

export default LoginOtp;
