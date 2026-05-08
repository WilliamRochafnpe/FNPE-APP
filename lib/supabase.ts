
import { createClient } from '@supabase/supabase-js';

type FnpeRuntimeEnv = { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string };

const runtimeEnv: FnpeRuntimeEnv =
  (typeof window !== 'undefined'
    ? (window as Window & { __FNPE_ENV__?: FnpeRuntimeEnv }).__FNPE_ENV__
    : undefined) ?? {};

const url = (
  import.meta.env.VITE_SUPABASE_URL ??
  runtimeEnv.SUPABASE_URL ??
  ''
).trim();
const anonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  runtimeEnv.SUPABASE_ANON_KEY ??
  ''
).trim();

/**
 * MODO DE OPERAÇÃO
 * false = Modo Offline (LocalStorage / Testes internos)
 * true  = Modo Online (Supabase Real / Produção)
 */
export const SUPABASE_URL = url;
export const SUPABASE_ANON_KEY = anonKey;
export const SUPABASE_ENABLED = url.length > 0 && anonKey.length > 0;

export const SUPABASE_BUCKET = 'midia';

/** Host inalcançável quando offline — evita DNS inexistente ou chamadas acidentais à nuvem. */
const offlineUrl = 'http://127.0.0.1:1';
/** JWT sintaticamente válido (chave demo pública Supabase) só para satisfazer o client em modo offline. */
const offlineAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDI2OTIyMDAsImV4cCI6MTk2MDI2ODIwMH0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9YRUWssnp4Q4zxqec';

export const supabase = createClient(
  SUPABASE_ENABLED ? url : offlineUrl,
  SUPABASE_ENABLED ? anonKey : offlineAnonKey,
  {
    auth: {
      storage: window.sessionStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);
