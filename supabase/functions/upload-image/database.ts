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
    
    // Update disease count statistics if it's not "Healthy"
    if (diseaseResults.disease !== "Healthy") {
      await updateDiseaseCount(diseaseResults.disease);
    }
    
    return data;
  } catch (dbError) {
    console.error("Error saving scan to database:", dbError);
    throw dbError;
  }
}

// Update the disease count in the disease_stats table
export async function updateDiseaseCount(diseaseName: string) {
  const apiKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  const supabaseClient = createClient(SUPABASE_URL, apiKey);
  
  try {
    console.log(`Updating count for disease: ${diseaseName}`);
    
    // First check if the disease exists in the stats table
    const { data: existingStats, error: queryError } = await supabaseClient
      .from('disease_stats')
      .select('*')
      .eq('disease_name', diseaseName)
      .single();
    
    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error("Error checking disease stats:", queryError);
      throw queryError;
    }
    
    if (existingStats) {
      // Disease exists, update the count
      const { error: updateError } = await supabaseClient
        .from('disease_stats')
        .update({ 
          count: existingStats.count + 1,
          last_detected: new Date().toISOString()
        })
        .eq('id', existingStats.id);
      
      if (updateError) {
        console.error("Error updating disease count:", updateError);
        throw updateError;
      }
    } else {
      // Disease doesn't exist, create a new entry
      const { error: insertError } = await supabaseClient
        .from('disease_stats')
        .insert({
          disease_name: diseaseName,
          count: 1,
          first_detected: new Date().toISOString(),
          last_detected: new Date().toISOString()
        });
      
      if (insertError) {
        console.error("Error inserting new disease stat:", insertError);
        throw insertError;
      }
    }
    
    console.log(`Successfully updated count for ${diseaseName}`);
  } catch (error) {
    console.error("Error updating disease stats:", error);
    // Don't throw here to prevent disrupting the main flow if stats update fails
    // We still want to return the disease analysis even if stat counting fails
  }
}
