
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from "./config.ts";

// Create and export Supabase clients
export const createSupabaseClient = () => {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
};

export const createSupabaseAdminClient = () => {
  return SUPABASE_SERVICE_ROLE_KEY ? 
    createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : 
    createSupabaseClient();
};
