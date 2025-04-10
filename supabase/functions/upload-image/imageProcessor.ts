
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

import * as sharp from sharp; // or any other image processing library

export async function preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(224, 224)  // Match your model's expected input size
    .toBuffer();
}
