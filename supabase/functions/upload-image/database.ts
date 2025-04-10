
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://sfsdfdcdethqjwtjrwpz.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc2RmZGNkZXRocWp3dGpyd3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NzU1NDAsImV4cCI6MjA1OTI1MTU0MH0.o-LLkQhEW7QJhVPyrZKoNYOMHKNIGH_5NWMTnMILqKs";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc2RmZGNkZXRocWp3dGpyd3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzY3NTU0MCwiZXhwIjoyMDU5MjUxNTQwfQ.TCC1khL5ZmUL4GjY3pWmSErQRjtf-RyjyaCrLmV6mU4";

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
  // Use service role key if available, otherwise fall back to anon key
  const apiKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  const supabaseClient = createClient(SUPABASE_URL, apiKey);
  
  try {
    console.log(`Attempting to save scan with user_id: ${userId}`);
    
    const { data, error } = await supabaseClient.from('scans').insert({
      user_id: userId,
      image_url: imageUrl,
      disease_name: diseaseResults.disease,
      confidence: diseaseResults.confidence,
      affected_area_estimate: diseaseResults.affectedArea,
      treatment_tips: diseaseResults.treatment,
      prevention_tips: diseaseResults.prevention
    }).select('id');
    
    if (error) {
      console.error("Database error saving scan:", error);
      throw error;
    }
    
    console.log("Scan saved successfully:", data);
    return data;
  } catch (dbError) {
    console.error("Error saving scan to database:", dbError);
    throw dbError;
  }
}
