
import { AuthService, AuthProfileData } from './types';
import { User, DB } from '../../types';

/**
 * ADAPTADOR FIREBASE (PRONTO PARA IMPLEMENTAÇÃO FUTURA)
 * 
 * Este arquivo servirá como adapter para as funções reais do Firebase:
 * - requestOtp -> Chamada para Cloud Function (Firebase Admin + Email API)
 * - verifyOtp -> Comparação via Cloud Function (ou Firestore temporário)
 * - findUserByEmail -> Query no Firestore: collection('users').where('email', '==', email)
 * - findUserByCpf -> Query no Firestore: collection('users').where('cpf', '==', cpf)
 */

export const firebaseAuth: AuthService = {
  async requestOtp(email: string): Promise<void> {
    throw new Error("Modo FIREBASE não configurado. Adicione as chaves no .env e implemente o adapter.");
  },

  async verifyOtp(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    throw new Error("Modo FIREBASE não configurado.");
  },

  async findUserByEmail(db: DB, email: string): Promise<User | null> {
    throw new Error("Modo FIREBASE não configurado.");
  },

  async findUserByCpf(db: DB, cpf: string): Promise<User | null> {
    throw new Error("Modo FIREBASE não configurado.");
  },

  async createUserFromProfile(db: DB, setDb: any, profile: AuthProfileData): Promise<User> {
    throw new Error("Modo FIREBASE não configurado.");
  },

  async logout(): Promise<void> {
    throw new Error("Modo FIREBASE não configurado.");
  }
};
