
import { localAuth } from './localAuth';
import { supabaseAuth } from './supabaseAuth';
import { AuthService } from './types';
import { SUPABASE_ENABLED } from '../../lib/supabase';

// Quando SUPABASE_ENABLED é true, o sistema utiliza o banco de dados em nuvem
export const auth: AuthService = SUPABASE_ENABLED ? supabaseAuth : localAuth;
export const IS_LOCAL = !SUPABASE_ENABLED;
export const IS_SUPABASE = SUPABASE_ENABLED;
