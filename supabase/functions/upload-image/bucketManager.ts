import { createSupabaseAdminClient } from "./supabaseClient.ts";
import { STORAGE_BUCKET_NAME, FILE_SIZE_LIMIT } from "./config.ts";

// Ensure storage bucket exists
export async function ensureStorageBucketExists() {
  console.log(`Checking if ${STORAGE_BUCKET_NAME} bucket exists`);
  const supabaseAdmin = createSupabaseAdminClient();
  
  try {
    const { data: buckets, error } = await supabaseAdmin
      .storage
      .listBuckets();
    
    if (error) {
      throw new Error(`Error listing buckets: ${error.message}`);
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === STORAGE_BUCKET_NAME);
    
    if (!bucketExists) {
      console.log(`Creating ${STORAGE_BUCKET_NAME} bucket`);
      const { error: createError } = await supabaseAdmin.storage.createBucket(STORAGE_BUCKET_NAME, {
        public: true,
        fileSizeLimit: FILE_SIZE_LIMIT
      });
      
      if (createError) {
        throw new Error(`Error creating bucket: ${createError.message}`);
      }
      console.log(`Created ${STORAGE_BUCKET_NAME} bucket successfully`);
    } else {
      console.log(`${STORAGE_BUCKET_NAME} bucket already exists`);
    }
  } catch (bucketError) {
    console.error("Bucket check/creation error:", bucketError);
    throw bucketError;
  }
}




