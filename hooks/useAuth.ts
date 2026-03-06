
import { useApp } from '../App';
import { auth } from '../services/auth';
import { AuthProfileData } from '../services/auth/types';
import { User } from '../types';

export const useAuth = () => {
  const { db, setDb, setUser, user: currentUser, logout: appLogout } = useApp();

  return {
    currentUser,
    requestOtp: (email: string) => auth.requestOtp(email),
    verifyOtp: (email: string, code: string) => auth.verifyOtp(email, code),
    findUserByEmail: (email: string) => auth.findUserByEmail(db, email),
    findUserByCpf: (cpf: string) => auth.findUserByCpf(db, cpf),

    loginAs: (user: User) => {
      setUser(user);
    },

    registerAndLogin: async (profile: AuthProfileData) => {
      const newUser = await auth.createUserFromProfile(db, setDb, profile);
      setUser(newUser);
      return newUser;
    },

    logout: async () => {
      try {
        await auth.logout();
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
      } finally {
        appLogout();
      }
    }
  };
};
