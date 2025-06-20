
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useFileHandler } from "./useFileHandler";
import { useTensorFlowAnalysis } from "./useTensorFlowAnalysis";
import { DiseaseAnalysisResult } from "../AnalysisResults";
import { processEnhancedGeminiResponse } from "../services/enhancedResponseProcessor";
import { saveScanResult } from "../services/databaseService";

export const useEnhancedDiseaseAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<DiseaseAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use the refactored hooks
  const {
    selectedFile,
    previewUrl,
    handleFileChange,
    handleReset: resetFile
  } = useFileHandler();
  
  const {
    imageRef,
    analyzeWithTensorflow
  } = useTensorFlowAnalysis();

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
    setUploadProgress(0);

    try {
      console.log("Starting enhanced disease analysis");
      setUploadProgress(20);

      // Step 1: Try TensorFlow analysis first (your local model)
      let tensorflowResult = null;
      try {
        console.log("Running TensorFlow analysis...");
        tensorflowResult = await analyzeWithTensorflow(previewUrl);
        console.log("TensorFlow result:", tensorflowResult);
        setUploadProgress(40);
      } catch (tfError) {
        console.log("TensorFlow analysis failed, will use Gemini only:", tfError);
      }

      // Step 2: Upload image and get Gemini recommendations
      console.log("Uploading image and getting Gemini analysis...");
      setUploadProgress(60);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (user) {
        formData.append('userId', user.id);
      }

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const uploadResult = await response.json();
      console.log("Upload and Gemini analysis result:", uploadResult);
      setUploadProgress(80);

      // Step 3: Process results with enhanced processor
      const processedResult = processEnhancedGeminiResponse(
        uploadResult.analysisText || "Analysis completed",
        tensorflowResult
      );

      const finalResult: DiseaseAnalysisResult = {
        disease: processedResult.disease,
        confidence: processedResult.confidence,
        treatment: processedResult.treatment,
        prevention: processedResult.prevention,
        explanation: processedResult.explanation,
        affectedArea: uploadResult.affectedArea || "Unknown"
      };

      setAnalysisResult(finalResult);
      setUploadProgress(100);

      toast({
        title: "Analysis Complete",
        description: `Disease detection completed with ${Math.round(finalResult.confidence * 100)}% confidence`,
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
      setUploadProgress(0);
    }
  };

  const handleSaveResults = async () => {
    if (!analysisResult || !user) {
      toast({
        title: "Cannot save results",
        description: "Please login and complete an analysis first",
        variant: "destructive"
      });
      return;
    }

    try {
      await saveScanResult(user.id, previewUrl || "", analysisResult);
      
      toast({
        title: "Results Saved",
        description: "Your analysis results have been saved to your dashboard",
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Save Failed",
        description: "Could not save results. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    resetFile();
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
