
import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, XCircle, Search, User as UserIcon, ArrowLeft, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { useApp } from '../App';

const ConsultarIdNorte: React.FC = () => {
  const [searchParams] = useSearchParams();
  const numeroParam = searchParams.get('numero');
  const { db } = useApp();
  const navigate = useNavigate();

  const athlete = useMemo(() => {
    if (!numeroParam) return null;
    return db.users.find(u => u.id_norte_numero === numeroParam);
  }, [db.users, numeroParam]);

  const isValid = useMemo(() => {
    if (!athlete) return false;
    if (athlete.id_norte_status !== 'APROVADO') return false;
    if (!athlete.id_norte_validade) return false;
    
    const validade = new Date(athlete.id_norte_validade);
    return validade >= new Date();
  }, [athlete]);

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '---';
    return new Date(isoStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-[80vh] flex flex-col items-center justify-center py-10 animate-in fade-in duration-500">
      <div className="w-full max-w-md space-y-8">
        <header className="text-center">
          <button 
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 text-slate-500 hover:text-emerald-500 font-bold mb-6 mx-auto transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Início
          </button>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 border border-slate-800 rounded-[24px] mb-4 text-emerald-500">
            <Search className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Consultar ID Norte</h1>
          <p className="text-slate-500">Validação oficial da federação.</p>
        </header>

        {!numeroParam ? (
          <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 text-center">
            <p className="text-slate-400 font-medium italic">Nenhum número informado para consulta.</p>
          </div>
        ) : !athlete ? (
          <div className="bg-slate-900 p-10 rounded-[40px] border border-red-500/20 text-center space-y-4">
            <XCircle className="w-16 h-16 text-red-500 mx-auto opacity-50" />
            <h2 className="text-2xl font-black text-white">Registro Não Encontrado</h2>
            <p className="text-slate-500 text-sm">O número <span className="text-white font-mono">{numeroParam}</span> não consta em nossa base oficial de atletas filiados.</p>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-[40px] border border-slate-800 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className={`p-10 text-center space-y-6 ${isValid ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}>
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto border-2 ${isValid ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-red-500/10 border-red-500 text-red-500'}`}>
                {isValid ? <CheckCircle2 className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
              </div>
              
              <div>
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isValid ? 'bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/20' : 'bg-red-500 text-white'}`}>
                  {isValid ? 'Válida / Regular' : 'Irregular / Expirada'}
                </span>
                <h2 className="text-3xl font-black text-white mt-4 tracking-tight">{athlete.nome_completo}</h2>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 overflow-hidden">
                   {athlete.foto_url ? <img src={athlete.foto_url} className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 text-slate-600" />}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Registro Oficial</p>
                  <p className="text-lg font-black text-emerald-500 font-mono">{athlete.id_norte_numero}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2 text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    <Calendar className="w-3 h-3" /> Adesão
                  </div>
                  <p className="font-bold text-white text-sm">{formatDate(athlete.id_norte_adesao)}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2 text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    <Calendar className="w-3 h-3" /> Validade
                  </div>
                  <p className="font-bold text-white text-sm">{formatDate(athlete.id_norte_validade)}</p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
                 <MapPin className="w-5 h-5 text-emerald-500" />
                 <div>
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Cidade de Base</p>
                   <p className="font-bold text-white text-sm">{athlete.cidade} - {athlete.uf}</p>
                 </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-800/50 text-center">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Verificado pelo sistema FNPE em {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultarIdNorte;
