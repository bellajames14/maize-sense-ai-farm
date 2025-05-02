
import { supabase } from "@/integrations/supabase/client";
import { DiseaseAnalysisResult } from "../AnalysisResults";

// Update disease count in disease_stats table
export const updateDiseaseCount = async (diseaseName: string) => {
  try {
    // Use supabase client
    const supabaseAdmin = supabase;
    
    // Use custom query to handle the disease_stats table
    const { data: existingStats, error: queryError } = await supabaseAdmin
      .from('disease_stats')
      .select('*')
      .eq('disease_name', diseaseName)
      .maybeSingle();
    
    if (queryError) {
      console.error("Error checking disease stats:", queryError);
      return; // Continue with main flow
    }
    
    if (existingStats) {
      // Disease exists, update the count
      const { error: updateError } = await supabaseAdmin
        .from('disease_stats')
        .update({ 
          count: (existingStats as any).count + 1,
          last_detected: new Date().toISOString()
        })
        .eq('id', existingStats.id);
      
      if (updateError) {
        console.error("Error updating disease count:", updateError);
      }
    } else {
      // Disease doesn't exist, create a new entry
      const { error: insertError } = await supabaseAdmin
        .from('disease_stats')
        .insert({
          disease_name: diseaseName,
          count: 1,
          first_detected: new Date().toISOString(),
          last_detected: new Date().toISOString()
        });
      
      if (insertError) {
        console.error("Error inserting new disease stat:", insertError);
      }
    }
    
    console.log(`Successfully updated count for ${diseaseName}`);
  } catch (error) {
    console.error("Error updating disease stats:", error);
    // Don't throw here to prevent disrupting the main flow
  }
};

// Save scan result to database
export const saveScanResult = async (
  userId: string,
  imageUrl: string,
  diseaseResults: DiseaseAnalysisResult
) => {
  try {
    console.log(`Saving scan with user_id: ${userId}`);
    
    const { data, error } = await supabase.from('scans').insert({
      user_id: userId,
      image_url: imageUrl,
      disease_name: diseaseResults.disease,
      confidence: diseaseResults.confidence,
      affected_area_estimate: diseaseResults.affectedArea || "Unknown",
      treatment_tips: diseaseResults.treatment,
      prevention_tips: diseaseResults.prevention
    }).select('id');
    
    if (error) {
      console.error("Database error saving scan:", error);
      throw error;
    }
    
    console.log("Scan saved successfully:", data);
    
    // Update disease count if not healthy
    if (diseaseResults.disease !== "Healthy") {
      await updateDiseaseCount(diseaseResults.disease);
    }
    
    return data;
  } catch (dbError) {
    console.error("Error saving scan to database:", dbError);
    throw dbError;
  }
};
