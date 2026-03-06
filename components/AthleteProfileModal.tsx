
import React, { useState } from 'react';
import {
  X, MapPin, Trophy, Star, ShieldCheck, Phone, Mail,
  History, Calendar, ChevronLeft, ChevronRight,
  UploadCloud, Loader2, CheckCircle, FileText, Download,
  Award, Globe
} from 'lucide-react';
import { User, DB } from '../types';
import { useApp } from '../App';
import { uploadFile } from '../services/storage';
import { supabase, SUPABASE_ENABLED } from '../lib/supabase';

interface Props {
  athlete: User;
  db: DB;
  onClose: () => void;
}

const AthleteProfileModal: React.FC<Props> = ({ athlete, db, onClose }) => {
  const { user: currentUser, setDb } = useApp();
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [uploading, setUploading] = useState(false);

  const [onlinePoints, setOnlinePoints] = useState(0);
  const [loadingOnline, setLoadingOnline] = useState(false);

  React.useEffect(() => {
    const fetchOnlineScore = async () => {
      setLoadingOnline(true);
      try {
        const { data, error } = await supabase
          .from('online_results')
          .select('pontuacao')
          .eq('atleta_id', athlete.id);

        if (error) throw error;
        const total = data.reduce((acc, curr) => acc + Number(curr.pontuacao), 0);
        setOnlinePoints(total);
      } catch (err) {
        console.error("Erro ao buscar pontos online:", err);
      } finally {
        setLoadingOnline(false);
      }
    };
    fetchOnlineScore();
  }, [athlete.id]);

  const totalPoints = db.results
    .filter(r => r.atleta_id === athlete.id)
    .reduce((acc, curr) => acc + curr.pontuacao, 0);

  const podiums = db.results.filter(r => {
    if (r.atleta_id !== athlete.id) return false;
    const catResults = db.results.filter(res => res.evento_id === r.evento_id && res.categoria === r.categoria);
    const sorted = [...catResults].sort((a, b) => b.pontuacao - a.pontuacao);
    const placement = 1 + sorted.filter(res => res.pontuacao > r.pontuacao).length;
    return placement <= 3;
  }).length;

  const getLevelLabel = (level?: string) => {
    if (level === 'ATLETA') return 'Atleta';
    return 'Pescador';
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || currentUser.nivel !== 'ADMIN') return;

    if (file.type !== 'application/pdf') {
      alert("Apenas arquivos PDF são permitidos.");
      return;
    }

    setUploading(true);
    try {
      const folder = `id_norte_pdfs/${athlete.cpf || athlete.id}`;
      const publicUrl = await uploadFile(file, folder);

      if (SUPABASE_ENABLED) {
        await supabase.from('atletas').update({ id_norte_pdf_url: publicUrl }).eq('id', athlete.id);
      }

      setDb(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === athlete.id ? { ...u, id_norte_pdf_url: publicUrl } : u)
      }));

      alert("✅ Credencial PDF atualizada!");
    } catch (err: any) {
      alert("❌ Erro no upload: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const hasGaleria = athlete.galeria && athlete.galeria.length > 0;
  const isAdmin = currentUser?.nivel === 'ADMIN';

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div
        className="bg-slate-900 text-white w-full max-w-4xl rounded-[48px] overflow-hidden shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col md:flex-row max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >

        {/* Lado Esquerdo: Carrossel de Fotos */}
        <div className="w-full md:w-[50%] flex flex-col bg-slate-950 border-r border-slate-800 relative group/side">
          <div className="relative aspect-[4/5] md:aspect-auto md:flex-1 bg-slate-900 overflow-hidden">
            {hasGaleria ? (
              <div className="w-full h-full relative">
                <img
                  src={athlete.galeria![currentPhotoIdx]}
                  className="w-full h-full object-cover animate-in fade-in zoom-in-110 duration-700"
                  alt={`Troféu ${currentPhotoIdx + 1}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                {athlete.galeria!.length > 1 && (
                  <>
                    <button onClick={() => setCurrentPhotoIdx(prev => (prev > 0 ? prev - 1 : athlete.galeria!.length - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-emerald-500 rounded-2xl transition-all opacity-0 group-hover/side:opacity-100 backdrop-blur-sm">
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button onClick={() => setCurrentPhotoIdx(prev => (prev < athlete.galeria!.length - 1 ? prev + 1 : 0))} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-emerald-500 rounded-2xl transition-all opacity-0 group-hover/side:opacity-100 backdrop-blur-sm">
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
                      {athlete.galeria!.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentPhotoIdx ? 'bg-emerald-500 w-8' : 'bg-white/20 w-2'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                {athlete.foto_url ? (
                  <img src={athlete.foto_url} className="w-full h-full object-cover opacity-40 grayscale" />
                ) : (
                  <Trophy className="w-24 h-24 text-slate-800" />
                )}
                <p className="text-slate-600 font-black uppercase text-[10px] tracking-widest">Galeria Vazia</p>
              </div>
            )}
            <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-black/40 rounded-full md:hidden">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stats Overlay on Image (Mobile) ou Abaixo (Desktop) */}
          <div className="p-8 bg-slate-950 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 text-center group/card hover:border-emerald-500/30 transition-all">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                  <Award className="w-3 h-3 text-emerald-500" /> Pontos Presencial
                </p>
                <p className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">{totalPoints.toLocaleString()}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 text-center group/card hover:border-indigo-500/30 transition-all">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                  <Globe className="w-3 h-3 text-indigo-500" /> Pontos Online
                </p>
                <p className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors">
                  {loadingOnline ? '...' : onlinePoints.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 text-center group/card hover:border-amber-500/30 transition-all">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3 text-amber-500" /> Pódios Oficiais (Presencial)
              </p>
              <p className="text-2xl font-black text-amber-400">{podiums}</p>
            </div>
          </div>
        </div>

        {/* Lado Direito: Informações Detalhadas */}
        <div className="flex-1 overflow-y-auto bg-slate-900 relative flex flex-col">
          <button onClick={onClose} className="hidden md:block absolute top-8 right-8 p-3 bg-slate-800 hover:bg-red-500 hover:text-white text-slate-400 rounded-2xl transition-all z-10 shadow-lg">
            <X className="w-5 h-5" />
          </button>

          <div className="p-8 md:p-12 space-y-10">
            {/* Header Perfil */}
            <header>
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border ${athlete.nivel === 'ATLETA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                  {getLevelLabel(athlete.nivel)}
                </span>
                {athlete.id_norte_numero && (
                  <span className="bg-slate-950 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-mono border border-slate-800">
                    {athlete.id_norte_numero}
                  </span>
                )}
              </div>
              <h2 className="text-4xl font-black tracking-tight uppercase leading-none text-white">{athlete.nome_completo}</h2>
              <div className="flex items-center gap-2 text-slate-500 text-sm font-bold uppercase tracking-widest mt-3">
                <MapPin className="w-4 h-4 text-emerald-500" /> {athlete.cidade} / {athlete.uf}
              </div>
            </header>

            {/* História e Trajetória */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 text-emerald-500">
                <History className="w-5 h-5" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em]">História no Esporte</h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center gap-4 p-5 bg-slate-950 rounded-[24px] border border-slate-800">
                  <div className="p-3 bg-slate-900 rounded-2xl text-emerald-500">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Experiência</p>
                    <p className="font-bold text-white text-lg">{athlete.tempo_pescador || 'Iniciante'}</p>
                  </div>
                </div>

                <div className="p-8 bg-slate-950 rounded-[40px] border border-slate-800 relative">
                  <p className="text-slate-400 text-lg leading-relaxed font-medium italic">
                    {athlete.historia ? `"${athlete.historia}"` : "Este atleta ainda não descreveu sua trajetória na pesca esportiva."}
                  </p>
                  <div className="absolute -bottom-3 -right-3 p-4 bg-slate-900 rounded-2xl border border-slate-800">
                    <Star className="w-6 h-6 text-amber-500 fill-amber-500/20" />
                  </div>
                </div>
              </div>
            </section>

            {/* Ações Administrativas e Documentos */}
            <section className="space-y-4 pt-6 border-t border-slate-800">
              <div className="flex flex-col gap-3">
                {/* Botão de Download da Credencial (Público) */}
                {(athlete.id_norte_pdf_url || athlete.id_norte_pdf_link) && (
                  <a
                    href={athlete.id_norte_pdf_url || athlete.id_norte_pdf_link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full bg-indigo-600 text-white font-black uppercase text-xs tracking-widest py-5 rounded-[24px] items-center justify-center gap-3 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
                  >
                    <FileText className="w-5 h-5" />
                    Visualizar Credencial Oficial
                    <Download className="w-4 h-4 opacity-40" />
                  </a>
                )}

                {/* Botão de Upload (Exclusivo ADMIN no modal) */}
                {isAdmin && (
                  <label className="flex w-full bg-slate-800 text-slate-300 font-black uppercase text-[10px] tracking-widest py-5 rounded-[24px] items-center justify-center gap-3 border-2 border-slate-700 cursor-pointer hover:bg-slate-700 transition-all group relative overflow-hidden">
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                    ) : (
                      <UploadCloud className="w-5 h-5 group-hover:text-emerald-500 transition-colors" />
                    )}
                    <span>{uploading ? "Sincronizando..." : (athlete.id_norte_pdf_url ? "Atualizar Credencial (PDF)" : "Anexar Credencial Digital (PDF)")}</span>
                    <input type="file" className="hidden" accept="application/pdf" onChange={handlePdfUpload} disabled={uploading} />
                    {athlete.id_norte_pdf_url && !uploading && <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-emerald-500" />}
                  </label>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteProfileModal;
