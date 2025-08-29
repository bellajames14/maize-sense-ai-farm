
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useFileHandler } from "./useFileHandler";
import { predictDiseaseWithAccuracy } from "../services/enhancedPredictionService";
import { getLocalRecommendations } from "../services/localRecommendationService";
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

      // Use local TensorFlow prediction
      console.log("Starting local TensorFlow prediction...");
      
      const predictionResult = await predictDiseaseWithAccuracy(imageRef.current!);
      
      const predictedClass = predictionResult.diseaseName;
      const accuracyPercent = predictionResult.confidence;
      
      console.log("Local prediction result:", predictionResult);
      console.log("Processing stats:", predictionResult.processingStats);
      console.log(`Final prediction: ${predictedClass} with ${accuracyPercent.toFixed(2)}% confidence`);
      
      // Get local recommendations
      const recommendations = getLocalRecommendations(predictedClass, accuracyPercent);

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
