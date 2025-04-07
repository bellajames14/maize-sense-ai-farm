
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://sfsdfdcdethqjwtjrwpz.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc2RmZGNkZXRocWp3dGpyd3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NzU1NDAsImV4cCI6MjA1OTI1MTU0MH0.o-LLkQhEW7QJhVPyrZKoNYOMHKNIGH_5NWMTnMILqKs";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

export async function uploadImageToStorage(
  fileData: string,
  fileName: string,
  fileType: string,
  userId: string | null
) {
  console.log("Starting image upload to Supabase Storage");
  // Create Supabase clients - one with anon key for basic operations
  // and one with service role for admin operations if needed
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY ? 
    createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : 
    supabaseClient;
  
  try {
    // Create a storage bucket if it doesn't exist (requires admin)
    console.log("Checking if maize_images bucket exists");
    try {
      const { data: buckets, error } = await supabaseAdmin
        .storage
        .listBuckets();
      
      if (error) {
        throw new Error(`Error listing buckets: ${error.message}`);
      }
      
      const bucketExists = buckets.some(bucket => bucket.name === 'maize_images');
      
      if (!bucketExists) {
        console.log("Creating maize_images bucket");
        const { error: createError } = await supabaseAdmin.storage.createBucket('maize_images', {
          public: true,
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (createError) {
          throw new Error(`Error creating bucket: ${createError.message}`);
        }
        console.log("Created maize_images bucket successfully");
      } else {
        console.log("maize_images bucket already exists");
      }
    } catch (bucketError) {
      console.error("Bucket check/creation error:", bucketError);
    }
    
    // Extract the base64 data (remove the "data:image/jpeg;base64," part)
    console.log("Processing image data");
    const base64Data = fileData.split(',')[1];
    if (!base64Data) {
      throw new Error("Invalid image data format");
    }
    
    // Convert base64 to binary
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Generate a unique file path
    const timestamp = new Date().getTime();
    const uniqueFilePath = `${userId || 'anonymous'}_${timestamp}_${fileName}`;
    
    console.log(`Uploading image to path: ${uniqueFilePath}`);
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('maize_images')
      .upload(uniqueFilePath, binaryData, {
        contentType: fileType,
        upsert: true
      });
    
    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }
    
    console.log("Image uploaded successfully, getting public URL");
    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabaseClient.storage
      .from('maize_images')
      .getPublicUrl(uniqueFilePath);
      
    console.log(`Public URL generated: ${publicUrl}`);
    return { publicUrl, uniqueFilePath };
  } catch (error) {
    console.error("Error in uploadImageToStorage:", error);
    throw error;
  }
}
