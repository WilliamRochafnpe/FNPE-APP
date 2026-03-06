
import { DB, User } from '../types';
import { normalizeCpf } from '../utils/cpf';
import { maskEmail } from '../utils/maskEmail';
import { SUPABASE_ENABLED } from '../lib/supabase';

const RECOVERY_KEY = 'fnpe_recovery_otp';
const OTP_EXPIRY_MINS = 5;
const MAX_ATTEMPTS = 5;

interface RecoveryData {
  cpf: string;
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

export interface RecoveryService {
  requestRecoveryOtp(db: DB, cpf: string): Promise<{ success: boolean; maskedEmail?: string; error?: string }>;
  verifyRecoveryOtp(cpf: string, code: string): Promise<{ success: boolean; email?: string; error?: string }>;
}

const localRecovery: RecoveryService = {
  async requestRecoveryOtp(db: DB, cpf: string) {
    const pureCpf = normalizeCpf(cpf);
    const user = db.users.find(u => u.cpf && normalizeCpf(u.cpf) === pureCpf);
    
    if (!user) return { success: false, error: 'Não encontramos uma conta com esse CPF. Confira os números e tente de novo.' };

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const data: RecoveryData = {
      cpf: pureCpf,
      email: user.email,
      code,
      expiresAt: Date.now() + OTP_EXPIRY_MINS * 60 * 1000,
      attempts: 0
    };

    sessionStorage.setItem(RECOVERY_KEY, JSON.stringify(data));
    console.log(`[FNPE-RECOVERY] OTP para ${user.email}: ${code}`);
    
    return { success: true, maskedEmail: maskEmail(user.email) };
  },

  async verifyRecoveryOtp(cpf: string, code: string) {
    const raw = sessionStorage.getItem(RECOVERY_KEY);
    if (!raw) return { success: false, error: 'Sessão expirada. Tente novamente.' };

    const data: RecoveryData = JSON.parse(raw);
    const pureCpf = normalizeCpf(cpf);

    if (data.cpf !== pureCpf) return { success: false, error: 'CPF não coincide com a solicitação.' };
    if (Date.now() > data.expiresAt) return { success: false, error: 'O código expirou. Vamos enviar outro?' };
    if (data.attempts >= MAX_ATTEMPTS) return { success: false, error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' };

    if (data.code !== code) {
      data.attempts += 1;
      sessionStorage.setItem(RECOVERY_KEY, JSON.stringify(data));
      return { success: false, error: 'Esse código não confere. Tenta de novo.' };
    }

    sessionStorage.removeItem(RECOVERY_KEY);
    return { success: true, email: data.email };
  }
};

const supabaseRecovery: RecoveryService = {
  async requestRecoveryOtp(db: DB, cpf: string) { 
    // Em modo real, o Supabase enviaria o e-mail via Auth
    return localRecovery.requestRecoveryOtp(db, cpf);
  },
  async verifyRecoveryOtp(cpf: string, code: string) { 
    return localRecovery.verifyRecoveryOtp(cpf, code);
  }
};

export const recoveryService = SUPABASE_ENABLED ? supabaseRecovery : localRecovery;
