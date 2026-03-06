
import React, { useState } from 'react';
import { X, Plus, Trash2, Search, Users, Trophy } from 'lucide-react';
import { useApp } from '../../App';
import { syncDatabase } from '../../services/auth/supabaseAuth';
import { SUPABASE_ENABLED } from '../../lib/supabase';
import { Category } from '../../types';

interface ResultLaunchFormProps {
  eventId: string;
  category: Category;
  initialData?: {
    id: string; // Team ID
    name: string;
    score: number;
    members: MemberRow[];
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface MemberRow {
  localId: string;
  idNorte: string;
  athleteId?: string;
  name: string;
  avatar?: string;
  valid: boolean;
}

const ResultLaunchForm: React.FC<ResultLaunchFormProps> = ({ eventId, category, initialData, onClose, onSuccess }) => {
  const { db, setDb } = useApp();
  const [teamName, setTeamName] = useState(initialData?.name || '');
  const [score, setScore] = useState(initialData?.score?.toString() || '');
  const [members, setMembers] = useState<MemberRow[]>(initialData?.members || [
    { localId: '1', idNorte: '', name: '', valid: false }
  ]);
  const [loading, setLoading] = useState(false);

  const handleIdSearch = (index: number, val: string) => {
    const newVal = val.toUpperCase();

    // Update local state first
    const updated = [...members];
    updated[index].idNorte = newVal;

    // Search in DB
    const found = db.users.find(u => u.id_norte_numero === newVal);
    if (found) {
      updated[index].valid = true;
      updated[index].name = found.nome_completo;
      updated[index].athleteId = found.id;
      updated[index].avatar = found.foto_url;
    } else {
      updated[index].valid = false;
      updated[index].name = '';
      updated[index].athleteId = undefined;
      updated[index].avatar = undefined;
    }
    setMembers(updated);
  };

  const addMember = () => {
    if (members.length >= 5) return;
    setMembers([...members, { localId: Date.now().toString(), idNorte: '', name: '', valid: false }]);
  };

  const removeMember = (idx: number) => {
    if (members.length === 1) return;
    setMembers(members.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (members.some(m => !m.valid)) {
      alert("Todos os integrantes devem ter ID Norte válido.");
      return;
    }
    if (!score) return;

    setLoading(true);
    try {
      const newTeam = {
        event_id: eventId,
        name: teamName,
        category,
        score: parseFloat(score),
        created_at: new Date().toISOString()
      };

      const teamMembersPayload = members.map(m => ({
        user_id: m.athleteId!,
        created_at: new Date().toISOString()
      }));

      if (SUPABASE_ENABLED) {
        // Insert Team
        const insertedTeam = await syncDatabase.insertEventTeam(newTeam);
        // Insert Members with CORRECT real UUID from DB if available, otherwise use temp logic (but here teamId is temp until returned?)
        // Actually syncDatabase.insertEventTeam handles ID stripping.
        // We need the REAL ID back to insert members.

        const realTeamId = insertedTeam?.id;

        const membersWithRealTeamId = teamMembersPayload.map(m => ({
          ...m,
          team_id: realTeamId
        })) as any[];

        await syncDatabase.insertEventTeamMembers(membersWithRealTeamId);

        setDb(prev => ({
          ...prev,
          eventTeams: [insertedTeam, ...prev.eventTeams],
          eventTeamMembers: [...membersWithRealTeamId, ...prev.eventTeamMembers]
        }));

      } else {
        // Local only fallback (usando IDs temporários apenas se Supabase estiver desligado)
        const tempTeamId = `team-${Date.now()}`;
        setDb(prev => ({
          ...prev,
          eventTeams: [{ ...newTeam, id: tempTeamId }, ...prev.eventTeams],
          eventTeamMembers: [...teamMembersPayload.map(m => ({ ...m, id: `tm-${Math.random()}`, team_id: tempTeamId })), ...prev.eventTeamMembers]
        }));
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        <div className="bg-emerald-600 p-6 text-slate-950 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6" />
            <h2 className="text-xl font-black uppercase tracking-tighter">Lançar Resultado de Equipe</h2>
          </div>
          <button onClick={onClose} className="hover:bg-emerald-700/20 p-2 rounded-full transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8 overflow-y-auto custom-scrollbar">

          {/* Team Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Equipe</label>
              <input
                required
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="Ex: Pescadores do Norte"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pontuação Total</label>
              <input
                type="number"
                step="0.1"
                required
                value={score}
                onChange={e => setScore(e.target.value)}
                placeholder="00.0"
                className="w-full bg-slate-950 border border-emerald-500/30 rounded-2xl py-4 px-6 text-emerald-400 font-black text-xl outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Users className="w-4 h-4" /> Integrantes ({members.length}/5)
              </label>
              {members.length < 5 && (
                <button type="button" onClick={addMember} className="text-[10px] font-black uppercase text-emerald-500 flex items-center gap-1 hover:text-emerald-400">
                  <Plus className="w-4 h-4" /> Adicionar
                </button>
              )}
            </div>

            <div className="space-y-3">
              {members.map((member, idx) => (
                <div key={member.localId} className="flex gap-4 items-start animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex-1 space-y-1">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 w-4 h-4" />
                      <input
                        value={member.idNorte}
                        onChange={e => handleIdSearch(idx, e.target.value)}
                        placeholder="Buscar ID Norte (Ex: ID-001)"
                        className={`w-full bg-slate-950 border rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-white outline-none transition-all ${member.valid ? 'border-emerald-500/50' : 'border-slate-800 focus:border-indigo-500'}`}
                      />
                    </div>
                    {member.valid ? (
                      <div className="flex items-center gap-2 pl-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase">{member.name}</span>
                      </div>
                    ) : member.idNorte.length > 5 && (
                      <p className="text-[10px] font-bold text-red-500 uppercase pl-2">Atleta não encontrado</p>
                    )}
                  </div>
                  {members.length > 1 && (
                    <button type="button" onClick={() => removeMember(idx)} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-600 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </form>

        <div className="p-6 border-t border-slate-800 bg-slate-950/50">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20 disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? 'Processando...' : 'Confirmar Lançamento'}
          </button>
          <p className="text-center text-[9px] text-slate-500 font-bold uppercase mt-4">
            A pontuação será atribuída a todos os integrantes
          </p>
        </div>

      </div>
    </div>
  );
};

export default ResultLaunchForm;
