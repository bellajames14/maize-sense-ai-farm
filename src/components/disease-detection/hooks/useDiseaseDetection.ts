import { useState, useRef } from 'react';
import { predictDiseaseLocal, PredictionResult } from '../services/localPredictionService';
import { getGeminiRecommendations, GeminiRecommendation } from '../services/geminiRecommendationService';

export interface DiseaseDetectionResult {
  prediction: PredictionResult;
  recommendations: GeminiRecommendation;
}

export const useDiseaseDetection = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiseaseDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (file: File | null) => {
    if (file) {
      setSelectedFile(file);
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
    }
    // Clear previous results
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !previewUrl || !imageRef.current) {
      setError("Please select an image first");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      // Load image into the image element
      await new Promise<void>((resolve, reject) => {
        if (imageRef.current) {
          imageRef.current.onload = () => resolve();
          imageRef.current.onerror = () => reject(new Error("Failed to load image"));
          imageRef.current.src = previewUrl;
        }
      });

      console.log("Starting disease detection analysis");
      
      // Step 1: Get prediction from local TensorFlow.js model
      const prediction = await predictDiseaseLocal(imageRef.current);
      console.log("Prediction completed:", prediction);
      
      // Step 2: Get recommendations from Gemini API
      const recommendations = await getGeminiRecommendations(prediction);
      console.log("Recommendations received:", recommendations);
      
      setResult({
        prediction,
        recommendations
      });
    } catch (err) {
      console.error("Disease detection error:", err);
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  return {
    selectedFile,
    previewUrl,
    isAnalyzing,
    result,
    error,
    imageRef,
    handleFileChange,
    handleAnalyze,
    handleReset
  };
};