
import React, { useState } from 'react';
import { Lock, ArrowRight, ArrowLeft, Mail, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { supabaseAuth } from '../../services/auth/supabaseAuth';

interface LoginPasswordProps {
    onSuccess: () => void;
    onBack: () => void;
    onForgotPassword: () => void;
}

const LoginPassword: React.FC<LoginPasswordProps> = ({ onSuccess, onBack, onForgotPassword }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const withTimeout = <T,>(promise: Promise<T>, ms: number = 30000): Promise<T> => {
            return Promise.race([
                promise,
                new Promise<T>((_, reject) => setTimeout(() => reject(new Error("OFFLINE_TIMEOUT")), ms))
            ]);
        };

        try {
            // Check status with timeout
            const status = await withTimeout(supabaseAuth.checkUserStatus(email));

            if (status && !status.password_defined) {
                setError('Este usuário ainda não definiu senha. Use a opção "Receber Código" na tela inicial.');
                setLoading(false);
                return;
            }

            // Sign in with timeout
            const { error } = await withTimeout(supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password
            }));

            if (error) throw error;
            onSuccess();
        } catch (err: any) {
            if (err.message === "OFFLINE_TIMEOUT") {
                setError('Tempo de conexão esgotado. Verifique sua internet e tente novamente.');
            } else {
                setError(err.message || 'Credenciais inválidas ou erro no login.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <button onClick={onBack} className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4">
                <ArrowLeft className="w-4 h-4" /> Voltar para Código
            </button>

            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight">Login com Senha</h2>
                <p className="text-slate-400 text-sm">Apenas para usuários com cadastro completo.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">E-mail</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                        </div>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                            placeholder="seu@email.com"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Senha</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full pl-12 pr-12 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                            placeholder="Sua senha"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="text-right">
                    <button type="button" onClick={onForgotPassword} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">
                        Esqueci a senha
                    </button>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
                        ⚠️ {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-widest py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                    {loading ? 'Entrando...' : (
                        <>
                            Entrar <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default LoginPassword;
