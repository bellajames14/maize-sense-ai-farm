import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useFileHandler } from "./useFileHandler";
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

  // Initialize TensorFlow backend
  useEffect(() => {
    const initTensorFlow = async () => {
      try {
        console.log("Initializing TensorFlow.js...");
        await tf.setBackend('webgl');
        await tf.ready();
        setIsModelLoaded(true);
        console.log("TensorFlow.js initialized successfully");
      } catch (error) {
        console.error("TensorFlow initialization failed:", error);
        setIsModelLoaded(false);
      }
    };

    initTensorFlow();
  }, []);

  const initializeModel = async () => {
    try {
      await tf.setBackend('webgl');
      await tf.ready();
      setIsModelLoaded(true);
      toast({
        title: "Model Ready",
        description: "Disease detection model ready for analysis",
      });
    } catch (error) {
      console.error("Model initialization failed:", error);
      toast({
        title: "Model Load Failed", 
        description: "Please try again",
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
        // Use enhanced prediction with your trained model
        console.log("Starting TensorFlow prediction with your trained model...");
        
        const predictionResult = await predictDiseaseWithAccuracy(imageRef.current!);
        
        predictedClass = predictionResult.diseaseName;
        accuracyPercent = predictionResult.confidence;
        
        console.log("TensorFlow prediction result:", predictionResult);
        console.log("Processing stats:", predictionResult.processingStats);
        console.log(`Final prediction: ${predictedClass} with ${accuracyPercent.toFixed(2)}% confidence`);
        
      } catch (tfError) {
        console.error("TensorFlow prediction failed, using Gemini vision instead:", tfError);
        
        // Use Gemini for full image analysis as fallback
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          
          const response = await fetch('https://sfsdfdcdethqjwtjrwpz.supabase.co/functions/v1/upload-image', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: formData
          });
          
          if (response.ok) {
            const data = await response.json();
            predictedClass = data.disease || "Unknown";
            accuracyPercent = (data.confidence || 0.5) * 100;
            console.log("Gemini vision analysis result:", data);
          } else {
            throw new Error("Gemini analysis failed");
          }
        } catch (geminiError) {
          console.error("Both TensorFlow and Gemini failed:", geminiError);
          predictedClass = "Analysis_Failed";
          accuracyPercent = 0;
        }
      }

      // Get recommendations based on prediction result
      let recommendations = "";
      
      if (predictedClass === "Low_Confidence") {
        recommendations = "The image is unclear. Please try uploading a clearer or brighter picture of the maize leaf.";
      } else if (predictedClass === "Unknown" || predictedClass === "Analysis_Failed") {
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