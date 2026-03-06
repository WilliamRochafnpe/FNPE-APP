
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  AlertCircle, 
  User as UserIcon, 
  CreditCard, 
  Phone, 
  Calendar, 
  Heart, 
  Loader2, 
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { normalizeCpf, formatCpf, isCpfValid } from '../utils/cpf';
import StateCitySelect from '../components/StateCitySelect';
import { supabase, SUPABASE_ENABLED } from '../lib/supabase';
import { useApp } from '../App';

const formatPhone = (v: string) => {
  const digits = v.replace(/\D/g, '');
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return digits.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2 $3-$4");
};

const AuthCompleteProfile: React.FC = () => {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const navigate = useNavigate();
  const { registerAndLogin } = useAuth();
  const { user: currentUser, db } = useApp();

  const [formData, setFormData] = useState({
    nome_completo: '',
    cpf: '',
    telefone: '',
    cidade: '',
    uf: '',
    sexo: '',
    data_nascimento: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateUser, setDuplicateUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    // Só redireciona se o perfil estiver REALMENTE completo de acordo com a regra do AppRoutes
    if (currentUser?.cpf && currentUser?.nome_completo) {
      navigate('/app', { replace: true });
    }
  }, [currentUser, navigate]);

  const maskEmailPreview = (email: string) => {
    if (!email || !email.includes('@')) return '***@***.com';
    const [userPart, domain] = email.split('@');
    return `${userPart[0]}***@${domain}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setError(null);
    setDuplicateUser(null);

    const cpfDigits = normalizeCpf(formData.cpf);

    if (!isCpfValid(cpfDigits)) {
      setError('CPF matematicamente inválido. Verifique os dígitos.');
      return;
    }

    if (!formData.nome_completo.trim() || !formData.sexo || !formData.data_nascimento || !formData.uf || !formData.cidade) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);

    try {
      let existingEmail: string | null = null;

      if (SUPABASE_ENABLED) {
        const { data: existingAtleta, error: checkError } = await supabase
          .from('atletas')
          .select('email')
          .eq('cpf', cpfDigits)
          .maybeSingle();

        if (checkError) throw new Error("Falha na comunicação com o banco de dados.");
        existingEmail = existingAtleta?.email || null;
      } else {
        const foundLocal = db.users.find(u => normalizeCpf(u.cpf || '') === cpfDigits);
        existingEmail = foundLocal ? foundLocal.email : null;
      }

      if (existingEmail && existingEmail.toLowerCase() !== (emailParam || currentUser?.email || '').toLowerCase()) {
        setDuplicateUser({ email: existingEmail });
        setLoading(false); 
        return;
      }

      await registerAndLogin({
        email: emailParam || currentUser?.email || 'offline-user@fnpe.com',
        nomeCompleto: formData.nome_completo.trim(),
        cpf: cpfDigits,
        telefone: formData.telefone.replace(/\D/g, ''),
        cidade: formData.cidade.trim(),
        estado: formData.uf.trim().toUpperCase(),
        sexo: formData.sexo,
        dataNascimento: formData.data_nascimento
      });

      // O redirecionamento será tratado pelo useEffect acima após o setUser do registerAndLogin
      
    } catch (err: any) {
      console.error("Erro no cadastro:", err);
      setError(err.message || 'Erro ao processar seu cadastro.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-800 animate-in fade-in zoom-in duration-500">
        
        <div className="bg-[#6C4DE4] p-8 text-center">
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Completar Perfil</h1>
          <p className="text-white/80 text-xs font-medium mt-1 italic">{emailParam || currentUser?.email || 'Sessão Offline'}</p>
        </div>

        {duplicateUser ? (
          <div className="p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white uppercase">CPF já vinculado</h2>
              <p className="text-slate-400 text-sm">Este CPF pertence à conta:</p>
              <div className="bg-slate-950 py-3 rounded-xl border border-slate-800">
                <span className="text-emerald-400 font-mono font-bold tracking-widest uppercase">
                  {maskEmailPreview(duplicateUser.email)}
                </span>
              </div>
            </div>
            <button 
              onClick={() => navigate(`/login/recuperar?cpf=${normalizeCpf(formData.cpf)}`)}
              className="w-full bg-white text-slate-950 font-black py-4 rounded-xl hover:bg-slate-100 transition-all text-xs uppercase tracking-widest"
            >
              Recuperar Acesso
            </button>
            <button onClick={() => setDuplicateUser(null)} className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest">Tentar outro CPF</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo Oficial *</label>
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input required value={formData.nome_completo} onChange={e => setFormData({...formData, nome_completo: e.target.value})} placeholder="Seu nome sem abreviações" className="w-full bg-white border border-transparent rounded-xl py-4 pl-12 pr-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-[#6C4DE4] transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF *</label>
                <div className="relative group">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input required value={formData.cpf} onChange={e => setFormData({...formData, cpf: formatCpf(e.target.value)})} maxLength={14} placeholder="000.000.000-00" className="w-full bg-white border border-transparent rounded-xl py-4 pl-12 pr-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-[#6C4DE4]" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp / Telefone *</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input required value={formData.telefone} onChange={e => setFormData({...formData, telefone: formatPhone(e.target.value)})} placeholder="(00) 0 0000-0000" className="w-full bg-white border border-transparent rounded-xl py-4 pl-12 pr-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-[#6C4DE4]" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nascimento *</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input type="date" required value={formData.data_nascimento} onChange={e => setFormData({...formData, data_nascimento: e.target.value})} className="w-full bg-white border border-transparent rounded-xl py-4 pl-12 pr-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-[#6C4DE4]" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sexo Biológico *</label>
                <div className="relative">
                  <Heart className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <select required value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})} className="w-full bg-white border border-transparent rounded-xl py-4 pl-12 pr-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-[#6C4DE4] appearance-none">
                    <option value="">Selecione...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
               <StateCitySelect uf={formData.uf} cidade={formData.cidade} onChangeUf={(uf) => setFormData(p => ({...p, uf}))} onChangeCidade={(cidade) => setFormData(p => ({...p, cidade}))} required />
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-500/10 text-red-500 p-4 rounded-xl text-xs font-bold border border-red-500/20 animate-pulse">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button disabled={loading} className="w-full bg-[#6C4DE4] text-white font-black py-5 rounded-xl shadow-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest active:scale-[0.98]">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Finalizar Cadastro <ShieldCheck className="w-5 h-5" /></>}
            </button>
          </form>
        )}
        
        <div className="p-6 text-center border-t border-slate-800/50">
          <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em]">Federação Norte de Pesca Esportiva • 2025</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCompleteProfile;
