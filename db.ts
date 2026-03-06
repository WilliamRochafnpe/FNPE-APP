
import { DB, User, Snapshot, EventCertified, EventResult, Category } from './types';

const DB_KEY = 'fnpe_db_v1';
const SNAPSHOT_KEY = 'fnpe_db_snapshots_v1';
export const ADMIN_EMAIL = 'williamrocha_25@icloud.com';
export const APP_VERSION = 'FNPE_v7_Fixed_Admin_Official';

const ADMIN_DATA_FIXED: User = {
  id: '71faf896-618a-42a1-a26c-83ec9ecb615f',
  email: ADMIN_EMAIL,
  nome_completo: 'William Rocha',
  cpf: '52785785215',
  telefone: '96991245513',
  nivel: 'ADMIN',
  sexo: 'Masculino',
  data_nascimento: '1987-01-07',
  tempo_pescador: '9 anos',
  historia: 'Presidente da FNPE. Comendador do Turismo da Pesca Esportiva-AP. Embaixador da 54º Exporfeira, Pescador Esportivo, apresentador do Programa Reis do Rio da Tv Record Amapá e Recordista nacional BGFA.',
  id_norte_status: 'APROVADO',
  id_norte_numero: 'ID - 00001',
  id_norte_adesao: '2023-01-01T10:00:00.000Z',
  id_norte_validade: '2026-01-01T10:00:00.000Z',
  uf: 'AP',
  cidade: 'Macapá',
  foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
  criado_em: '2023-01-01T10:00:00.000Z',
  password_defined: true,
  first_login: false
};

const NORTH_STATES = ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO'];
const MUNICIPIOS_NORTH: Record<string, string[]> = {
  AC: ["Rio Branco", "Cruzeiro do Sul"],
  AM: ["Manaus", "Parintins", "Itacoatiara"],
  AP: ["Macapá", "Santana", "Laranjal do Jari"],
  PA: ["Belém", "Ananindeua", "Santarém"],
  RO: ["Porto Velho", "Ji-Paraná"],
  RR: ["Boa Vista", "Rorainópolis"],
  TO: ["Palmas", "Araguaína"]
};

export const SEED_DATA: DB = {
  settings: {
    appBranding: { appName: 'FNPE - Federação Norte de Pesca Esportiva' },
    appSupport: { supportWhatsApp: '5596991245513', supportEmail: 'williamrocha_25@icloud.com' },
    rankingsCovers: {}
  },
  users: [
    ADMIN_DATA_FIXED
  ],
  requests: [],
  certificationRequests: [],
  events: [],
  results: [],
  messages: [],
  cobrancas: [],
  despesas: [],
  partners: [],
  eventTeams: [],
  eventTeamMembers: []
};

export const loadDB = (): DB => {
  const data = localStorage.getItem(DB_KEY);
  if (!data) {
    saveDB(SEED_DATA);
    return SEED_DATA;
  }
  try {
    const db = JSON.parse(data);
    if (!db.partners) db.partners = [];
    return ensureAdminUser(db);
  } catch {
    return SEED_DATA;
  }
};

export const saveDB = (db: DB) => {
  try {
    const json = JSON.stringify(db);
    localStorage.setItem(DB_KEY, json);
  } catch (e) {
    console.error("Erro ao persistir banco local", e);
  }
};

export const ensureAdminUser = (db: DB): DB => {
  const adminIndex = db.users.findIndex(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  if (adminIndex !== -1) {
    const updatedUsers = [...db.users];
    updatedUsers[adminIndex] = { ...updatedUsers[adminIndex], ...ADMIN_DATA_FIXED };
    return { ...db, users: updatedUsers };
  }
  return { ...db, users: [ADMIN_DATA_FIXED, ...db.users] };
};

// Snapshot System
export const createSnapshot = (db: DB, etiqueta?: string) => {
  const snapshots = listSnapshots();
  const newSnapshot: Snapshot = {
    id: `snap-${Date.now()}`,
    criado_em: new Date().toISOString(),
    dados: db,
    etiqueta
  };
  // Mantém apenas os últimos 10 snapshots
  const updated = [newSnapshot, ...snapshots].slice(0, 10);
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(updated));
};

export const listSnapshots = (): Snapshot[] => {
  const data = localStorage.getItem(SNAPSHOT_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const deleteSnapshot = (id: string) => {
  const snapshots = listSnapshots();
  const updated = snapshots.filter(s => s.id !== id);
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(updated));
};

export const exportJSON = (db: DB) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `fnpe_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

export const importJSONFile = (file: File): Promise<DB> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        resolve(validateDB(json));
      } catch (err) {
        reject(new Error("Arquivo JSON inválido. Verifique o formato."));
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo de backup."));
    reader.readAsText(file);
  });
};

export const validateDB = (db: any): DB => {
  if (!db || typeof db !== 'object') throw new Error("Dados de entrada inválidos.");

  // Assegura que todas as coleções existam no objeto
  const validated = {
    ...SEED_DATA,
    ...db,
    users: Array.isArray(db.users) ? db.users : SEED_DATA.users,
    events: Array.isArray(db.events) ? db.events : [],
    results: Array.isArray(db.results) ? db.results : [],
    messages: Array.isArray(db.messages) ? db.messages : [],
    cobrancas: Array.isArray(db.cobrancas) ? db.cobrancas : [],
    despesas: Array.isArray(db.despesas) ? db.despesas : [],
    certificationRequests: Array.isArray(db.certificationRequests) ? db.certificationRequests : [],
    partners: Array.isArray(db.partners) ? db.partners : [],
    requests: Array.isArray(db.requests) ? db.requests : [],
  };

  return ensureAdminUser(validated as DB);
};
