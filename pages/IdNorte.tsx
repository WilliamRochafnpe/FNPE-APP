
import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  Loader2,
  Trophy,
  QrCode,
  DollarSign,
  FileText,
  Zap,
  Lock,
  Star,
  Award,
  ShoppingBag,
  Gift,
  Flame,
  Globe,
  Truck,
  Layers,
  X
} from 'lucide-react';
import { useApp } from '../App';
import { User, Cobranca } from '../types';
import IdNorteCard from '../components/IdNorteCard';
import { syncDatabase } from '../services/auth/supabaseAuth';

const IdNortePage: React.FC = () => {
  const { db, setDb, user, setUser } = useApp();
  const [loading, setLoading] = useState(false);

  const minhaCobranca = useMemo(() => {
    return (db.cobrancas || []).find(c => c.user_id === user?.id && c.tipo === 'id_norte');
  }, [db.cobrancas, user]);

  const pendingRequests = useMemo(() => {
    return db.users.filter(u => u.id_norte_status === 'PENDENTE');
  }, [db.users]);

  const handleRequest = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let updatedCobrancas = [...(db.cobrancas || [])];
      const novaCobranca: Cobranca = {
        id: `rev-auto-id-${Date.now()}`,
        user_id: user.id,
        tipo: 'id_norte',
        valor: 5000,
        status: 'pendente',
        forma: 'pendente',
        data_criacao: new Date().toISOString(),
        observacao: `Taxa de adesão ID Norte solicitada via App.`
      };

      updatedCobrancas.push(novaCobranca);
      const updatedUser = { ...user, id_norte_status: 'PENDENTE' as const };

      setDb(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === user.id ? updatedUser : u),
        cobrancas: updatedCobrancas
      }));
      setUser(updatedUser);

      if (user.email !== 'admin@fnpe.com.br') { // Simple check, though IS_SUPABASE is better
        try {
          await syncDatabase.updateUser(updatedUser);
          await syncDatabase.insertCobranca(novaCobranca);
        } catch (syncErr) {
          console.error("Erro ao sincronizar solicitação ID Norte:", syncErr);
          // We don't block UI but warn? Or assume eventually consistent.
        }
      }
    } catch (err: any) {
      alert("Erro ao processar solicitação: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const simularPagamento = async () => {
    if (!minhaCobranca) return;
    setLoading(true);
    setDb(prev => ({
      ...prev,
      cobrancas: prev.cobrancas.map(c =>
        c.id === minhaCobranca.id
          ? { ...c, status: 'confirmado', forma: 'pagamento', data_pagamento: new Date().toISOString(), admin_nome: 'SISTEMA AUTOMÁTICO' }
          : c
      )
    }));
    setLoading(false);
    alert("✅ Pagamento simulado com sucesso!");
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl mx-auto pb-24 px-4">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-black text-white tracking-tight uppercase">ID NORTE</h1>
        <p className="text-slate-500 font-medium italic">Seu passaporte oficial para a pesca esportiva profissional.</p>
      </header>

      {user?.nivel === 'ADMIN' ? (
        <div className="space-y-12">
          {/* EXIBIÇÃO DA ID DIGITAL DO ADMIN */}
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
              <h2 className="text-lg font-black text-white uppercase tracking-widest">Minha Credencial Digital</h2>
            </div>
            {user && <IdNorteCard user={user} />}
          </div>

          {/* LISTA DE SOLICITAÇÕES PENDENTES */}
          <div className="space-y-8 pt-10 border-t border-slate-800">
            <div className="flex items-center gap-3 px-2">
              <div className="w-2 h-6 bg-amber-500 rounded-full"></div>
              <h2 className="text-lg font-black text-white uppercase tracking-widest">Solicitações em Análise</h2>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {pendingRequests.length === 0 ? (
                <p className="text-slate-600 italic text-center py-10">Nenhuma solicitação pendente no momento.</p>
              ) : (
                pendingRequests.map(requester => {
                  const cob = db.cobrancas.find(c => c.user_id === requester.id && c.tipo === 'id_norte');
                  const isFinanciado = cob?.status === 'confirmado';

                  const handleAprovar = async () => {
                    if (!isFinanciado) return;
                    if (!confirm(`Aprovar ID Norte de ${requester.nome_completo}?`)) return;

                    const validade = new Date();
                    validade.setFullYear(validade.getFullYear() + 1);

                    const updatedRequester: User = {
                      ...requester,
                      nivel: 'ATLETA', // Promote to Atleta
                      id_norte_status: 'APROVADO',
                      data_aprovacao_id_norte: new Date().toISOString(),
                      id_norte_validade: validade.toISOString(),
                      id_norte_numero: `ID-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
                    };

                    try {
                      if (user.email !== 'admin@fnpe.com.br') { // Should be admin check
                        // Assume admin is logged in if viewing this
                      }
                      // Persist
                      await syncDatabase.updateUser(updatedRequester);

                      setDb(prev => ({
                        ...prev,
                        users: prev.users.map(u => u.id === requester.id ? updatedRequester : u)
                      }));
                      alert(`ID Norte de ${requester.nome_completo} aprovada com sucesso!`);
                    } catch (err) {
                      alert("Erro ao aprovar: " + err);
                    }
                  };

                  return (
                    <div key={requester.id} className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-950 rounded-[24px] flex items-center justify-center border border-slate-800 overflow-hidden shrink-0">
                          {requester.foto_url ? <img src={requester.foto_url} className="w-full h-full object-cover" /> : <Trophy className="text-slate-800 w-8 h-8" />}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white leading-tight">{requester.nome_completo}</h3>
                          <div className="flex items-center gap-4 mt-2">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${isFinanciado ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                              {isFinanciado ? 'FINANCEIRO OK' : 'PENDENTE NO FINANCEIRO'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 w-full md:w-auto">
                        <button
                          onClick={handleAprovar}
                          disabled={!isFinanciado}
                          className={`flex-1 md:flex-none font-black py-4 px-8 rounded-2xl transition-all shadow-lg ${isFinanciado ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer' : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'}`}
                        >
                          {isFinanciado ? 'Aprovar' : 'Bloqueado'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {user?.id_norte_status === 'NAO_SOLICITADO' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-6 duration-700">

              {/* SEÇÃO O QUE É A FILIAÇÃO */}
              <section className="bg-slate-900 p-8 md:p-12 rounded-[56px] border border-slate-800 shadow-2xl space-y-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-emerald-500/10 rounded-3xl text-emerald-500">
                    <Award className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">O que é a filiação?</h2>
                    <p className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest">Reconhecimento oficial FNPE</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="text-slate-400 leading-relaxed font-medium text-lg">
                    Ao se filiar à Federação Norte, o pescador esportivo passa a ser reconhecido como <span className="text-white font-bold">atleta de pesca esportiva</span> na região Norte do Brasil. Você fica habilitado a participar do ranking regional e acumular pontos oficiais.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <BenefitItem icon={Trophy} text="Participar do ranking oficial da FNPE na região Norte." />
                    <BenefitItem icon={Star} text="Pontuar em eventos certificados, válidos para ranking estadual." />
                    <BenefitItem icon={ShoppingBag} text="Descontos em lojas parceiras, pousadas e acessórios." />
                    <BenefitItem icon={Gift} text="Sorteios periódicos de prêmios e kits de pesca." />
                    <BenefitItem icon={Flame} text="Prioridade em inscrições de eventos com vagas reduzidas." />
                    <BenefitItem icon={FileText} text="Certificado digital de atleta federado oficial." />
                  </div>
                </div>
              </section>

              {/* SOBRE A ID NORTE - CARD PADRÃO (IGUAL À IMAGEM) */}
              <section className="bg-indigo-600 p-8 md:p-12 rounded-[56px] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-[-10%] right-[-10%] opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                  <CreditCard className="w-64 h-64 text-white" />
                </div>

                <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/20 rounded-3xl text-white backdrop-blur-md">
                      <Layers className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">Sobre a ID Norte</h2>
                      <p className="text-white/80 font-black uppercase text-[10px] tracking-widest">A Carteira Oficial do Atleta</p>
                    </div>
                  </div>

                  <p className="text-white/90 text-lg leading-relaxed font-medium max-w-2xl">
                    A ID Norte é a carteira oficial do atleta federado da região Norte, produzida com tecnologia e durabilidade.
                  </p>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <CardSpec icon={DollarSign} label="Valor Adesão" value="R$ 50,00" />
                    <CardSpec icon={ShieldCheck} label="Material" value="PVC Rígido" />
                    <CardSpec icon={Layers} label="Padrão" value="Cartão Bancário" />
                    <CardSpec icon={Truck} label="Prazo Entrega" value="Até 30 dias" />
                  </div>

                  <div className="bg-black/20 p-8 rounded-[32px] border border-white/10 backdrop-blur-sm">
                    <p className="text-white/90 text-sm md:text-base leading-relaxed italic text-center font-medium">
                      "Ao portar sua ID Norte, você comprova sua condição de atleta federado, fortalece a Federação Norte de Pesca Esportiva e ajuda a escrever uma nova história da pesca esportiva na Amazônia."
                    </p>
                  </div>
                </div>
              </section>

              {/* CTA FINAL */}
              <div className="flex flex-col items-center gap-6 py-8">
                <button
                  onClick={handleRequest}
                  disabled={loading}
                  className="w-full max-w-md bg-emerald-500 text-slate-950 py-7 rounded-[32px] font-black uppercase text-base tracking-widest hover:bg-emerald-400 shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                  Solicitar Minha ID Norte
                </button>
              </div>

            </div>
          )}

          {user?.id_norte_status === 'PENDENTE' && (
            <div className="bg-slate-900 p-12 rounded-[56px] border border-slate-800 shadow-xl flex flex-col items-center text-center space-y-8 max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-amber-500/10 text-amber-500 rounded-[32px] flex items-center justify-center animate-pulse">
                <Clock className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white uppercase tracking-tight">Solicitação em Análise</h2>
                <p className="text-slate-500">Sua ID Norte está sendo processada pela nossa diretoria técnica.</p>
              </div>
              <div className="pt-6 border-t border-slate-800 w-full">
                <button onClick={simularPagamento} className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                  [Simular Pagamento Compensado]
                </button>
              </div>
            </div>
          )}

          {user?.id_norte_status === 'APROVADO' && (
            <div className="flex flex-col items-center">
              <IdNorteCard user={user} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Componentes Auxiliares
const BenefitItem: React.FC<{ icon: any, text: string }> = ({ icon: Icon, text }) => (
  <div className="flex gap-4 p-5 bg-slate-950 rounded-2xl border border-slate-800/50 hover:border-emerald-500/30 transition-all">
    <Icon className="w-6 h-6 text-emerald-500 shrink-0" />
    <p className="text-sm text-slate-400 font-bold leading-snug">{text}</p>
  </div>
);

const CardSpec: React.FC<{ icon: any, label: string, value: string }> = ({ icon: Icon, label, value }) => (
  <div className="bg-white/10 p-6 rounded-[28px] backdrop-blur-md border border-white/5 flex flex-col items-center text-center">
    <Icon className="w-6 h-6 text-white mb-3 opacity-60" />
    <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">{label}</p>
    <p className="text-sm md:text-base font-black text-white uppercase tracking-tight">{value}</p>
  </div>
);

export default IdNortePage;
