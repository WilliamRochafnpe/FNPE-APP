
import React, { useState } from 'react';
import { Lock, Check, X, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { supabaseAuth } from '../../services/auth/supabaseAuth';
import { useApp } from '../../App';

interface SetPasswordProps {
    onSuccess: () => void;
}

const SetPassword: React.FC<SetPasswordProps> = ({ onSuccess }) => {
    const { user, setUser } = useApp();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const rules = {
        min: password.length >= 6,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[@$!%*?&#]/.test(password),
        match: password === confirm && password.length > 0
    };

    const isStrong = Object.values(rules).every(Boolean);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isStrong) return;
        setLoading(true);
        setError('');

        try {
            await supabaseAuth.updatePassword(password);
            if (user) {
                await supabaseAuth.markPasswordDefined(user.id);
                // Update local state to prevent redirect loops
                setUser({ ...user, password_defined: true } as any);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Erro ao definir senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                    <ShieldCheck className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Criação de Senha</h2>
                <p className="text-slate-400 text-sm">Para sua segurança, defina uma senha forte.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                    <div className="relative group">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full px-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none pr-12"
                            placeholder="Nova Senha"
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
                    <div className="relative group">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className="block w-full px-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none pr-12"
                            placeholder="Confirme a Senha"
                        />
                    </div>
                </div>

                {/* Password Strength Indicators */}
                <div className="bg-slate-900/50 p-4 rounded-xl space-y-2 border border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Requisitos:</p>
                    <RuleItem valid={rules.min} label="Mínimo 6 caracteres" />
                    <RuleItem valid={rules.upper} label="Letra Maiúscula" />
                    <RuleItem valid={rules.lower} label="Letra minúscula" />
                    <RuleItem valid={rules.number} label="Número" />
                    <RuleItem valid={rules.special} label="Caractere Especial (@$!%*?&#)" />
                    <RuleItem valid={rules.match} label="Senhas conferem" />
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
                        ⚠️ {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !isStrong}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-widest py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                    {loading ? 'Salvando...' : 'Definir Senha e Entrar'}
                </button>
            </form>
        </div>
    );
};

const RuleItem = ({ valid, label }: { valid: boolean, label: string }) => (
    <div className={`flex items-center gap-2 text-xs font-bold transition-colors ${valid ? 'text-emerald-400' : 'text-slate-600'}`}>
        {valid ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}
        {label}
    </div>
);

export default SetPassword;
