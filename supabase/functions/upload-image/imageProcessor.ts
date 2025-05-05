
// Utility functions for processing image data

// Convert base64 data to binary format
export function base64ToBinary(base64Data: string): Uint8Array {
  // Extract the base64 data (remove the "data:image/jpeg;base64," part)
  const base64Content = base64Data.split(',')[1];
  if (!base64Content) {
    throw new Error("Invalid image data format");
  }
  
  // Convert base64 to binary
  return Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
}

// Generate a unique file path for storage
export function generateUniqueFilePath(userId: string | null, fileName: string): string {
  const timestamp = new Date().getTime();
  return `${userId || 'anonymous'}_${timestamp}_${fileName}`;
}

// A simplified image preprocessing function that doesn't rely on sharp
// Since we can't use sharp in Deno, we'll return the original image data
// The actual resizing will be handled by the ML model or Gemini API
export async function preprocessImage(imageBuffer: Uint8Array): Promise<Uint8Array> {
  // In a Deno environment without sharp, we return the original image
  // Any preprocessing needed would be handled by the client or the ML service
  console.log("Image preprocessing requested - using original image");
  return imageBuffer;
}
