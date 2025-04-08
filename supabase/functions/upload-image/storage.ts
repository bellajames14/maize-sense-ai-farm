
import { createSupabaseClient } from "./supabaseClient.ts";
import { ensureStorageBucketExists } from "./bucketManager.ts";
import { base64ToBinary, generateUniqueFilePath } from "./imageProcessor.ts";
import { STORAGE_BUCKET_NAME } from "./config.ts";

export async function uploadImageToStorage(
  fileData: string,
  fileName: string,
  fileType: string,
  userId: string | null
) {
  console.log("Starting image upload to Supabase Storage");
  const supabaseClient = createSupabaseClient();
  
  try {
    // Ensure bucket exists before upload
    await ensureStorageBucketExists();
    
    console.log("Processing image data");
    // Process the image data
    const binaryData = base64ToBinary(fileData);
    
    // Generate a unique file path
    const uniqueFilePath = generateUniqueFilePath(userId, fileName);
    
    console.log(`Uploading image to path: ${uniqueFilePath}`);
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from(STORAGE_BUCKET_NAME)
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
      .from(STORAGE_BUCKET_NAME)
      .getPublicUrl(uniqueFilePath);
      
    console.log(`Public URL generated: ${publicUrl}`);
    return { publicUrl, uniqueFilePath };
  } catch (error) {
    console.error("Error in uploadImageToStorage:", error);
    throw error;
  }
}
