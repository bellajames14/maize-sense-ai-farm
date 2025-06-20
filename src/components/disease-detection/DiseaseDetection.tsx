
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "./ImageUploader";
import { AnalysisResults } from "./AnalysisResults";
import { ModelInitializer } from "./components/ModelInitializer";
import { useEnhancedDiseaseAnalysis } from "./hooks/useEnhancedDiseaseAnalysis";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePreferences } from "@/hooks/usePreferences";

export const DiseaseDetection = () => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const isMobile = useIsMobile();
  const { translate } = usePreferences();
  
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
  } = useEnhancedDiseaseAnalysis();

  return (
    <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
      <Card>
        <CardHeader>
          <CardTitle>{translate("Maize Disease Detection")}</CardTitle>
          <CardDescription>
            {translate("Upload an image of your maize plant to detect diseases and receive treatment advice.")}
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
          <CardTitle>{translate("Analysis Results")}</CardTitle>
          <CardDescription>
            {analysisResult 
              ? translate("Disease detection results and treatment recommendations")
              : analysisError
                ? translate("Analysis error")
                : translate("Upload and analyze an image to see results")}
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
