
import React, { useState } from 'react';
import { User as UserIcon, Camera, Save, AlertCircle, MapPin, Loader2, CheckCircle, Heart, Calendar, Phone, Image as ImageIcon, Plus, Trash2, History, Lock, ChevronRight, X } from 'lucide-react';
import { useApp } from '../App';
import { normalizeCpf, formatCpf, isCpfValid } from '../utils/cpf';
import { uploadFile } from '../services/storage';
import { syncDatabase, supabaseAuth } from '../services/auth/supabaseAuth';
import { IS_SUPABASE } from '../services/auth';

const formatPhone = (v: string) => {
  const digits = v.replace(/\D/g, '');
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return digits.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2 $3-$4");
};

const Profile: React.FC = () => {
  const { user, setUser, setDb } = useApp();
  const [formData, setFormData] = useState({
    nome_completo: user?.nome_completo || '',
    cpf: formatCpf(user?.cpf || ''),
    telefone: formatPhone(user?.telefone || ''),
    cidade: user?.cidade || '',
    uf: user?.uf || '',
    foto_url: user?.foto_url || '',
    sexo: user?.sexo || '',
    data_nascimento: user?.data_nascimento || '',
    tempo_pescador: user?.tempo_pescador || '',
    historia: user?.historia || '',
    galeria: user?.galeria || []
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingGalleryIdx, setUploadingGalleryIdx] = useState<number | null>(null);
  const [status, setStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const getLevelLabel = (level?: string) => {
    const isFemale = formData.sexo === 'F' || formData.sexo === 'FEMININO' || formData.sexo === 'Feminino';
    if (level === 'ATLETA') return 'Atleta';
    if (level === 'ADMIN') return 'Admin';
    return isFemale ? 'Pescadora' : 'Pescador';
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      setStatus(null);
      try {
        const url = await uploadFile(file, 'perfis');
        setFormData(prev => ({ ...prev, foto_url: url }));
        setStatus({ type: 'success', message: 'Imagem carregada com sucesso!' });
      } catch (err: any) {
        setStatus({ type: 'error', message: err.message || "Erro ao processar imagem." });
      } finally {
        setUploading(false);
      }
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingGalleryIdx(index);
      try {
        const url = await uploadFile(file, 'galerias');
        const newGallery = [...formData.galeria];
        newGallery[index] = url;
        setFormData(prev => ({ ...prev, galeria: newGallery }));
      } catch (err: any) {
        alert("Erro no upload da galeria: " + err.message);
      } finally {
        setUploadingGalleryIdx(null);
      }
    }
  };

  const removeGalleryImage = (index: number) => {
    const newGallery = [...formData.galeria];
    newGallery.splice(index, 1);
    setFormData(prev => ({ ...prev, galeria: newGallery }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    const cpfDigits = normalizeCpf(formData.cpf);
    if (cpfDigits && !isCpfValid(cpfDigits)) {
      setStatus({ type: 'error', message: 'CPF inválido. Verifique os números.' });
      setSaving(false);
      return;
    }

    try {
      const updatedUser = {
        ...user,
        ...formData,
        cpf: cpfDigits,
        telefone: formData.telefone.replace(/\D/g, ''),
        uf: formData.uf.toUpperCase().trim(),
        atualizado_em: new Date().toISOString()
      } as any;

      if (IS_SUPABASE) {
        const { error: dbError } = await syncDatabase.updateUser(updatedUser);
        if (dbError) throw dbError;
      }

      setDb(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === user?.id ? updatedUser : u)
      }));

      setUser(updatedUser);
      setStatus({ type: 'success', message: 'Perfil atualizado com sucesso!' });
    } catch (e: any) {
      console.error("Erro ao salvar perfil:", e);
      setStatus({
        type: 'error',
        message: "Erro ao sincronizar com o banco: " + (e.message || "Tente novamente.")
      });
    } finally {
      setSaving(false);
    }
  };

  const isAtletaOrAdmin = user?.nivel === 'ATLETA' || user?.nivel === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Configurações de Perfil</h1>
        <p className="text-slate-500 font-medium italic">Gerencie suas informações oficiais federativas.</p>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl text-center space-y-4">
            <div className="relative inline-block">
              <div className="w-40 h-40 bg-slate-950 rounded-[48px] overflow-hidden border-4 border-slate-900 shadow-2xl flex items-center justify-center text-slate-800 relative">
                {uploading && (
                  <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center z-10 backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  </div>
                )}
                {formData.foto_url ? (
                  <img src={formData.foto_url} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-16 h-16" />
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-3 rounded-2xl shadow-xl cursor-pointer hover:bg-emerald-400 transition-all active:scale-90 border-4 border-slate-900">
                <Camera className="w-6 h-6" />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} disabled={uploading} />
              </label>
            </div>
            <div>
              <h3 className="font-black text-white text-xs uppercase tracking-[0.2em]">Sua Foto</h3>
              <span className={`inline-block mt-4 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${user?.nivel === 'ATLETA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                {getLevelLabel(user?.nivel)}
              </span>
            </div>
          </div>

          {/* SESSÃO DE ATLETA (OPCIONAL) */}
          {isAtletaOrAdmin && (
            <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-emerald-500 mb-2">
                <History className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-widest">Atuação</h3>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Tempo como Pescador</label>
                <input
                  type="text"
                  value={formData.tempo_pescador}
                  onChange={e => setFormData({ ...formData, tempo_pescador: e.target.value })}
                  placeholder="Ex: 15 anos"
                  className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold placeholder:text-slate-700"
                />
              </div>
            </div>
          )}

          {/* SECURITY SECTION */}
          <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-500 mb-2">
              <Lock className="w-5 h-5" />
              <h3 className="text-sm font-black uppercase tracking-widest">Segurança</h3>
            </div>
            <div>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(true)}
                className="w-full bg-slate-950 border border-slate-800 hover:border-emerald-500 text-slate-400 hover:text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-between px-4 group"
              >
                <span className="text-xs uppercase tracking-widest">Alterar Senha de Acesso</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
                <input
                  type="text"
                  value={formData.nome_completo}
                  onChange={e => setFormData({ ...formData, nome_completo: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold placeholder:text-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">CPF</label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={e => setFormData({ ...formData, cpf: formatCpf(e.target.value) })}
                    className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold placeholder:text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Telefone / WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.telefone}
                      onChange={e => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                      placeholder="(00) 0 0000-0000"
                      className="w-full px-5 py-4 pl-12 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold placeholder:text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {isAtletaOrAdmin && (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Sua História na Pesca</label>
                  <textarea
                    value={formData.historia}
                    onChange={e => setFormData({ ...formData, historia: e.target.value })}
                    placeholder="Conte como começou a pescar, seus maiores troféus e motivação..."
                    className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium placeholder:text-slate-700 h-32 resize-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Data de Nascimento</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
                    <input
                      type="date"
                      value={formData.data_nascimento}
                      onChange={e => setFormData({ ...formData, data_nascimento: e.target.value })}
                      className="w-full px-5 py-4 pl-12 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Sexo</label>
                  <div className="relative">
                    <Heart className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
                    <select
                      value={formData.sexo}
                      onChange={e => setFormData({ ...formData, sexo: e.target.value })}
                      className="w-full px-5 py-4 pl-12 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold appearance-none"
                    >
                      <option value="">Selecione...</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Indefinido">Indefinido</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* GALERIA DE FOTOS DO ATLETA */}
            {isAtletaOrAdmin && (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Minha Galeria (Máx 5 fotos)</label>
                  <span className="text-[9px] text-emerald-500 font-bold uppercase">{formData.galeria.length}/5</span>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {[0, 1, 2, 3, 4].map(idx => (
                    <div key={idx} className="relative aspect-square">
                      <div className="w-full h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center group">
                        {uploadingGalleryIdx === idx ? (
                          <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                        ) : formData.galeria[idx] ? (
                          <>
                            <img src={formData.galeria[idx]} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                              <label className="p-2 bg-emerald-500 text-white rounded-lg cursor-pointer hover:bg-emerald-400">
                                <Camera className="w-4 h-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={e => handleGalleryUpload(e, idx)} />
                              </label>
                              <button onClick={() => removeGalleryImage(idx)} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-400">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors">
                            <Plus className="w-6 h-6 text-slate-700" />
                            <input type="file" className="hidden" accept="image/*" onChange={e => handleGalleryUpload(e, idx)} />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {status && (
              <div className={`flex items-start gap-3 p-4 rounded-2xl text-xs font-bold border animate-in slide-in-from-top-2 ${status.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                {status.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                <p>{status.message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving || uploading || uploadingGalleryIdx !== null}
              className="w-full bg-emerald-500 text-slate-950 font-black py-5 rounded-3xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5" /> ATUALIZAR DADOS</>}
            </button>
          </div>
        </div>
      </form >

      {isChangePasswordOpen && (
        <ChangePasswordModal onClose={() => setIsChangePasswordOpen(false)} onSuccess={() => setStatus({ type: 'success', message: 'Senha alterada com sucesso!' })} />
      )}
    </div >
  );
};

export default Profile;

const ChangePasswordModal: React.FC<{ onClose: () => void, onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      // Also ensure password_defined is true if it wasn't
      const { data: { user } } = await import('../lib/supabase').then(m => m.supabase.auth.getUser());
      if (user) await supabaseAuth.markPasswordDefined(user.id);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 w-full max-w-md p-8 rounded-[40px] border border-slate-800 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-black text-white uppercase tracking-tight mb-1">Nova Senha</h2>
        <p className="text-slate-500 text-xs font-medium mb-6">Defina uma nova senha segura para sua conta.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none font-bold"
              placeholder="Nova Senha"
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="block w-full px-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none font-bold"
              placeholder="Confirme a Senha"
            />
          </div>

          <div className="bg-slate-950/50 p-4 rounded-xl space-y-2 border border-slate-800">
            <div className={`flex items-center gap-2 text-xs font-bold ${rules.min ? 'text-emerald-400' : 'text-slate-600'}`}>
              <div className={`w-2 h-2 rounded-full ${rules.min ? 'bg-emerald-500' : 'bg-slate-700'}`} /> Mínimo 6 caracteres
            </div>
            <div className={`flex items-center gap-2 text-xs font-bold ${rules.upper ? 'text-emerald-400' : 'text-slate-600'}`}>
              <div className={`w-2 h-2 rounded-full ${rules.upper ? 'bg-emerald-500' : 'bg-slate-700'}`} /> Letra Maiúscula
            </div>
            <div className={`flex items-center gap-2 text-xs font-bold ${rules.lower ? 'text-emerald-400' : 'text-slate-600'}`}>
              <div className={`w-2 h-2 rounded-full ${rules.lower ? 'bg-emerald-500' : 'bg-slate-700'}`} /> Letra minúscula
            </div>
            <div className={`flex items-center gap-2 text-xs font-bold ${rules.number ? 'text-emerald-400' : 'text-slate-600'}`}>
              <div className={`w-2 h-2 rounded-full ${rules.number ? 'bg-emerald-500' : 'bg-slate-700'}`} /> Número
            </div>
            <div className={`flex items-center gap-2 text-xs font-bold ${rules.special ? 'text-emerald-400' : 'text-slate-600'}`}>
              <div className={`w-2 h-2 rounded-full ${rules.special ? 'bg-emerald-500' : 'bg-slate-700'}`} /> Especial (@$!%*?&#)
            </div>
          </div>

          {error && <p className="text-xs font-bold text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}

          <button
            type="submit"
            disabled={loading || !isStrong}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-widest py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Atualizar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
};
