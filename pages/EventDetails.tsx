
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar, MapPin, Trophy, Plus, Trash2, ArrowLeft,
  Image as ImageIcon, FileText, Building, User as UserIcon
} from 'lucide-react';
import { useApp } from '../App';
import { Category } from '../types';
import { syncDatabase } from '../services/auth/supabaseAuth';
import { SUPABASE_ENABLED } from '../lib/supabase';
import { uploadFile } from '../services/storage';
import AthleteProfileModal from '../components/AthleteProfileModal';
import ResultLaunchForm from '../components/results/ResultLaunchForm';

const EventDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { db, setDb, user, isMaster } = useApp();
  const event = db.events.find(e => e.id === id);

  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [showAddResult, setShowAddResult] = useState(false);
  const [selectedAthleteProfile, setSelectedAthleteProfile] = useState<any | null>(null);
  const [editingResult, setEditingResult] = useState<any | null>(null);

  const categories = useMemo(() => {
    if (!event) return [];
    const cats: Category[] = [];
    if (event.tem_caiaque) cats.push('CAIAQUE');
    if (event.tem_embarcado) cats.push('EMBARCADO');
    if (event.tem_arremesso) cats.push('ARREMESSO');
    if (event.tem_barranco) cats.push('BARRANCO');
    return cats;
  }, [event]);

  const [activeTab, setActiveTab] = useState<Category>(categories[0] || 'CAIAQUE');

  // --- Logic for Team Results (New System) ---
  const teamResults = useMemo(() => {
    if (!event) return [];
    // Filter teams for this event and active category
    const teams = db.eventTeams?.filter(t => t.event_id === event.id && t.category === activeTab) || [];

    // Sort by Score
    const sorted = [...teams].sort((a, b) => (b.score || 0) - (a.score || 0));

    // Map with placement and member names
    return sorted.map((team) => {
      const placement = 1 + sorted.filter(t => (t.score || 0) > (team.score || 0)).length;

      // Find members
      const teamMemberRelations = db.eventTeamMembers?.filter(tm => tm.team_id === team.id) || [];
      const memberNames = teamMemberRelations.map(tm => {
        const user = db.users.find(u => u.id === tm.user_id);
        return user?.nome_completo || 'Desconhecido';
      });

      return {
        ...team,
        colocacao: placement,
        membersNames: memberNames
      };
    });
  }, [db.eventTeams, db.eventTeamMembers, db.users, event, activeTab]);

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !event || !user || !isMaster) return;

    if ((event.galeria?.length || 0) >= 30) {
      alert("Limite de 30 fotos atingido.");
      return;
    }

    setUploadingGallery(true);
    try {
      const url = await uploadFile(file, `events/${event.id}/gallery`);
      const updatedGallery = [...(event.galeria || []), url];
      const updatedEvent = { ...event, galeria: updatedGallery };

      if (SUPABASE_ENABLED) {
        await syncDatabase.upsertEvento(updatedEvent);
      }

      setDb(prev => ({
        ...prev,
        events: prev.events.map(ev => ev.id === event.id ? updatedEvent : ev)
      }));

    } catch (err: any) {
      alert("Erro ao enviar imagem: " + err.message);
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryPhoto = async (photoUrl: string) => {
    if (!event || !user || !isMaster) return;
    if (!confirm("Remover esta foto?")) return;

    try {
      const updatedGallery = (event.galeria || []).filter(u => u !== photoUrl);
      const updatedEvent = { ...event, galeria: updatedGallery };

      if (SUPABASE_ENABLED) {
        await syncDatabase.upsertEvento(updatedEvent);
      }

      setDb(prev => ({
        ...prev,
        events: prev.events.map(ev => ev.id === event.id ? updatedEvent : ev)
      }));
    } catch (err: any) {
      alert("Erro ao remover imagem.");
    }
  };

  const handleResultSuccess = () => {
    setShowAddResult(false);
    setEditingResult(null);
  };

  const handleEditResult = (team: any) => {
    // Construct initial data for form
    const members: any[] = team.membersNames.map((name: string, idx: number) => {
      // We need to reverse lookup IDs to populate form correctly if possible
      const relations = db.eventTeamMembers.filter(tm => tm.team_id === team.id);
      const relation = relations[idx];
      const user = db.users.find(u => u.id === relation?.user_id);

      return {
        localId: relation?.id || idx.toString(),
        idNorte: user?.id_norte_numero || '',
        athleteId: user?.id,
        name: user?.nome_completo || name,
        valid: !!user
      };
    });

    setEditingResult({
      id: team.id,
      name: team.name,
      score: team.score,
      members
    });
    setShowAddResult(true);
  };

  const handleDeleteResult = async (teamId: string) => {
    if (!confirm("Tem certeza que deseja remover este resultado?")) return;
    try {
      if (SUPABASE_ENABLED) {
        await syncDatabase.deleteEventTeam(teamId);
      }

      setDb(prev => ({
        ...prev,
        eventTeams: prev.eventTeams.filter(t => t.id !== teamId),
        eventTeamMembers: prev.eventTeamMembers.filter(tm => tm.team_id !== teamId)
      }));
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };


  if (!event) return <div className="p-8 text-center font-black text-white py-20 uppercase tracking-widest">Evento não encontrado.</div>;

  return (
    <div className="max-w-screen-md mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate('/app/eventos')} className="flex items-center gap-2 text-slate-500 hover:text-emerald-500 font-black uppercase text-[10px] tracking-[0.2em] transition-all group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para Calendário
        </button>
        {event.codigo_certificado && (
          <div className="px-4 py-2 bg-slate-900 border border-emerald-500/30 rounded-full text-emerald-400 font-mono font-bold text-xs shadow-lg shadow-emerald-500/10">
            {event.codigo_certificado}
          </div>
        )}
      </header>

      {/* Identidade Visual */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 shadow-xl text-center space-y-4">
            <div className="w-32 h-32 bg-slate-950 rounded-[40px] overflow-hidden border-4 border-slate-900 shadow-2xl flex items-center justify-center mx-auto">
              {event.logo_url ? <img src={event.logo_url} className="w-full h-full object-cover" /> : <Trophy className="w-12 h-12 text-slate-700" />}
            </div>
            <span className="inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Homologado FNPE</span>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 shadow-xl space-y-4">
            <h1 className="text-2xl font-black text-white uppercase">{event.nome_evento}</h1>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase"><Calendar className="w-4 h-4 text-emerald-500" /> {new Date(event.data_evento).toLocaleDateString('pt-BR')} {event.data_fim ? ` a ${new Date(event.data_fim).toLocaleDateString('pt-BR')}` : ''}</div>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase"><MapPin className="w-4 h-4 text-emerald-500" /> {event.cidade} - {event.uf}</div>
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase"><Building className="w-4 h-4 text-emerald-500" /> {event.instituicao_organizadora}</div>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase"><UserIcon className="w-4 h-4 text-emerald-500" /> Org: {event.responsaveis}</div>
              </div>
            </div>
            <p className="text-slate-500 italic text-sm">"{event.descricao}"</p>

            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Descrição Econômica</h3>
                {isMaster && (
                  <button
                    onClick={() => {
                      const newDesc = prompt("Editar Descrição Econômica:", event.descricao_economica || "");
                      if (newDesc !== null) {
                        const updated = { ...event, descricao_economica: newDesc };
                        syncDatabase.upsertEvento(updated).then(() => {
                          setDb((prev: any) => ({ ...prev, events: prev.events.map((e: any) => e.id === event.id ? updated : e) }));
                        });
                      }
                    }}
                    className="text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-300"
                  >
                    [Editar]
                  </button>
                )}
              </div>
              {event.descricao_economica ? (
                <p className="text-slate-400 text-sm leading-relaxed">{event.descricao_economica}</p>
              ) : (
                <p className="text-slate-600 text-xs italic">Nenhuma informação registrada.</p>
              )}
            </div>

            {event.arquivos && event.arquivos.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Arquivos Anexados</h3>
                <div className="flex flex-wrap gap-2">
                  {event.arquivos.map((file, i) => (
                    <a key={i} href={file.url_dados} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-emerald-500 hover:border-emerald-500/50 transition-all">
                      <FileText className="w-4 h-4" />
                      {file.nome}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Galeria de Fotos */}
      {(event.galeria?.length || 0) > 0 || isMaster ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-500" /> Galeria Oficial
            </h2>
            {isMaster && (
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{event.galeria?.length || 0}/30 Fotos</span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {isMaster && (event.galeria?.length || 0) < 30 && (
              <label className="aspect-square bg-slate-900 rounded-2xl border-2 border-dashed border-slate-800 hover:border-emerald-500 hover:bg-slate-800 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group">
                {uploadingGallery ? <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div> : <Plus className="w-8 h-8 text-slate-700 group-hover:text-emerald-500 transition-colors" />}
                <span className="text-[9px] font-black uppercase text-slate-600 group-hover:text-emerald-500">Adicionar</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleGalleryUpload} disabled={uploadingGallery} />
              </label>
            )}

            {event.galeria?.map((url, idx) => (
              <div key={idx} className="relative aspect-square group">
                <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                  <img src={url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
                {isMaster && (
                  <button
                    onClick={() => removeGalleryPhoto(url)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Ranking do Evento */}
      <section className="bg-slate-900 rounded-[32px] border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-2 bg-slate-950 border-b border-slate-800 flex flex-wrap gap-2">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveTab(cat)} className={`flex-1 py-3 px-4 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${activeTab === cat ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{cat}</button>
          ))}
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Ranking: {activeTab}</h2>
            {isMaster && (
              <button onClick={() => setShowAddResult(true)} className="w-full sm:w-auto bg-emerald-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 flex items-center justify-center gap-2 transition-all">
                <Plus className="w-4 h-4" /> Lançar Resultado
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-800/50">
                {teamResults.length === 0 ? (
                  <tr><td className="py-16 text-center text-slate-600 italic font-black uppercase tracking-widest text-[10px] opacity-50">Nenhum resultado de equipe registrado.</td></tr>
                ) : (
                  teamResults.map((team) => (
                    <tr key={team.id} className="group hover:bg-slate-950/50 transition-colors">
                      <td className="py-5 px-4 w-16">
                        <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-[11px] border ${team.colocacao === 1 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-slate-900 text-slate-500'}`}>
                          {team.colocacao}º
                        </span>
                      </td>
                      <td className="py-5 px-4">
                        <p className="font-bold text-white uppercase text-sm group-hover:text-emerald-400 decoration-emerald-500/30 underline-offset-4 group-hover:underline transition-all cursor-pointer" onClick={() => handleEditResult(team)}>{team.name}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase">{team.membersNames.join(', ')}</p>
                      </td>
                      <td className="py-5 px-4 text-right">
                        <div className="font-black text-lg text-white">{(team.score || 0).toLocaleString('pt-BR')}</div>
                      </td>
                      {isMaster && (
                        <td className="py-5 px-4 w-24 text-right opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                          <button onClick={() => handleEditResult(team)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-400 transition-colors" title="Editar">
                            <FileText className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteResult(team.id)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-500 transition-colors" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Modal Lançamento */}
      {showAddResult && event && (
        <ResultLaunchForm
          eventId={event.id}
          category={activeTab}
          initialData={editingResult}
          onClose={() => { setShowAddResult(false); setEditingResult(null); }}
          onSuccess={handleResultSuccess}
        />
      )}

      {selectedAthleteProfile && <AthleteProfileModal athlete={selectedAthleteProfile} db={db} onClose={() => setSelectedAthleteProfile(null)} />}
    </div>
  );
};

export default EventDetails;
