import { supabase } from '../../lib/supabase';
import { AuthService, AuthProfileData } from './types';
// Remove duplicate UserLevel import
import { User, DB, UserLevel, EventResult, AppMessage, Cobranca, Despesa, CertificationRequest, EventCertified, Partner } from '../../types';
import { ADMIN_EMAIL } from '../../db';

const T_ATLETAS = 'atletas';

export function mapRowToUser(row: any): User {
  if (!row) return null as any;
  const email = (row.email || '').toLowerCase().trim();
  const isAdmin = email === ADMIN_EMAIL.toLowerCase();

  return {
    id: row.id,
    email: email,
    nome_completo: row.nome_completo || row.nomeCompleto || 'Sem Nome',
    cpf: row.cpf || '',
    telefone: row.telefone || '',
    cidade: row.cidade || '',
    uf: row.uf || '',
    nivel: isAdmin ? 'ADMIN' : (row.nivel || 'PESCADOR'),
    id_norte_status: row.id_norte_status || 'NAO_SOLICITADO',
    id_norte_numero: row.id_norte_numero,
    id_norte_pdf_url: row.id_norte_pdf_url,
    id_norte_validade: row.id_norte_validade,
    data_aprovacao_id_norte: row.data_aprovacao_id_norte,
    foto_url: row.foto_url,
    criado_em: row.criado_em,
    data_nascimento: row.data_nascimento,
    sexo: row.sexo,
    tempo_pescador: row.tempo_pescador,
    historia: row.historia,
    galeria: row.galeria || [],
    password_defined: row.password_defined,
    first_login: row.first_login
  } as User;
}

export const supabaseAuth: AuthService = {
  async requestOtp(email: string) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true // Garante que cria conta se não existir
        }
      });
      if (error) throw error;
    } catch (error: any) {
      if (error.status === 504 || error.status === 502) {
        throw new Error("O servidor de e-mail está demorando para responder (Timeout). Aguarde 1 minuto e tente novamente.");
      }
      throw error;
    }
  },

  async verifyOtp(email: string, token: string) {
    const { error } = await supabase.auth.verifyOtp({ email: email.toLowerCase().trim(), token, type: "email" });
    if (error) return { success: false, error: error.message };
    const { data: { user } } = await supabase.auth.getUser();
    const { data: atleta } = await supabase.from(T_ATLETAS).select('cpf').eq('id', user?.id).maybeSingle();
    return { success: true, profileIncomplete: !atleta?.cpf };
  },

  async findUserByEmail(_db: DB, email: string) {
    const { data } = await supabase.from(T_ATLETAS).select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
    return data ? mapRowToUser(data) : null;
  },

  async findUserByCpf(_db: DB, cpf: string) {
    const { data } = await supabase.from(T_ATLETAS).select('*').eq('cpf', cpf.replace(/\D/g, '')).maybeSingle();
    return data ? mapRowToUser(data) : null;
  },

  async createUserFromProfile(_db: DB, _setDb: any, profile: AuthProfileData) {
    const { data: { user } } = await supabase.auth.getUser();
    const row = {
      id: user?.id,
      email: user?.email,
      nome_completo: profile.nomeCompleto,
      cpf: profile.cpf.replace(/\D/g, ''),
      telefone: profile.telefone,
      cidade: profile.cidade,
      uf: profile.estado,
      nivel: user?.email === ADMIN_EMAIL ? 'ADMIN' : 'PESCADOR',
      sexo: profile.sexo,
      data_nascimento: profile.dataNascimento
    };
    const { data, error } = await supabase.from(T_ATLETAS).upsert(row).select().single();
    if (error) throw error;
    return mapRowToUser(data);
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  async markPasswordDefined(userId: string) {
    // Only works if the column exists in public.atletas
    const { error } = await supabase.from(T_ATLETAS).update({ password_defined: true }).eq('id', userId);
    // Silent fail if column doesn't exist yet (migration pending), but we should try.
    if (error) console.error("Error marking password defined:", error);
  },

  async checkUserStatus(email: string) {
    const { data } = await supabase.from(T_ATLETAS).select('id, password_defined, first_login').eq('email', email.toLowerCase().trim()).maybeSingle();
    return data;
  }
};

