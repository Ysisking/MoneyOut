import { supabase } from '@/lib/supabase'
import { supabaseBackend } from './supabase'
import { localBackend } from './local'

export const backend = supabase ? supabaseBackend : localBackend
