
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Palette,
  Save,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  CheckCircle2,
  MapPin,
  Type,
  Trash2,
  Trophy,
  Globe
} from 'lucide-react';
import { useApp } from '../App';
import { uploadFile } from '../services/storage';
import { IS_SUPABASE } from '../services/auth';
import { syncDatabase } from '../services/auth/supabaseAuth';

const STATES = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'TO', name: 'Tocantins' }
];

const AdminBranding: React.FC = () => {
  const { db, setDb } = useApp();
  const navigate = useNavigate();

  const [appName, setAppName] = useState(db.settings?.appBranding?.appName || 'FNPE');
  const [rankingsCovers, setRankingsCovers] = useState<Record<string, string>>(db.settings?.rankingsCovers || {});
  const [onlineCovers, setOnlineCovers] = useState<Record<string, string>>(db.settings?.onlineRankingsCovers || {});

  const [activeTab, setActiveTab] = useState<'presencial' | 'online'>('presencial');
  const [saving, setSaving] = useState(false);
  const [uploadingState, setUploadingState] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sincroniza estados locais se o DB global mudar (ex: após Save ou refresh)
  React.useEffect(() => {
    if (db.settings) {
      setAppName(db.settings.appBranding?.appName || 'FNPE');
      setRankingsCovers(db.settings.rankingsCovers || {});
      setOnlineCovers(db.settings.onlineRankingsCovers || {});
    }
  }, [db.settings?.appBranding?.appName, db.settings?.rankingsCovers, db.settings?.onlineRankingsCovers]);

  const handleSave = async () => {
    setSaving(true);
    const newSettings = {
      ...db.settings,
      appBranding: { ...db.settings?.appBranding, appName },
      rankingsCovers,
      onlineRankingsCovers: onlineCovers
    };

    console.log("AdminBranding: Iniciando salvamento...", newSettings);
    try {
      if (IS_SUPABASE) {
        await syncDatabase.updateGlobalSettings(newSettings);
      }

      setDb(prev => ({
        ...prev,
        settings: newSettings
      }));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      console.log("AdminBranding: Salvo com sucesso.");
    } catch (err: any) {
      console.error("AdminBranding: Erro ao salvar:", err);
      alert("Erro ao salvar configurações: " + (err.message || "Tente novamente mais tarde."));
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>, uf: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingState(uf);
    try {
      // Força o tipo de caminho baseado na aba ativa no momento do clique
      const pathType = activeTab === 'online' ? 'online' : 'presencial';
      const url = await uploadFile(file, `branding/covers/${pathType}/${uf}`);

      if (activeTab === 'online') {
        setOnlineCovers(prev => ({ ...prev, [uf]: url }));
      } else {
        setRankingsCovers(prev => ({ ...prev, [uf]: url }));
      }
    } catch (err: any) {
      console.error("Erro upload capa:", err);
      alert("Erro no upload da imagem: " + (err.message || "Falha técnica."));
    } finally {
      // Garantia de que o spinner pare em qualquer cenário
      setUploadingState(null);
    }
  };

  const removeCover = (uf: string) => {
    if (activeTab === 'online') {
      const newCovers = { ...onlineCovers };
      delete newCovers[uf];
      setOnlineCovers(newCovers);
    } else {
      const newCovers = { ...rankingsCovers };
      delete newCovers[uf];
      setRankingsCovers(newCovers);
    }
  };

  const currentCovers = activeTab === 'online' ? onlineCovers : rankingsCovers;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/app/admin')}
            className="flex items-center gap-2 text-slate-500 hover:text-amber-500 font-black uppercase text-[10px] tracking-[0.2em] mb-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Painel Admin
          </button>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            <Palette className="w-8 h-8 text-amber-500" /> Customização & Branding
          </h1>
          <p className="text-slate-500 font-medium italic">Gerencie a identidade visual da Federação.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 text-white px-8 py-4 rounded-[20px] font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-500 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Salvar Alterações
        </button>
      </header>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[32px] flex items-center gap-4 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          <p className="text-emerald-400 font-bold">Configurações de branding atualizadas com sucesso!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CONFIGURAÇÃO BASE */}
        <section className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-6">
            <h2 className="text-lg font-black text-white uppercase flex items-center gap-2">
              <Type className="w-5 h-5 text-amber-500" /> Identidade Nome
            </h2>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Aplicação</label>
              <input
                value={appName}
                onChange={e => setAppName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <p className="text-[10px] text-slate-600 italic leading-relaxed">
              Este nome será exibido nos cabeçalhos, rodapés e e-mails automáticos enviados pelo sistema.
            </p>
          </div>
        </section>

        {/* CAPAS DE RANKINGS */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h2 className="text-lg font-black text-white uppercase flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-500" /> Imagens de Apresentação
              </h2>

              <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-2xl">
                <button onClick={() => setActiveTab('presencial')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'presencial' ? 'bg-emerald-500 text-slate-950' : 'text-slate-600 hover:text-slate-400'}`}>Presencial</button>
                <button onClick={() => setActiveTab('online')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'online' ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:text-slate-400'}`}>Online</button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {STATES.map(state => (
                <div key={state.uf} className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden group">
                  <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                    {uploadingState === state.uf ? (
                      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    ) : currentCovers[state.uf] ? (
                      <>
                        <img src={currentCovers[state.uf]} className="w-full h-full object-cover" alt={state.name} />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                          <label className="p-3 bg-white text-slate-950 rounded-2xl cursor-pointer hover:scale-110 transition-transform">
                            <UploadCloud className="w-5 h-5" />
                            <input type="file" className="hidden" accept="image/*" onChange={e => handleCoverUpload(e, state.uf)} />
                          </label>
                          <button onClick={() => removeCover(state.uf)} className="p-3 bg-red-600 text-white rounded-2xl hover:scale-110 transition-transform">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="flex flex-col items-center gap-2 cursor-pointer text-slate-700 hover:text-amber-500 transition-colors">
                        <ImageIcon className="w-10 h-10" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sem Imagem ({activeTab})</span>
                        <input type="file" className="hidden" accept="image/*" onChange={e => handleCoverUpload(e, state.uf)} />
                      </label>
                    )}
                  </div>
                  <div className="p-4 flex items-center justify-between bg-slate-900">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 bg-slate-950 rounded-lg flex items-center justify-center font-black text-xs border border-slate-800 ${activeTab === 'online' ? 'text-indigo-500' : 'text-amber-500'}`}>
                        {state.uf}
                      </div>
                      <span className="font-bold text-white text-sm">{state.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminBranding;
