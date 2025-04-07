
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://sfsdfdcdethqjwtjrwpz.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc2RmZGNkZXRocWp3dGpyd3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NzU1NDAsImV4cCI6MjA1OTI1MTU0MH0.o-LLkQhEW7QJhVPyrZKoNYOMHKNIGH_5NWMTnMILqKs";

// Store the scan result in the database
export async function saveScanResult(
  userId: string, 
  imageUrl: string, 
  diseaseResults: { 
    disease: string; 
    confidence: number; 
    affectedArea: string; 
    treatment: string; 
    prevention: string;
  }
) {
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    const { error } = await supabaseClient.from('scans').insert({
      user_id: userId,
      image_url: imageUrl,
      disease_name: diseaseResults.disease,
      confidence: diseaseResults.confidence,
      affected_area_estimate: diseaseResults.affectedArea,
      treatment_tips: diseaseResults.treatment,
      prevention_tips: diseaseResults.prevention
    });
    
    if (error) {
      throw error;
    }
  } catch (dbError) {
    console.error("Error saving scan to database:", dbError);
    throw dbError;
  }
}
