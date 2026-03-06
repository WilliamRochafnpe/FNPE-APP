
import { createClient } from '@supabase/supabase-js';

// CREDENCIAIS DO PROJETO - Federação Norte APP
export const SUPABASE_URL = "https://rmzuaeocdcmdcaamcall.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_1L9FDPie8MTH0e8DPbOeZg_svfWg6Fp";

/**
 * MODO DE OPERAÇÃO
 * false = Modo Offline (LocalStorage / Testes internos)
 * true  = Modo Online (Supabase Real / Produção)
 */
export const SUPABASE_ENABLED = true;

export const SUPABASE_BUCKET = 'midia';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: window.sessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});