export const syncDatabase = {
  /**
   * Sincroniza todo o estado da nuvem para o estado local
   * Fix: added 'parceiros' fetch and include in return object to satisfy DB interface.
   */
  async fetchAll(): Promise<DB> {
    const [atletRes, eventRes, resRes, msgRes, cobRes, despRes, confRes, certRes, partnerRes, teamsRes, teamMembersRes] = await Promise.all([
      supabase.from(T_ATLETAS).select('*'),
      supabase.from('eventos').select('*'),
      supabase.from('resultados').select('*'),
      supabase.from('mensagens').select('*'),
      supabase.from('cobrancas').select('*'),
      supabase.from('despesas').select('*'),
      supabase.from('configuracoes').select('*').eq('id', 'global').maybeSingle(),
      supabase.from('solicitacoes_evento').select('*'),
      supabase.from('parceiros').select('*'),
      supabase.from('event_teams').select('*'),
      supabase.from('event_team_members').select('*')
    ]);

    return {
      users: (atletRes.data || []).map(mapRowToUser),
      events: eventRes.data || [],
      results: resRes.data || [],
      messages: msgRes.data || [],
      cobrancas: cobRes.data || [],
      despesas: despRes.data || [],
      requests: [],
      certificationRequests: certRes.data || [],
      partners: partnerRes.data || [],
      eventTeams: teamsRes.data || [],
      eventTeamMembers: teamMembersRes.data || [],
      settings: {
        appBranding: { appName: confRes.data?.nome_do_aplicativo || 'FNPE' },
        rankingsCovers: confRes.data?.rankings_covers || {},
        onlineRankingsCovers: confRes.data?.online_rankings_covers || {}
      }
    };
  },

  // Eventos
  async upsertEvento(evento: EventCertified) {
    // Strip client-side ID if it's a temp ID (starts with event-) to let Supabase gen UUID
    const isTempId = evento.id.startsWith('event-');
    const { id, ...rest } = evento;
    const data = isTempId ? rest : evento;
    const { data: inserted, error } = await supabase.from('eventos').upsert(data).select().single();
    if (error) throw error;
    return inserted as EventCertified;
  },
  async deleteEvento(id: string) { return await supabase.from('eventos').delete().eq('id', id); },

  // Equipes
  async insertEventTeam(team: any) {
    const { id, ...rest } = team;
    const isTemp = id.startsWith('team-');
    const data = isTemp ? rest : team;
    const { data: inserted, error } = await supabase.from('event_teams').insert(data).select().single();
    if (error) throw error;
    return inserted;
  },
  async insertEventTeamMembers(members: any[]) {
    // strip temp IDs if needed, but members usually have no ID or auto-gen.
    // Assuming members array is clean or we strip 'id' if it is temp.
    const cleanMembers = members.map(m => {
      const { id, ...rest } = m;
      return rest; // Let DB gen UUID
    });
    const { data, error } = await supabase.from('event_team_members').insert(cleanMembers).select();
    if (error) throw error;
    return data;
  },
  async deleteEventTeam(id: string) {
    const { error } = await supabase.from('event_teams').delete().eq('id', id);
    if (error) throw error;
  },
  async deleteEventTeamMembers(teamId: string) {
    const { error } = await supabase.from('event_team_members').delete().eq('team_id', teamId);
    if (error) throw error;
  },
  async upsertEventTeam(team: any) {
    const { id, ...rest } = team;
    const isTemp = id.startsWith('team-');
    const data = isTemp ? rest : team;

    const { data: inserted, error } = await supabase.from('event_teams').upsert(data).select().single();
    if (error) throw error;
    return inserted;
  },

  // Resultados (Rankings)
  async insertResult(res: EventResult) { return await supabase.from('resultados').insert(res); },
  async deleteResult(id: string) { return await supabase.from('resultados').delete().eq('id', id); },

  // Mensagens
  async insertMessage(msg: AppMessage) { return await supabase.from('mensagens').insert(msg); },
  async deleteMessage(id: string) { return await supabase.from('mensagens').delete().eq('id', id); },
  async markMessageAsRead(msgId: string, userId: string) {
    const { data } = await supabase.from('mensagens').select('lida_por').eq('id', msgId).single();
    const lida_por = Array.from(new Set([...(data?.lida_por || []), userId]));
    return await supabase.from('mensagens').update({ lida_por }).eq('id', msgId);
  },

  // Financeiro
  async insertCobranca(cob: Cobranca) {
    const { id, ...data } = cob;
    const { data: inserted, error } = await supabase.from('cobrancas').insert(data).select().single();
    if (error) throw error;
    return inserted as Cobranca;
  },
  async updateCobranca(id: string, updates: any) {
    const { error } = await supabase.from('cobrancas').update(updates).eq('id', id);
    if (error) throw error;
  },
  async insertDespesa(desp: Despesa) {
    const { id, ...data } = desp;
    const { data: inserted, error } = await supabase.from('despesas').insert(data).select().single();
    if (error) throw error;
    return inserted as Despesa;
  },

  // Certificações
  async insertCertificationRequest(req: CertificationRequest) {
    const { id, ...data } = req;
    const { data: inserted, error } = await supabase.from('solicitacoes_evento').insert(data).select().single();
    if (error) throw error;
    return inserted as CertificationRequest;
  },
  async updateCertificationRequest(id: string, updates: any) {
    const { error } = await supabase.from('solicitacoes_evento').update(updates).eq('id', id);
    if (error) throw error;
  },

  // Perfil e Admin
  async updateUser(user: User) {
    const { data, error } = await supabase.from(T_ATLETAS).upsert(user).select();
    if (error) throw error;
    return { data, error: null };
  },
  async updateUserLevel(userId: string, newLevel: UserLevel) {
    const { error } = await supabase.from(T_ATLETAS).update({ nivel: newLevel }).eq('id', userId);
    if (error) throw error;
  },
  async updateGlobalSettings(settings: any) {
    return await supabase.from('configuracoes').upsert({
      id: 'global',
      nome_do_aplicativo: settings.appBranding?.appName,
      rankings_covers: settings.rankingsCovers,
      online_rankings_covers: settings.onlineRankingsCovers
    });
  }
};