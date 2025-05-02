
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "./ImageUploader";
import { AnalysisResults } from "./AnalysisResults";
import { ModelInitializer } from "./components/ModelInitializer";
import { useDiseaseAnalysis } from "./hooks/useDiseaseAnalysis";

export const DiseaseDetection = () => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const {
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
  } = useDiseaseAnalysis();

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
          <ModelInitializer onModelLoaded={setIsModelLoaded} />
          <ImageUploader
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            isAnalyzing={isAnalyzing}
            uploadProgress={uploadProgress}
            onFileChange={handleFileChange}
            onAnalyze={handleAnalyze}
            onReset={handleReset}
            isModelLoaded={isModelLoaded}
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
