
import React, { useState } from 'react';
import { Mail, ArrowRight, Lock } from 'lucide-react';
import { supabaseAuth } from '../../services/auth/supabaseAuth';

interface LoginIdentifierProps {
    onSuccess: (email: string) => void;
    onGoToPassword: () => void;
}

const LoginIdentifier: React.FC<LoginIdentifierProps> = ({ onSuccess, onGoToPassword }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Check status first
            const status = await supabaseAuth.checkUserStatus(email);
            if (status && status.password_defined) {
                setError('Este e-mail já possui senha cadastrada. Por favor, entre usando sua senha.');
                setLoading(false);
                return;
            }

            await supabaseAuth.requestOtp(email);
            onSuccess(email);
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar código.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight">Entrar na Conta</h2>
                <p className="text-slate-400 text-sm">Acesse sua ID Norte e rankings</p>
            </div>

            <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">E-mail de Acesso</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                        </div>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none font-medium"
                            placeholder="seu@email.com"
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
                    disabled={loading || !email}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-widest py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
                >
                    {loading ? 'Enviando...' : (
                        <>
                            Receber Código <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </form>

            <div className="pt-6 border-t border-slate-800 text-center">
                <button
                    onClick={onGoToPassword}
                    className="text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto group"
                >
                    <Lock className="w-3 h-3 group-hover:text-emerald-500 transition-colors" />
                    Já tenho senha definida
                </button>
            </div>
        </div>
    );
};

export default LoginIdentifier;
