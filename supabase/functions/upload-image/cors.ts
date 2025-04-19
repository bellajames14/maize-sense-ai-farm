// Define allowed origins - adjust as needed
// This is for fallback, but we dynamically set the exact matching origin in index.ts
export const allowedOrigins = [
  'https://preview--maize-sense-ai-farm.lovable.app',
  'https://maize-sense-ai-farm.lovable.app',
  'http://localhost:8080'
];

// Default CORS headers with a fallback origin
// In index.ts we replace the Access-Control-Allow-Origin with the actual origin if it's allowed
export const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigins[0], // Default fallback
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400" // Cache preflight request for 24 hours
};
