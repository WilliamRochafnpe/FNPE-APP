
import { User, DB } from '../../types';

export interface AuthProfileData {
  email: string;
  nomeCompleto: string;
  cpf: string;
  telefone?: string;
  cidade: string;
  estado: string;
  sexo: string;
  dataNascimento: string;
}

export interface AuthService {
  requestOtp(email: string): Promise<string | void>;
  verifyOtp(email: string, code: string): Promise<{ success: boolean; error?: string; profileIncomplete?: boolean }>;
  findUserByEmail(db: DB, email: string): Promise<User | null>;
  findUserByCpf(db: DB, cpf: string): Promise<User | null>;
  createUserFromProfile(db: DB, setDb: (fn: (prev: DB) => DB) => void, profile: AuthProfileData): Promise<User>;
  logout(): Promise<void>;
  updatePassword(password: string): Promise<void>;
  markPasswordDefined(userId: string): Promise<void>;
  checkUserStatus(email: string): Promise<{ id: string; password_defined: boolean; first_login: boolean; } | null>;
}
