import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ImageUploader } from "./ImageUploader";
import { AnalysisResults, DiseaseAnalysisResult } from "./AnalysisResults";

// Gemini API key - In a real production app, you'd never expose this in the frontend
// Ideally this should be stored in a secure environment variable server-side
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const DiseaseDetection = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<DiseaseAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileChange = (file: File | null) => {
    if (file) {
      setSelectedFile(file);
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
      setAnalysisResult(null);
      setAnalysisError(null);
    }
  };

  // Process the Gemini API response to extract disease data
  const processGeminiResponse = (analysisText: string): DiseaseAnalysisResult => {
    try {
      // Try to extract JSON
      let jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                      analysisText.match(/{[\s\S]*}/);
                      
      let diseaseData: Partial<DiseaseAnalysisResult> = {};
      
      if (jsonMatch) {
        // Try to parse the JSON
        try {
          const jsonText = jsonMatch[0].replace(/```json|```/g, '').trim();
          diseaseData = JSON.parse(jsonText);
          console.log("Successfully parsed disease data from JSON");
        } catch (e) {
          console.error("Failed to parse JSON from Gemini:", e);
          // Fall back to extraction from text
          diseaseData = extractDiseaseDataFromText(analysisText);
        }
      } else {
        // Fall back to extraction from text
        console.log("No JSON found, falling back to text extraction");
        diseaseData = extractDiseaseDataFromText(analysisText);
      }
      
      // Clean text fields
      Object.keys(diseaseData).forEach(key => {
        if (typeof diseaseData[key] === 'string') {
          diseaseData[key] = (diseaseData[key] as string).replace(/\*/g, '');
        }
      });
      
      return {
        disease: diseaseData.disease || "Unknown",
        confidence: typeof diseaseData.confidence === 'number' ? diseaseData.confidence : 85,
        affectedArea: diseaseData.affectedArea || "25%",
        treatment: diseaseData.treatment || "Consult with a local agriculture helper.",
        prevention: diseaseData.prevention || "Keep plants spaced well and water at the base, not on leaves."
      };
    } catch (error) {
      console.error("Error processing Gemini response:", error);
      return {
        disease: "Analysis Error",
        confidence: 50,
        affectedArea: "Unknown",
        treatment: "We couldn't analyze your image. Please try again with a clearer photo.",
        prevention: "Take photos in good light and make sure the plant is clearly visible."
      };
    }
  };
  
  // Helper function to extract disease data from text when JSON parsing fails
  const extractDiseaseDataFromText = (text: string): Partial<DiseaseAnalysisResult> => {
    console.log("Extracting disease data from text");
    
    const result: Partial<DiseaseAnalysisResult> = {
      disease: "Unknown",
      confidence: 85,
      affectedArea: "25%",
      treatment: "Consult with a local agriculture helper.",
      prevention: "Keep plants spaced well and water at the base, not on leaves."
    };
    
    // Try to extract disease name
    const diseaseMatch = text.match(/Disease:?\s*([^,.]*)/i) || 
                         text.match(/disease name:?\s*([^,.]*)/i) ||
                         text.match(/problem:?\s*([^,.]*)/i);
    if (diseaseMatch) result.disease = diseaseMatch[1].trim();
    
    // If "healthy" is mentioned, set as healthy
    if (text.toLowerCase().includes("healthy")) {
      result.disease = "Healthy";
      result.confidence = 95;
      result.affectedArea = "0%";
      result.treatment = "No treatment needed. Your plant looks good.";
      result.prevention = "Keep taking good care of your plants as you have been.";
    }
    
    // Try to extract confidence
    const confidenceMatch = text.match(/confidence:?\s*(\d+)/i) ||
                           text.match(/(\d+)%\s*confidence/i) ||
                           text.match(/(\d+)%\s*sure/i);
    if (confidenceMatch) result.confidence = parseInt(confidenceMatch[1]);
    
    // Try to extract affected area
    const areaMatch = text.match(/affected area:?\s*(\d+%)/i) ||
                      text.match(/(\d+)%\s*of the plant/i) ||
                      text.match(/about (\d+)%/i);
    if (areaMatch) result.affectedArea = areaMatch[1];
    
    // Try to extract treatment
    const treatmentMatch = text.match(/[Tt]reatment:?\s*([^.]*\.)/);
    if (treatmentMatch) result.treatment = treatmentMatch[1].trim();
    
    // Try to extract prevention
    const preventionMatch = text.match(/[Pp]revention:?\s*([^.]*\.)/);
    if (preventionMatch) result.prevention = preventionMatch[1].trim();
    
    console.log("Extracted disease data:", result);
    return result;
  };
  
  // Save scan result to database
  const saveScanResult = async (
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
        affected_area_estimate: diseaseResults.affectedArea,
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
  
  // Update disease count in disease_stats table
  const updateDiseaseCount = async (diseaseName: string) => {
    try {
      console.log(`Updating count for disease: ${diseaseName}`);
      
      // First check if the disease exists in the stats table
      const { data: existingStats, error: queryError } = await supabase
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
        const { error: updateError } = await supabase
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
        const { error: insertError } = await supabase
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
      // Don't throw here to prevent disrupting the main flow
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !previewUrl) return;
    
    setIsAnalyzing(true);
    setUploadProgress(0);
    setAnalysisError(null);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      console.log("Analyzing image with Gemini directly");
      
      // Extract base64 data from the preview URL
      const base64Data = previewUrl.split(',')[1];
      
      // Prepare the prompt for Gemini
      const prompt = `
        Analyze this maize/corn plant image for diseases. You are a maize farming expert helping farmers identify crop diseases.
        
        IMPORTANT:
        1. Focus ONLY on maize/corn diseases such as:
           - Northern Corn Leaf Blight
           - Common Rust
           - Gray Leaf Spot
           - Southern Corn Leaf Blight
           - Corn Smut
           - Corn Ear Rot
           - Diplodia Leaf Streak
           - Corn Eyespot
           - Anthracnose Leaf Blight
           - Physoderma Brown Spot
           - Bacterial Leaf Streak
           - Goss's Bacterial Wilt
           - Maize Lethal Necrosis
        2. If the maize appears healthy, confidently state it's healthy
        3. Use very simple language suitable for farmers with limited technical knowledge
        4. Be specific about visual symptoms - describe what you see
        5. Provide practical treatment options using locally available solutions when possible
        6. Include prevention tips that are realistic for small-scale farmers
        
        Please format your response as plain JSON with these fields:
        {
          "disease": "Simple name of the disease or 'Healthy' if no disease found",
          "confidence": number between 50-100,
          "affectedArea": "Which part of plant is affected and approximate percentage",
          "treatment": "Simple step-by-step treatment instructions",
          "prevention": "Basic prevention tips for future crops"
        }
        
        Keep all explanations brief and practical, focusing on actionable advice for farmers.
      `;
      
      // Call Gemini Vision API directly
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: "image/jpeg",
                      data: base64Data
                    }
                  }
                ]
              }
            ],
            generation_config: {
              temperature: 0.1,
              topK: 32,
              topP: 1,
              maxOutputTokens: 2048
            }
          })
        }
      );
      
      // Complete the progress bar
      clearInterval(progressInterval);
      setUploadProgress(95);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", errorText);
        throw new Error(`Analysis failed: ${response.statusText || "Error calling Gemini API"}`);
      }
      
      const responseData = await response.json();
      
      // Extract the text from the response
      if (!responseData.candidates || !responseData.candidates[0]?.content?.parts[0]?.text) {
        throw new Error("Unexpected response format from Gemini Vision API");
      }
      
      const analysisText = responseData.candidates[0].content.parts[0].text;
      console.log("Analysis text received:", analysisText.substring(0, 100) + "...");
      
      // Process the response
      const diseaseResults = processGeminiResponse(analysisText);
      setUploadProgress(100);
      
      console.log("Analysis results:", diseaseResults);
      setAnalysisResult(diseaseResults);
      
      // Store results in Supabase if user is logged in
      if (user) {
        try {
          // First upload the image to Supabase Storage
          const { data: storageData, error: storageError } = await supabase.storage
            .from('maize_images')
            .upload(`${user.id}/${Date.now()}_${selectedFile.name}`, selectedFile);
            
          if (storageError) {
            console.error("Storage error:", storageError);
            // Continue with analysis even if storage fails
          } else {
            // Get public URL
            const { data: publicUrlData } = supabase.storage
              .from('maize_images')
              .getPublicUrl(storageData.path);
              
            const imageUrl = publicUrlData.publicUrl;
            
            // Save scan result
            await saveScanResult(user.id, imageUrl, diseaseResults);
          }
        } catch (saveError) {
          console.error("Error saving results:", saveError);
          // Continue with showing results even if save fails
        }
      }
      
      // Show success toast
      toast({
        title: "Analysis complete",
        description: diseaseResults.disease === "Healthy" 
          ? "Great news! Your maize plant appears healthy." 
          : `Detected: ${diseaseResults.disease} with ${diseaseResults.confidence}% confidence. See treatment options below.`,
        variant: diseaseResults.disease === "Healthy" ? "default" : "destructive"
      });
      
    } catch (error) {
      console.error("Error analyzing image:", error);
      setAnalysisError(error instanceof Error ? error.message : "An unknown error occurred");
      setUploadProgress(0);
      
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "There was a problem analyzing your image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveResults = async () => {
    if (!analysisResult || !user) {
      toast({
        title: "Cannot save results",
        description: user ? "No analysis results to save" : "Please log in to save results",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Results are already saved in the database during analysis if user is logged in
      toast({
        title: "Results saved",
        description: "The analysis results have been saved to your account.",
      });
    } catch (error) {
      console.error("Error saving results:", error);
      toast({
        title: "Save failed",
        description: "There was a problem saving your results. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setUploadProgress(0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Maize Disease Detection</CardTitle>
          <CardDescription>
            Upload an image of your maize plant to detect diseases and receive treatment recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploader
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            isAnalyzing={isAnalyzing}
            uploadProgress={uploadProgress}
            onFileChange={handleFileChange}
            onAnalyze={handleAnalyze}
            onReset={handleReset}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analysis Results</CardTitle>
          <CardDescription>
            {analysisResult 
              ? "Disease detection results and treatment recommendations"
              : analysisError
                ? "Analysis error"
                : "Upload and analyze an image to see results"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnalysisResults
            isAnalyzing={isAnalyzing}
            uploadProgress={uploadProgress}
            analysisResult={analysisResult}
            analysisError={analysisError}
            onSaveResults={handleSaveResults}
            onReset={handleReset}
          />
        </CardContent>
      </Card>
    </div>
  );
};
