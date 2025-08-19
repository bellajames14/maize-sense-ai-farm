
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "./ImageUploader";
import { OptimizedAnalysisResults } from "./OptimizedAnalysisResults";
import { useOptimizedDiseaseAnalysis } from "./hooks/useOptimizedDiseaseAnalysis";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePreferences } from "@/hooks/usePreferences";
import { Button } from "@/components/ui/button";

export const DiseaseDetection = () => {
  const isMobile = useIsMobile();
  const { translate } = usePreferences();
  
  const {
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
  } = useOptimizedDiseaseAnalysis();

  useEffect(() => {
    initializeModel();
  }, []);

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
          <div className="space-y-4">
            {!isModelLoaded && (
              <div className="text-center py-4">
                <Button onClick={initializeModel} variant="outline">
                  Load Detection Model
                </Button>
              </div>
            )}
            
            <ImageUploader
              selectedFile={selectedFile}
              previewUrl={previewUrl}
              isAnalyzing={isAnalyzing}
              uploadProgress={0}
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
          </div>
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
          <OptimizedAnalysisResults
            isAnalyzing={isAnalyzing}
            analysisResult={analysisResult}
            analysisError={analysisError}
            onReset={handleReset}
          />
        </CardContent>
      </Card>
    </div>
  );
};
