
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { analyzeImageWithGemini } from "./geminiService.ts";
import { processGeminiResponse } from "./geminiResponseProcessor.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "AIzaSyCySmGu1aMdenR6_EwhN4tJMCnJhLhHKkw";

// Analyze crop disease using Gemini Vision API
export async function analyzeCropDiseaseWithGemini(imageUrl: string) {
  try {
    console.log("Analyzing crop image with Gemini Vision:", imageUrl);
    
    // Fetch the image and convert to base64
    console.log("Fetching image from URL");
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    console.log("Image successfully converted to base64");
    
    // Call Gemini API and get analysis
    const analysisText = await analyzeImageWithGemini(base64Image, GEMINI_API_KEY);
    
    // Process the response to extract disease data
    const diseaseData = await processGeminiResponse(analysisText);
    
    console.log("Final analysis result:", diseaseData);
    return diseaseData;
    
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    return {
      disease: "Analysis Error",
      confidence: 0,
      affectedArea: "Unknown",
      treatment: "We couldn't analyze your image. Please try again with a clearer photo.",
      prevention: "Take photos in good light and make sure the plant is clearly visible."
    };
  }
}
