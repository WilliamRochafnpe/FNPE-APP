
import { AuthService, AuthProfileData } from './types';
import { User, DB } from '../../types';
import { normalizeCpf } from '../../utils/cpf';
import { loadDB, saveDB } from '../../db';

const OTP_KEY = 'fnpe_otp_store';
export const LOCAL_PASSWORD_STORAGE_KEY = 'fnpe_local_password_v1';
const OTP_EXPIRY_MINS = 5;
const MAX_ATTEMPTS = 5;

interface OtpData {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

export function getLocalStoredPassword(email: string): string | undefined {
  const map = JSON.parse(localStorage.getItem(LOCAL_PASSWORD_STORAGE_KEY) || '{}') as Record<string, string>;
  return map[email.toLowerCase().trim()];
}

export const localAuth: AuthService = {
  async requestOtp(email: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const data: OtpData = {
      email: email.toLowerCase(),
      code,
      expiresAt: Date.now() + OTP_EXPIRY_MINS * 60 * 1000,
      attempts: 0
    };
    sessionStorage.setItem(OTP_KEY, JSON.stringify(data));
    console.log(`[FNPE-DEV] OTP para ${email}: ${code}`);
    return code;
  },

  async verifyOtp(email: string, code: string): Promise<{ success: boolean; error?: string; profileIncomplete?: boolean }> {
    const raw = sessionStorage.getItem(OTP_KEY);
    if (!raw) return { success: false, error: 'Código não solicitado ou expirado.' };

    const data: OtpData = JSON.parse(raw);

    if (data.email !== email.toLowerCase()) {
      return { success: false, error: 'E-mail divergente da solicitação.' };
    }

    if (Date.now() > data.expiresAt) {
      sessionStorage.removeItem(OTP_KEY);
      return { success: false, error: 'O código expirou. Solicite um novo.' };
    }

    if (data.attempts >= MAX_ATTEMPTS) {
      sessionStorage.removeItem(OTP_KEY);
      return { success: false, error: 'Limite de tentativas excedido.' };
    }

    if (data.code !== code) {
      data.attempts += 1;
      sessionStorage.setItem(OTP_KEY, JSON.stringify(data));
      return { success: false, error: `Código inválido. (${MAX_ATTEMPTS - data.attempts} tentativas restantes)` };
    }

    sessionStorage.removeItem(OTP_KEY);
    return { success: true, profileIncomplete: false };
  },

  async findUserByEmail(db: DB, email: string): Promise<User | null> {
    return db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  },

  async findUserByCpf(db: DB, cpf: string): Promise<User | null> {
    const pureCpf = normalizeCpf(cpf);
    return db.users.find(u => u.cpf && normalizeCpf(u.cpf) === pureCpf) || null;
  },

  async createUserFromProfile(db: DB, setDb: any, profile: AuthProfileData): Promise<User> {
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: profile.email.toLowerCase().trim(),
      nome_completo: profile.nomeCompleto.trim(),
      cpf: normalizeCpf(profile.cpf),
      telefone: profile.telefone?.replace(/\D/g, ''),
      cidade: profile.cidade.trim(),
      uf: profile.estado.toUpperCase().trim(),
      nivel: 'PESCADOR',
      id_norte_status: 'NAO_SOLICITADO',
      criado_em: new Date().toISOString(),
      sexo: profile.sexo,
      data_nascimento: profile.dataNascimento,
      password_defined: false,
      first_login: true
    };

    setDb((prev: DB) => {
      // Evita duplicidade no estado se o e-mail já existir por algum motivo
      const filtered = prev.users.filter(u => u.email.toLowerCase() !== newUser.email.toLowerCase());
      return {
        ...prev,
        users: [...filtered, newUser]
      };
    });

    return newUser;
  },

  async logout() {
    return Promise.resolve();
  },

  async checkUserStatus(email: string) {
    const db = loadDB();
    const u = db.users.find(x => x.email.toLowerCase() === email.toLowerCase().trim());
    if (!u) return null;
    return {
      id: u.id,
      password_defined: u.password_defined !== false,
      first_login: u.first_login === true
    };
  },

  async updatePassword(password: string) {
    const raw = sessionStorage.getItem('fnpe_session');
    if (!raw) throw new Error('Sessão não encontrada.');
    const u = JSON.parse(raw) as User;
    const map = JSON.parse(localStorage.getItem(LOCAL_PASSWORD_STORAGE_KEY) || '{}') as Record<string, string>;
    map[u.email.toLowerCase()] = password;
    localStorage.setItem(LOCAL_PASSWORD_STORAGE_KEY, JSON.stringify(map));
  },

  async markPasswordDefined(userId: string) {
    const db = loadDB();
    const users = db.users.map(x =>
      x.id === userId ? { ...x, password_defined: true } : x
    );
    saveDB({ ...db, users });
    const raw = sessionStorage.getItem('fnpe_session');
    if (raw) {
      const u = JSON.parse(raw) as User;
      if (u.id === userId) {
        sessionStorage.setItem('fnpe_session', JSON.stringify({ ...u, password_defined: true }));
      }
    }
  }
};
