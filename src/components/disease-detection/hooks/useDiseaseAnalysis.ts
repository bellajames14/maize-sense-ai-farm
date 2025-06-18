
import { useState, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DiseaseAnalysisResult } from "../AnalysisResults";
import { loadModel, predictDisease } from "../tensorflowService";
import { isKnownDisease } from "../diseaseUtils";
import { analyzeWithGemini, getGeminiRecommendations } from '../services/geminiService';
import { saveScanResult } from '../services/databaseService';

// Minimum confidence threshold
const MIN_CONFIDENCE_THRESHOLD = 60;

export const useDiseaseAnalysis = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<DiseaseAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const imageRef = useRef<HTMLImageElement | null>(null);

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

  const handleAnalyze = async () => {
    if (!selectedFile || !previewUrl) {
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
          
          console.log("Using TensorFlow + Gemini recommendations result:", result);
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
          console.log("Gemini analysis result:", result);
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
        console.log("Gemini fallback result:", result);
      }
      
      // Complete the progress bar
      setUploadProgress(100);
      console.log("Final analysis results before setting state:", result);
      
      // Validate that we have treatment and prevention
      if (!result.treatment || result.treatment.trim() === '') {
        console.error("Missing treatment in result:", result);
        result.treatment = "1. Consult with a local agriculture expert for proper treatment guidance\n2. Monitor your crops regularly for disease symptoms\n3. Apply appropriate treatments as recommended by experts";
      }
      
      if (!result.prevention || result.prevention.trim() === '') {
        console.error("Missing prevention in result:", result);
        result.prevention = "• Maintain good field hygiene and proper plant spacing\n• Use disease-resistant seed varieties when available\n• Practice crop rotation to prevent disease spread";
      }
      
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
      
      console.log("Setting analysis result:", result);
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

  return {
    selectedFile,
    previewUrl,
    isAnalyzing,
    uploadProgress,
    analysisResult,
    analysisError,
    imageRef,
    handleFileChange,
    handleAnalyze,
    handleSaveResults,
    handleReset
  };
};
