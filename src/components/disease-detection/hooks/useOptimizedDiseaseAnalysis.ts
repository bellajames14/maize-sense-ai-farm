import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useFileHandler } from "./useFileHandler";
import { loadOptimizedModel } from "../services/optimizedModelLoader";
import { predictDiseaseWithAccuracy } from "../services/enhancedPredictionService";
import { knownDiseases } from "../diseaseUtils";
import * as tf from '@tensorflow/tfjs';

export interface OptimizedAnalysisResult {
  disease: string;
  confidence: number;
  recommendations: string;
}

export const useOptimizedDiseaseAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<OptimizedAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const MODEL_URL = 'https://sfsdfdcdethqjwtjrwpz.supabase.co/storage/v1/object/public/tfjs-models/Maize_disease_model_v1/model.json';
  
  const {
    selectedFile,
    previewUrl,
    handleFileChange,
    handleReset: resetFile
  } = useFileHandler();

  // Initialize model automatically on component mount
  useEffect(() => {
    const initModel = async () => {
      try {
        console.log("Auto-initializing optimized model...");
        await loadOptimizedModel();
        setIsModelLoaded(true);
        console.log("Optimized model auto-initialization successful");
      } catch (error) {
        console.error("Model auto-initialization failed:", error);
        setIsModelLoaded(false);
      }
    };

    initModel();
  }, []);

  const initializeModel = async () => {
    try {
      await loadOptimizedModel();
      setIsModelLoaded(true);
      toast({
        title: "Optimized Model Ready",
        description: "Enhanced disease detection model loaded successfully",
      });
    } catch (error) {
      console.error("Model initialization failed:", error);
      toast({
        title: "Model Load Failed", 
        description: "Using Gemini fallback for analysis",
        variant: "destructive"
      });
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !previewUrl) {
      toast({
        title: "No image selected",
        description: "Please select an image to analyze",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // Create hidden image element for TensorFlow.js
      if (!imageRef.current) {
        imageRef.current = new Image();
      }
      
      imageRef.current.crossOrigin = "anonymous";
      imageRef.current.src = previewUrl;

      // Wait for image to load
      await new Promise((resolve, reject) => {
        if (imageRef.current?.complete) {
          resolve(null);
        } else {
          imageRef.current!.onload = () => resolve(null);
          imageRef.current!.onerror = () => reject(new Error("Failed to load image"));
        }
      });

      let predictedClass = "Unknown";
      let accuracyPercent = 0;

      try {
        // Use enhanced prediction with accuracy optimizations
        console.log("Starting enhanced TensorFlow prediction...");
        
        const predictionResult = await predictDiseaseWithAccuracy(imageRef.current!);
        
        predictedClass = predictionResult.diseaseName;
        accuracyPercent = predictionResult.confidence;
        
        console.log("Enhanced prediction result:", predictionResult);
        console.log("Processing stats:", predictionResult.processingStats);
        console.log(`Final prediction: ${predictedClass} with ${accuracyPercent.toFixed(2)}% confidence`);
        
      } catch (tfError) {
        console.error("Enhanced TensorFlow prediction failed:", tfError);
        predictedClass = "Model_Error";
        accuracyPercent = 0;
      }

      // Get Gemini recommendations with exact prompt
      let recommendations = "";
      
      if (predictedClass === "Unknown" || predictedClass === "Model_Error") {
        // Fallback: Use Gemini for full analysis
        recommendations = "The model cannot identify this disease. Please try uploading a clearer image of the affected plant area, or consult with an agricultural expert for detailed analysis.";
      } else {
        // Use Gemini for recommendations only
        try {
          const response = await fetch('https://sfsdfdcdethqjwtjrwpz.supabase.co/functions/v1/gemini-recommendations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              predictedClass,
              accuracy: parseFloat(accuracyPercent.toFixed(2))
            })
          });

          if (response.ok) {
            const data = await response.json();
            recommendations = data.recommendations;
          } else {
            console.error("Gemini API response error:", response.status, await response.text());
            recommendations = "Unable to fetch detailed recommendations at the moment. Please consult with an agricultural expert.";
          }
        } catch (geminiError) {
          console.error("Gemini API error:", geminiError);
          recommendations = "Treatment recommendations temporarily unavailable.";
        }
      }

      const result: OptimizedAnalysisResult = {
        disease: predictedClass,
        confidence: accuracyPercent / 100,
        recommendations
      };

      setAnalysisResult(result);
      
      toast({
        title: "Analysis Complete",
        description: `Detection: ${predictedClass} with ${accuracyPercent.toFixed(2)}% confidence`,
      });

    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysisError(error instanceof Error ? error.message : "Analysis failed");
      
      toast({
        title: "Analysis Failed",
        description: "Please try again with a different image",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    resetFile();
    setAnalysisResult(null);
    setAnalysisError(null);
  };

  return {
    selectedFile,
    previewUrl,
    isAnalyzing,
    analysisResult,
    analysisError,
    isModelLoaded,
    imageRef,
    handleFileChange,
    handleAnalyze,
    handleReset,
    initializeModel
  };
};