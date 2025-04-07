
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !previewUrl) return;
    
    setIsAnalyzing(true);
    setUploadProgress(0);
    
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
      
      // Call our Supabase Edge Function to upload and analyze the image
      const { data, error } = await supabase.functions.invoke('upload-image', {
        body: { 
          fileData: previewUrl,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          userId: user?.id || null
        },
      });
      
      if (error) {
        throw error;
      }
      
      // Complete the progress bar
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Extract disease analysis results
      if (data.diseaseAnalysis) {
        setAnalysisResult(data.diseaseAnalysis);
        
        // Show success toast
        toast({
          title: "Analysis complete",
          description: `Detected: ${data.diseaseAnalysis.disease} with ${data.diseaseAnalysis.confidence}% confidence`,
        });
      } else {
        throw new Error("No analysis results returned");
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast({
        title: "Analysis failed",
        description: "There was a problem analyzing your image. Please try again.",
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
              : "Upload and analyze an image to see results"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnalysisResults
            isAnalyzing={isAnalyzing}
            uploadProgress={uploadProgress}
            analysisResult={analysisResult}
            onSaveResults={handleSaveResults}
            onReset={handleReset}
          />
        </CardContent>
      </Card>
    </div>
  );
};
