import { useState } from 'react';
import { analyzeImageWithGemini, DiseaseDetectionResult } from '../services/geminiDiseaseService';

export const useDiseaseDetection = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiseaseDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      console.log("Starting Gemini disease analysis");
      const analysisResult = await analyzeImageWithGemini(selectedFile);
      console.log("Analysis completed:", analysisResult);
      setResult(analysisResult);
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
    handleFileChange,
    handleAnalyze,
    handleReset
  };
};