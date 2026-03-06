
import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  MapPin, 
  ShieldCheck, 
  Trophy
} from 'lucide-react';
import { useApp } from '../App';
import { User } from '../types';
import AthleteProfileModal from '../components/AthleteProfileModal';

const Athletes: React.FC = () => {
  const { db, user: currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState<User | null>(null);

  // Alterado para incluir o ADMIN e outros níveis na galeria
  const athletes = db.users;
  
  const filteredAthletes = athletes.filter(a => 
    a.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.id_norte_numero?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAthletePoints = (userId: string) => {
    return db.results.filter(r => r.atleta_id === userId).reduce((acc, curr) => acc + curr.pontuacao, 0);
  };

  const getLevelLabel = (level: string) => {
    if (level === 'ADMIN') return 'Admin';
    if (level === 'DIRETORIA') return 'Diretoria';
    if (level === 'ATLETA') return 'Atleta';
    return 'Pescador';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Galeria de Atletas</h1>
        <p className="text-slate-500 font-medium italic">Consulte a base de competidores filiados à FNPE.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 w-6 h-6" />
        <input 
          type="text"
          placeholder="Buscar por nome ou ID Norte..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-16 pr-6 py-5 bg-slate-900 border border-slate-800 rounded-[32px] outline-none shadow-xl focus:ring-2 focus:ring-emerald-500 transition-all text-lg font-bold text-white placeholder:text-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAthletes.map((athlete) => (
          <div 
            key={athlete.id} 
            onClick={() => setSelectedAthlete(athlete)} 
            className="bg-slate-900 rounded-[40px] p-6 border border-slate-800 shadow-2xl hover:border-emerald-500/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-700 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-all overflow-hidden shadow-inner">
                {athlete.foto_url ? <img src={athlete.foto_url} className="w-full h-full object-cover" /> : <Users className="w-8 h-8" />}
              </div>
              <div className="flex-1">
                <h3 className="font-black text-white text-lg leading-tight group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{athlete.nome_completo}</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">{getLevelLabel(athlete.nivel)}</p>
              </div>
              {(athlete.nivel === 'ATLETA' || athlete.nivel === 'ADMIN') && <ShieldCheck className="w-6 h-6 text-emerald-500" />}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Matrícula</span>
                <span className="font-mono text-emerald-500 font-black tracking-widest">{athlete.id_norte_numero || 'PENDENTE'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pontuação Geral</span>
                <span className="text-xl font-black text-white">{getAthletePoints(athlete.id).toLocaleString('pt-BR')}</span>
              </div>
              <div className="pt-2 flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <MapPin className="w-4 h-4 text-emerald-500" />
                {athlete.cidade} / {athlete.uf}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedAthlete && (
        <AthleteProfileModal 
          athlete={selectedAthlete} 
          db={db} 
          onClose={() => setSelectedAthlete(null)} 
        />
      )}
    </div>
  );
};

export default Athletes;
