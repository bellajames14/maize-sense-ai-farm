
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ImageUploader } from "./ImageUploader";
import { AnalysisResults, DiseaseAnalysisResult } from "./AnalysisResults";
import { loadModel, predictDisease } from "./tensorflowService";
import { isKnownDisease, knownDiseases } from "./diseaseUtils";
import * as tf from '@tensorflow/tfjs';

// Minimum confidence threshold
const MIN_CONFIDENCE_THRESHOLD = 60;

// Gemini API key
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const DiseaseDetection = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<DiseaseAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load TensorFlow.js model
  useEffect(() => {
    const initializeModel = async () => {
      try {
        await tf.ready();
        console.log("TensorFlow.js is ready");
        await loadModel();
        setIsModelLoaded(true);
      } catch (error) {
        console.error("Failed to initialize TensorFlow.js model:", error);
        setAnalysisError("Failed to load disease detection model. Please try again later.");
      }
    };

    initializeModel();
  }, []);

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
        treatment: diseaseData.treatment || "Consult with a local agriculture helper.",
        prevention: diseaseData.prevention || "Keep plants spaced well and water at the base, not on leaves."
      };
    } catch (error) {
      console.error("Error processing Gemini response:", error);
      return {
        disease: "Analysis Error",
        confidence: 50,
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
      result.treatment = "No treatment needed. Your plant looks good.";
      result.prevention = "Keep taking good care of your plants as you have been.";
    }
    
    // Try to extract confidence
    const confidenceMatch = text.match(/confidence:?\s*(\d+)/i) ||
                           text.match(/(\d+)%\s*confidence/i) ||
                           text.match(/(\d+)%\s*sure/i);
    if (confidenceMatch) result.confidence = parseInt(confidenceMatch[1]);
    
    // Try to extract treatment
    const treatmentMatch = text.match(/[Tt]reatment:?\s*([^.]*\.)/);
    if (treatmentMatch) result.treatment = treatmentMatch[1].trim();
    
    // Try to extract prevention
    const preventionMatch = text.match(/[Pp]revention:?\s*([^.]*\.)/);
    if (preventionMatch) result.prevention = preventionMatch[1].trim();
    
    console.log("Extracted disease data:", result);
    return result;
  };

  // Ask Gemini for recommendations
  const getGeminiRecommendations = async (diseaseName: string, confidence: number): Promise<{ treatment: string, prevention: string }> => {
    try {
      // Prepare the prompt for Gemini
      const prompt = `
        I'm a farmer who has detected ${diseaseName} in my maize crop with ${confidence}% confidence. 
        
        Please provide:
        1. A very simple recommendation for what I should do (in very basic English any farmer can understand)
        2. Simple treatment tips that are practical and actionable for a rural farmer

        Keep your language extremely simple, practical and actionable. Write for someone who may have limited education.
        Focus on affordable solutions and locally available materials.
        Make sure treatments are safe and environmentally friendly.
        
        Format your response as:
        
        Recommendation: [simple recommendation]
        
        Treatment Tips: [simple actionable tips]
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
                  { text: prompt }
                ]
              }
            ],
            generation_config: {
              temperature: 0.2,
              topK: 32,
              topP: 1,
              maxOutputTokens: 800
            }
          })
        }
      );
      
      if (!response.ok) {
        console.error("Gemini API error:", await response.text());
        return {
          treatment: "Please consult with your local agricultural expert for advice on this disease.",
          prevention: "Keep your fields clean and plants well-spaced to reduce disease spread."
        };
      }
      
      const responseData = await response.json();
      
      // Extract the text from the response
      if (!responseData.candidates || !responseData.candidates[0]?.content?.parts[0]?.text) {
        throw new Error("Unexpected response format from Gemini API");
      }
      
      const recommendationsText = responseData.candidates[0].content.parts[0].text;
      
      // Extract recommendation and treatment tips
      const recommendationMatch = recommendationsText.match(/Recommendation:?\s*([^]*?)(?=Treatment|$)/i);
      const treatmentMatch = recommendationsText.match(/Treatment Tips:?\s*([^]*?)(?=$)/i);
      
      return {
        treatment: recommendationMatch ? recommendationMatch[1].trim() : 
                  "Please consult with your local agricultural expert for advice on this disease.",
        prevention: treatmentMatch ? treatmentMatch[1].trim() : 
                   "Keep your fields clean and plants well-spaced to reduce disease spread."
      };
    } catch (error) {
      console.error("Error getting Gemini recommendations:", error);
      return {
        treatment: "Please consult with your local agricultural expert for advice on this disease.",
        prevention: "Keep your fields clean and plants well-spaced to reduce disease spread."
      };
    }
  };
  
  // Update disease count in disease_stats table
  const updateDiseaseCount = async (diseaseName: string) => {
    try {
      // First check if the service role key is available
      const supabaseAdmin = supabase;
      
      // Check if the disease exists in the stats table
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
            count: existingStats.count + 1,
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

  // Analyze image using TensorFlow.js model
  const analyzeWithTensorflow = async (): Promise<{diseaseName: string, confidence: number}> => {
    if (!imageRef.current) {
      throw new Error("Image reference not available");
    }
    
    // Make sure image is fully loaded
    return new Promise((resolve, reject) => {
      if (imageRef.current?.complete) {
        // Image already loaded
        predictDisease(imageRef.current)
          .then(result => resolve(result))
          .catch(error => reject(error));
      } else {
        // Wait for image to load
        imageRef.current.onload = () => {
          predictDisease(imageRef.current!)
            .then(result => resolve(result))
            .catch(error => reject(error));
        };
        imageRef.current.onerror = () => {
          reject(new Error("Failed to load image for analysis"));
        };
      }
    });
  };

  // Get full analysis with Gemini API for unknown diseases or low confidence
  const analyzeWithGemini = async (base64Image: string, detectedDisease?: string): Promise<DiseaseAnalysisResult> => {
    // Prepare the prompt for Gemini
    let prompt = `
      Analyze this maize/corn plant image for diseases. You are a maize farming expert helping farmers identify crop diseases.
      
      IMPORTANT:
      1. Focus ONLY on maize/corn diseases
      2. If the maize appears healthy, confidently state it's healthy
      3. Use very simple language suitable for farmers with limited technical knowledge
      4. Be specific about symptoms - describe what you see
      5. Provide practical treatment options using locally available solutions
      6. Include prevention tips that are realistic for small-scale farmers
    `;
    
    if (detectedDisease) {
      prompt += `\n\nNote: Our system detected "${detectedDisease}" with low confidence. Please confirm or suggest a more accurate diagnosis.`;
    } else {
      prompt += `\n\nNote: Our system couldn't identify the disease with high confidence. Please provide your expert analysis.`;
    }
    
    prompt += `
      Please format your response as plain JSON with these fields:
      {
        "disease": "Simple name of the disease or 'Healthy' if no disease found",
        "confidence": number between 50-100,
        "treatment": "Simple step-by-step treatment instructions that any farmer can understand",
        "prevention": "Basic prevention tips for future crops in simple language"
      }
      
      Keep all explanations brief and practical, focusing on actionable advice for farmers with limited resources.
    `;
    
    // Call Gemini Vision API
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
                    data: base64Image
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
    
    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText || "Error calling Gemini API"}`);
    }
    
    const responseData = await response.json();
    
    // Extract the text from the response
    if (!responseData.candidates || !responseData.candidates[0]?.content?.parts[0]?.text) {
      throw new Error("Unexpected response format from Gemini Vision API");
    }
    
    const analysisText = responseData.candidates[0].content.parts[0].text;
    
    // Process the response
    return processGeminiResponse(analysisText);
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !previewUrl || !isModelLoaded) {
      if (!isModelLoaded) {
        toast({
          title: "Model not ready",
          description: "Disease detection model is still loading. Please try again in a moment.",
          variant: "destructive"
        });
      }
      return;
    }
    
    setIsAnalyzing(true);
    setUploadProgress(0);
    setAnalysisError(null);
    
    try {
      // Simulate initial progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 30) {
            clearInterval(progressInterval);
            return 30;
          }
          return prev + 5;
        });
      }, 200);
      
      // Extract base64 data for using in Gemini API calls later if needed
      const base64Data = previewUrl.split(',')[1];
      
      // Create hidden image element for TensorFlow.js
      if (!imageRef.current) {
        imageRef.current = new Image();
        imageRef.current.crossOrigin = "anonymous";
        imageRef.current.src = previewUrl;
      } else {
        imageRef.current.src = previewUrl;
      }
      
      // First try to detect disease with TensorFlow.js model
      setUploadProgress(40);
      let result: DiseaseAnalysisResult;
      let usedTensorFlow = false;
      
      try {
        // Analyze with TensorFlow model
        console.log("Analyzing with TensorFlow.js model");
        const tfPrediction = await analyzeWithTensorflow();
        const { diseaseName, confidence } = tfPrediction;
        console.log("TensorFlow.js prediction:", diseaseName, confidence);
        
        // Update progress
        setUploadProgress(70);
        
        // Check if we should use this result or fall back to Gemini
        if (isKnownDisease(diseaseName) && confidence >= MIN_CONFIDENCE_THRESHOLD) {
          // Use TensorFlow result but get recommendations from Gemini
          const recommendations = await getGeminiRecommendations(diseaseName, confidence);
          
          result = {
            disease: diseaseName,
            confidence: confidence,
            treatment: recommendations.treatment,
            prevention: recommendations.prevention
          };
          usedTensorFlow = true;
        } else {
          // Low confidence or unknown disease, use Gemini with the TensorFlow hint
          console.log("Low confidence or unknown disease, falling back to Gemini");
          setUploadProgress(75);
          
          // Show message to user
          toast({
            title: confidence < MIN_CONFIDENCE_THRESHOLD ? "Low confidence detection" : "Unknown disease detected",
            description: "We're analyzing your image more thoroughly to provide accurate results.",
            variant: "default"
          });
          
          result = await analyzeWithGemini(base64Data, diseaseName);
        }
      } catch (tfError) {
        // TensorFlow failed, fall back to Gemini
        console.error("TensorFlow analysis failed:", tfError);
        console.log("Falling back to Gemini API");
        setUploadProgress(75);
        
        toast({
          title: "Advanced analysis in progress",
          description: "We're using our AI assistant to analyze your image more thoroughly.",
          variant: "default"
        });
        
        result = await analyzeWithGemini(base64Data);
      }
      
      // Complete the progress bar
      setUploadProgress(100);
      console.log("Final analysis results:", result);
      
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
            await saveScanResult(user.id, imageUrl, result);
          }
        } catch (saveError) {
          console.error("Error saving results:", saveError);
          // Continue with showing results even if save fails
        }
      }
      
      setAnalysisResult(result);
      
      // Show success toast
      toast({
        title: "Analysis complete",
        description: result.disease === "Healthy" 
          ? "Great news! Your maize plant appears healthy." 
          : `Detected: ${result.disease} with ${Math.round(result.confidence)}% confidence.`,
        variant: result.disease === "Healthy" ? "default" : "destructive"
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
            Upload an image of your maize plant to detect diseases and receive treatment advice.
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
          <img 
            ref={imageRef}
            src={previewUrl || ''}
            className="hidden"
            alt="Hidden"
            crossOrigin="anonymous"
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
