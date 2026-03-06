
import React, { useState, useMemo } from 'react';
import {
  Trophy, ShieldCheck, Clock, CheckCircle2,
  Search, Eye, MapPin, Calendar, Building, FileText,
  X, Download, Image as ImageIcon,
  Loader2, Mail, XCircle, Phone, Info, ExternalLink, Paperclip,
  AlertCircle, Check, AlertTriangle
} from 'lucide-react';
import { useApp } from '../App';
import { CertificationRequest, StatusSolicitacaoCertificacao as CertificationRequestStatus, EventCertified, AppMessage } from '../types';
import { syncDatabase } from '../services/auth/supabaseAuth';
import { SUPABASE_ENABLED } from '../lib/supabase';

const AdminCertificationRequests: React.FC = () => {
  const { db, setDb, user: admin } = useApp();
  const [filterStatus, setFilterStatus] = useState<CertificationRequestStatus | 'TODAS'>('PENDENTE');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReq, setSelectedReq] = useState<CertificationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [confirmApprovalId, setConfirmApprovalId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const requests = useMemo(() => {
    const base = db.certificationRequests || [];
    return base.filter(r => {
      const matchStatus = filterStatus === 'TODAS' || r.status === filterStatus;
      const matchSearch = (r.nome_evento || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.instituicao_nome || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    }).sort((a, b) => new Date(b.data_solicitacao).getTime() - new Date(a.data_solicitacao).getTime());
  }, [db.certificationRequests, filterStatus, searchTerm]);

  const handleAprovarCertificacao = async (req: CertificationRequest) => {
    if (!admin) return;

    setProcessing(true);
    try {
      const timestamp = new Date().toISOString();
      const currentEvents = db.events || [];
      const count = currentEvents.length + 1;
      const codigoCertificado = `ID Evento - ${count.toString().padStart(5, '0')}`;

      const newEvent: EventCertified = {
        id: `event-${Date.now()}`,
        codigo_certificado: codigoCertificado,
        nome_evento: req.nome_evento,
        descricao: req.descricao || '',
        instituicao_organizadora: req.instituicao_nome,
        responsaveis: req.responsaveis,
        cidade: req.cidade,
        uf: req.uf,
        data_evento: req.periodo_inicio,
        tem_caiaque: req.categorias.includes('CAIAQUE'),
        tem_embarcado: req.categorias.includes('EMBARCADO'),
        tem_arremesso: req.categorias.includes('ARREMESSO'),
        tem_barranco: req.categorias.includes('BARRANCO'),
        logo_url: req.logo_evento,
        email_contato_evento: req.email_contato_evento,
        contato_telefone: req.responsaveis_contato,
        criado_em: timestamp
      };

      const systemMessage: AppMessage = {
        id: `msg-auto-${Date.now()}`,
        titulo: '🏆 Evento Federado com Sucesso!',
        conteudo: 'Parabéns, seu evento foi aprovado e agora é um evento federado! Em breve você receberá em seu e-mail o certificado. Confira na página Eventos do seu app, o evento já está disponível.',
        destinatario_tipo: 'INDIVIDUAL',
        destinatario_id: req.solicitado_por_usuario_id,
        anexos: [],
        data_envio: timestamp,
        enviado_por: admin.id,
        status: 'ENVIADA',
        lida_por: []
      };

      if (SUPABASE_ENABLED) {
        const result = await syncDatabase.upsertEvento(newEvent);
        // Use the returned ID (UUID) if available, otherwise fallback (though result should have it)
        const finalEventId = result?.id || newEvent.id;

        // Update local newEvent with real ID
        const confirmedEvent = { ...newEvent, id: finalEventId };

        await syncDatabase.updateCertificationRequest(req.id, {
          status: 'CERTIFICADO',
          aprovado_em: timestamp,
          evento_id: finalEventId
        });
        await syncDatabase.insertMessage(systemMessage);

        setDb(prev => ({
          ...prev,
          events: [...(prev.events || []), confirmedEvent],
          messages: [systemMessage, ...(prev.messages || [])],
          certificationRequests: (prev.certificationRequests || []).map(r =>
            r.id === req.id ? { ...r, status: 'CERTIFICADO', aprovado_em: timestamp, evento_id: finalEventId } : r
          )
        }));
      } else {
        setDb(prev => ({
          ...prev,
          events: [...(prev.events || []), newEvent],
          messages: [systemMessage, ...(prev.messages || [])],
          certificationRequests: (prev.certificationRequests || []).map(r =>
            r.id === req.id ? { ...r, status: 'CERTIFICADO', aprovado_em: timestamp, evento_id: newEvent.id } : r
          )
        }));
      }

      showToast(`Evento "${req.nome_evento}" certificado com sucesso!`);
      setSelectedReq(null);
      setConfirmApprovalId(null);
    } catch (err: any) {
      showToast("Falha técnica na aprovação: " + err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleRecusarCertificacao = async () => {
    if (!admin || !selectedReq) return;

    if (!rejectReason.trim()) {
      showToast("Informe o motivo da rejeição.", 'error');
      return;
    }

    setProcessing(true);
    try {
      if (SUPABASE_ENABLED) {
        await syncDatabase.updateCertificationRequest(selectedReq.id, {
          status: 'REJEITADO',
          motivo_rejeicao: rejectReason
        });
      }

      setDb(prev => ({
        ...prev,
        certificationRequests: (prev.certificationRequests || []).map(r =>
          r.id === selectedReq.id ? { ...r, status: 'REJEITADO', motivo_rejeicao: rejectReason } : r
        )
      }));

      showToast("Solicitação recusada.");
      setSelectedReq(null);
      setIsRejecting(false);
      setRejectReason('');
    } catch (err: any) {
      showToast("Erro ao rejeitar: " + err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const renderResponsaveis = (nomes: string, contatos: string) => {
    const nomeList = (nomes || '').split(';').map(n => n.trim()).filter(Boolean);
    const contatoList = (contatos || '').split(';').map(n => n.trim()).filter(Boolean);

    return nomeList.map((nome, idx) => (
      <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-900 rounded-2xl border border-slate-800 gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center font-black text-xs">
            {idx + 1}
          </div>
          <span className="font-bold text-white text-sm uppercase">{nome}</span>
        </div>
        {contatoList[idx] && (
          <div className="flex items-center gap-2 text-slate-400 font-mono text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Phone className="w-3 h-3 text-emerald-500" />
            {contatoList[idx]}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative">
      {toast && (
        <div className="fixed bottom-24 right-8 z-[200] animate-in slide-in-from-right-4 duration-300">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-emerald-600 border-emerald-500' : 'bg-red-600 border-red-500'
            } text-white`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-bold text-sm uppercase tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}

      <header>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Solicitações de Certificação</h1>
        <p className="text-slate-500 font-medium italic">Gestão e homologação de torneios federados.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 shadow-sm w-full md:w-fit overflow-x-auto">
          {(['PENDENTE', 'CERTIFICADO', 'REJEITADO', 'TODAS'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st as any)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === st ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
          <input
            placeholder="Buscar evento..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-12 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-white placeholder:text-slate-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-900 rounded-[40px] border border-dashed border-slate-800">
            <Clock className="w-12 h-12 text-slate-800 mx-auto mb-4" />
            <p className="text-slate-600 font-bold italic">Nenhum pedido pendente.</p>
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="bg-slate-900 rounded-[32px] border border-slate-800 shadow-xl overflow-hidden flex flex-col hover:border-emerald-500/50 transition-all group">
              <div className="p-6 space-y-4 flex-1">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 overflow-hidden">
                      {req.logo_evento ? <img src={req.logo_evento} className="w-full h-full object-cover" alt="Logo" /> : <Trophy className="w-6 h-6 text-slate-800" />}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-black text-white leading-tight group-hover:text-emerald-500 transition-colors truncate max-w-[150px]">{req.nome_evento}</h3>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 truncate max-w-[150px]">{req.instituicao_nome}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${req.status === 'PENDENTE' ? 'bg-amber-500/10 text-amber-500' :
                    req.status === 'CERTIFICADO' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                    {req.status}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-950/50 flex gap-2 border-t border-slate-800">
                <button
                  onClick={() => setSelectedReq(req)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-400 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                >
                  <Eye className="w-4 h-4" /> Detalhes
                </button>
                {req.status === 'PENDENTE' && (
                  <button
                    onClick={() => setSelectedReq(req)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Avaliar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedReq && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => !confirmApprovalId && setSelectedReq(null)}>
          <div
            className="bg-slate-900 rounded-[48px] w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col relative"
            onClick={e => e.stopPropagation()}
          >
            {confirmApprovalId === selectedReq.id && (
              <div className="absolute inset-0 bg-slate-900/98 z-[110] flex flex-col items-center justify-center p-12 text-center space-y-6 animate-in fade-in duration-300">
                <div className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center shadow-inner">
                  <ShieldCheck className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Confirmar Certificação?</h3>
                  <p className="text-slate-400 max-w-md mx-auto italic font-medium">
                    O evento será publicado no calendário oficial e uma notificação automática será enviada ao organizador.
                  </p>
                </div>
                <div className="flex gap-4 w-full max-w-md pt-6">
                  <button
                    onClick={() => setConfirmApprovalId(null)}
                    className="flex-1 py-5 bg-slate-800 text-slate-400 font-black uppercase text-xs rounded-[24px] hover:bg-slate-700 transition-all"
                  >
                    Voltar e Revisar
                  </button>
                  <button
                    onClick={() => handleAprovarCertificacao(selectedReq)}
                    disabled={processing}
                    className="flex-2 w-full py-5 bg-emerald-500 text-slate-950 font-black uppercase text-xs rounded-[24px] flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                  >
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Confirmar Homologação</>}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-emerald-600 p-8 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-black tracking-tight uppercase">Avaliar Solicitação</h2>
                  <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest">Homologação Oficial FNPE</p>
                </div>
              </div>
              <button onClick={() => setSelectedReq(null)} className="p-3 hover:bg-white/20 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              <section className="space-y-6">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-32 h-32 bg-slate-950 rounded-[40px] border-2 border-slate-800 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                    {selectedReq.logo_evento ? <img src={selectedReq.logo_evento} className="w-full h-full object-cover" alt="Logo" /> : <ImageIcon className="w-12 h-12 text-slate-800" />}
                  </div>
                  <div className="space-y-3 text-center md:text-left flex-1">
                    <h3 className="text-4xl font-black text-white tracking-tighter leading-tight uppercase">{selectedReq.nome_evento}</h3>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                      <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                        <Building className="w-4 h-4" /> {selectedReq.instituicao_nome}
                      </div>
                      {selectedReq.instituicao_documento && (
                        <div className="flex items-center gap-2 bg-slate-950 text-slate-500 px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] font-mono font-bold">
                          DOC: {selectedReq.instituicao_documento}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/50 p-8 rounded-[40px] border border-slate-800 relative">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-500" /> Descrição do Evento
                  </h4>
                  <p className="text-slate-300 text-lg font-medium leading-relaxed italic whitespace-pre-wrap">
                    {selectedReq.descricao || "Nenhuma descrição fornecida."}
                  </p>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-950 p-6 rounded-[32px] space-y-4 border border-slate-800">
                  <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-800 pb-3">Datas e Local</h4>
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-900 rounded-2xl text-emerald-500"><Calendar className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[9px] font-black text-slate-600 uppercase">Período</p>
                        <p className="font-bold text-white text-sm">{new Date(selectedReq.periodo_inicio).toLocaleDateString()} a {new Date(selectedReq.periodo_fim).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-900 rounded-2xl text-emerald-500"><MapPin className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[9px] font-black text-slate-600 uppercase">Localidade</p>
                        <p className="font-bold text-white text-sm">{selectedReq.cidade} - {selectedReq.uf}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-6 rounded-[32px] space-y-4 border border-slate-800">
                  <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-800 pb-3">Categorias Solicitadas</h4>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedReq.categorias.map(c => (
                      <span key={c} className="bg-emerald-500/5 text-emerald-500 border border-emerald-500/20 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-widest">Corpo Diretivo do Evento</h4>
                  <Mail className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {renderResponsaveis(selectedReq.responsaveis, selectedReq.responsaveis_contato)}
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-600" />
                  <div>
                    <p className="text-[8px] font-black text-slate-600 uppercase">E-mail de Contato Principal</p>
                    <p className="text-sm font-bold text-emerald-400">{selectedReq.email_contato_evento}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-widest">Documentação Anexada</h4>
                  <Paperclip className="w-4 h-4 text-emerald-500" />
                </div>

                {selectedReq.anexos && selectedReq.anexos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedReq.anexos.map((file) => (
                      <a
                        key={file.id}
                        href={file.url_dados}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-5 bg-slate-950 rounded-3xl border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all group shadow-sm"
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="p-3 bg-slate-900 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-200 truncate pr-4">{file.nome}</p>
                            <p className="text-[9px] font-black text-slate-600 uppercase">{(file.tamanho / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-700 group-hover:text-emerald-500 transition-colors shrink-0" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center bg-slate-950/50 border border-dashed border-slate-800 rounded-[32px]">
                    <AlertCircle className="w-10 h-10 text-slate-800 mx-auto mb-3" />
                    <p className="text-slate-600 font-bold text-sm italic">Nenhum anexo enviado.</p>
                  </div>
                )}
              </section>

              {selectedReq.status === 'REJEITADO' && (
                <section className="bg-red-500/10 border-2 border-red-500/20 p-8 rounded-[40px] space-y-4">
                  <div className="flex items-center gap-3 text-red-500">
                    <XCircle className="w-6 h-6" />
                    <h4 className="text-xs font-black uppercase tracking-widest">Justificativa da Rejeição</h4>
                  </div>
                  <p className="text-red-400 text-lg italic font-medium">"{selectedReq.motivo_rejeicao || "Não detalhado."}"</p>
                </section>
              )}
            </div>

            <div className="p-8 border-t border-slate-800 bg-slate-950/50 shrink-0">
              {isRejecting ? (
                <div className="space-y-4 animate-in slide-in-from-bottom-2">
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Descreva detalhadamente o motivo da rejeição..."
                    className="w-full bg-slate-900 border-2 border-red-500/20 rounded-3xl p-6 h-32 outline-none focus:ring-4 focus:ring-red-500/10 text-white font-medium text-base shadow-inner"
                  />
                  <div className="flex gap-4">
                    <button onClick={() => setIsRejecting(false)} className="flex-1 py-5 font-black uppercase text-[10px] tracking-widest text-slate-500 hover:text-white transition-colors">Cancelar</button>
                    <button
                      onClick={handleRecusarCertificacao}
                      disabled={!rejectReason.trim() || processing}
                      className="flex-[2] bg-red-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl py-5 shadow-xl shadow-red-500/20 flex items-center justify-center gap-3 transition-all hover:bg-red-500 active:scale-95 disabled:opacity-50"
                    >
                      {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><XCircle className="w-5 h-5" /> Confirmar Rejeição</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4">
                  {selectedReq.status === 'PENDENTE' && (
                    <>
                      <button onClick={() => setIsRejecting(true)} className="flex-1 py-5 bg-slate-800 text-slate-400 font-black uppercase text-xs tracking-widest rounded-3xl hover:bg-red-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2">
                        <X className="w-5 h-5" /> Recusar
                      </button>
                      <button
                        onClick={() => setConfirmApprovalId(selectedReq.id)}
                        disabled={processing}
                        className="flex-[2] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-xs tracking-widest rounded-3xl py-5 shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                      >
                        <CheckCircle2 className="w-5 h-5" /> Aprovar & Gerar Certificado
                      </button>
                    </>
                  )}
                  {selectedReq.status !== 'PENDENTE' && (
                    <button onClick={() => setSelectedReq(null)} className="w-full py-5 bg-slate-800 text-slate-400 font-black uppercase text-xs tracking-widest rounded-3xl hover:bg-slate-700 transition-all border border-slate-700">Fechar Detalhes</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCertificationRequests;
