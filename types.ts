
export type UserLevel = "ADMIN" | "PESCADOR" | "ATLETA" | "DIRETORIA";
export type IdNorteStatus = "NAO_SOLICITADO" | "PENDENTE" | "APROVADO" | "REPROVADO";
export type Category = "CAIAQUE" | "EMBARCADO" | "ARREMESSO" | "BARRANCO";
export type MessageRecipientType = "TODOS" | "ATLETA" | "PESCADOR" | "ADMIN" | "DIRETORIA" | "INDIVIDUAL";
export type MessageStatus = "ENVIADA" | "AGENDADA" | "LIDA";

export type CobrancaStatus = "pendente" | "confirmado" | "cancelado";
export type CobrancaForma = "pagamento" | "cortesia" | "parceria" | "pendente";
export type CobrancaTipo = "id_norte" | "evento" | "outros" | "manual";
export type PagamentoMetodo = "pix" | "boleto" | "cartao" | "isento" | "manual";

export interface Partner {
  id: string;
  logo_url?: string;
  cnpj_cpf: string;
  razao_social: string;
  nome_fantasia: string;
  telefone: string;
  rede_social?: string;
  endereco: string;
  cidade: string;
  uf: string;
  website?: string;
  beneficio_descricao: string;
  criado_em: string;
}

export interface Cobranca {
  id: string;
  user_id?: string;
  tipo: CobrancaTipo;
  valor: number;
  status: CobrancaStatus;
  forma: CobrancaForma;
  data_criacao: string;
  data_pagamento?: string;
  link_pagamento?: string;
  pdf_boleto?: string;
  metodo?: PagamentoMetodo;
  observacao?: string;
  origem_receita?: string;
  admin_responsavel?: string;
  admin_nome?: string;
}

export interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
}

export interface User {
  id: string;
  email: string;
  nome_completo: string;
  cpf: string;
  telefone?: string;
  cidade: string;
  uf: string;
  foto_url?: string;
  nivel: UserLevel;
  id_norte_status: IdNorteStatus;
  id_norte_numero?: string;
  id_norte_pdf_link?: string;
  id_norte_pdf_url?: string;
  id_norte_adesao?: string;
  id_norte_validade?: string;
  id_norte_aprovado_em?: string;
  data_aprovacao_id_norte?: string;
  justificativa_id_norte?: string;
  criado_em?: string;
  atualizado_em?: string;
  data_nascimento?: string;
  sexo?: string;
  tempo_pescador?: string;
  historia?: string;
  galeria?: string[];
  password_defined?: boolean;
  first_login?: boolean;
}

export interface AppMessage {
  id: string;
  titulo: string;
  conteudo: string;
  anexos: ArquivoUpload[];
  link_externo?: string;
  destinatario_tipo: MessageRecipientType;
  destinatario_id?: string;
  data_envio: string;
  data_agendada?: string;
  enviado_por: string;
  status: MessageStatus;
  lida_por?: string[];
}

export interface EventCertified {
  id: string;
  codigo_certificado: string;
  nome_evento: string;
  descricao: string;
  instituicao_organizadora: string;
  responsaveis: string;
  cidade: string;
  uf: string;
  data_evento: string;
  tem_caiaque: boolean;
  tem_embarcado: boolean;
  tem_arremesso: boolean;
  tem_barranco?: boolean;
  logo_url?: string;
  criado_em?: string;
  contato_telefone?: string;
  email_contato_evento?: string;
  event_type?: 'presencial' | 'online';
  galeria?: string[];
  descricao_economica?: string;
  data_fim?: string;
  cnpj_instituicao?: string;
  arquivos?: ArquivoUpload[];
  responsaveis_dados?: { nome: string; telefone: string }[];
}

export interface EventResult {
  id: string;
  evento_id: string;
  atleta_id: string;
  id_norte_numero?: string;
  categoria: Category;
  pontuacao: number;
  colocacao?: number;
  criado_em?: string;
}

export interface IdNorteRequest {
  id: string;
  usuario_id: string;
  data_solicitacao: string;
  status: IdNorteStatus;
  observacao_admin?: string;
}

export interface EventTeam {
  id: string;
  event_id: string;
  name: string;
  category: Category;
  score?: number;
  created_at?: string;
  members?: EventTeamMember[]; // Helper
}

export interface EventTeamMember {
  id: string;
  team_id: string;
  user_id: string;
}

export interface Snapshot {
  id: string;
  criado_em: string;
  dados: DB;
  etiqueta?: string;
}

export interface ArquivoUpload {
  id: string;
  nome: string;
  tipo_mime: string;
  tamanho: number;
  url_dados: string;
}

export interface DB {
  users: User[];
  requests: IdNorteRequest[];
  certificationRequests: CertificationRequest[];
  events: EventCertified[];
  results: EventResult[];
  messages: AppMessage[];
  cobrancas: Cobranca[];
  despesas: Despesa[];
  partners: Partner[];
  eventTeams: EventTeam[];
  eventTeamMembers: EventTeamMember[];
  settings: {
    appBranding?: {
      appName: string;
      appLogoDataUrl?: string;
    };
    appSupport?: {
      supportWhatsApp: string;
      supportEmail: string;
    };
    rankingsCovers?: Record<string, string>;
    onlineRankingsCovers?: Record<string, string>;
  };
}

export type StatusSolicitacaoCertificacao = "PENDENTE" | "CERTIFICADO" | "REJEITADO";

export interface CertificationRequest {
  id: string;
  status: StatusSolicitacaoCertificacao;
  data_solicitacao: string;
  solicitado_por_usuario_id: string;
  solicitado_por_email: string;
  logo_evento?: string;
  nome_evento: string;
  descricao: string;
  periodo_inicio: string;
  periodo_fim: string;
  categorias: Category[];
  cidade: string;
  uf: string;
  instituicao_nome: string;
  instituicao_documento: string;
  responsaveis: string;
  responsaveis_contato: string;
  email_contato_evento: string;
  anexos: ArquivoUpload[];
  aprovado_em?: string;
  evento_id?: string;
  motivo_rejeicao?: string;
}
