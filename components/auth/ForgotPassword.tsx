
import React, { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabaseAuth } from '../../services/auth/supabaseAuth';
import { supabase } from '../../lib/supabase';

interface ForgotPasswordProps {
    onBack: () => void;
    onCodeSent: (email: string) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, onCodeSent }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [maskedEmail, setMaskedEmail] = useState('');

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const user = await supabaseAuth.checkUserStatus(email);
            if (user) {
                // Mask email
                const parts = email.split('@');
                const mask = parts[0].substring(0, 2) + '***@' + parts[1];
                setMaskedEmail(mask);
                setConfirmed(true);
            } else {
                setError('E-mail não encontrado.');
            }
        } catch (err) {
            setError('Erro ao buscar usuário.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendRecovery = async () => {
        setLoading(true);
        try {
            await supabase.auth.resetPasswordForEmail(email);
            onCodeSent(email);
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar código.');
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
                <h2 className="text-2xl font-black text-white tracking-tight">Recuperar Senha</h2>
                <p className="text-slate-400 text-sm">Informe seu e-mail para continuar.</p>
            </div>

            {!confirmed ? (
                <form onSubmit={handleLookup} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">E-mail Cadastrado</label>
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
                    {error && <div className="text-red-400 text-xs font-bold">{error}</div>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                        {loading ? 'Buscando...' : 'Buscar Conta'}
                    </button>
                </form>
            ) : (
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-6">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-500">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-300">Confirma que este é seu e-mail?</p>
                        <p className="text-lg font-black text-white mt-1">{maskedEmail}</p>
                    </div>
                    <button
                        onClick={handleSendRecovery}
                        disabled={loading}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-widest py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                        {loading ? 'Enviando...' : 'Sim, Enviar Código'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ForgotPassword;
