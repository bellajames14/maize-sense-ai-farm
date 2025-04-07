
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ImageUploader } from "./ImageUploader";
import { AnalysisResults, DiseaseAnalysisResult } from "./AnalysisResults";

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
      
      console.log("Calling upload-image edge function");
      // Call our Supabase Edge Function to upload and analyze the image
      const { data, error } = await supabase.functions.invoke('upload-image', {
        body: { 
          fileData: previewUrl,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          userId: user?.id || null
        },
      });
      
      // Complete the progress bar
      clearInterval(progressInterval);
      
      if (error) {
        console.error("Edge function error:", error);
        throw new Error(`Analysis failed: ${error.message || "Unknown error"}`);
      }
      
      console.log("Received analysis response:", data);
      setUploadProgress(100);
      
      // Extract disease analysis results
      if (data && data.diseaseAnalysis) {
        setAnalysisResult(data.diseaseAnalysis);
        
        // Show success toast
        toast({
          title: "Analysis complete",
          description: `Detected: ${data.diseaseAnalysis.disease} with ${data.diseaseAnalysis.confidence}% confidence`,
        });
      } else {
        throw new Error("No analysis results returned from server");
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      setAnalysisError(error instanceof Error ? error.message : "An unknown error occurred");
      
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
      // The results are already saved in the database during analysis if user is logged in
      // This is just for UX to confirm to the user
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
