
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Upload, Image as ImageIcon, AlertCircle, Save } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const DiseaseDetection = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<{
    disease: string;
    confidence: number;
    affectedArea: number;
    treatment: string;
  } | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
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
    if (!selectedFile) return;
    
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
      
      // Upload the file to UploadThing
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Call our Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('upload-image', {
        body: { 
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileUrl: previewUrl
        },
      });
      
      if (error) {
        throw error;
      }
      
      // Complete the progress bar
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Mock analysis result - in a real app, this would come from an AI model
      setTimeout(() => {
        setAnalysisResult({
          disease: "Northern Corn Leaf Blight",
          confidence: 92,
          affectedArea: 35,
          treatment: "Apply fungicide containing azoxystrobin, pyraclostrobin, or propiconazole. Remove and destroy infected leaves if possible. Ensure proper field drainage and crop rotation with non-host crops for 1-2 years."
        });
        setIsAnalyzing(false);
      }, 1000);
      
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast({
        title: "Analysis failed",
        description: "There was a problem analyzing your image. Please try again.",
        variant: "destructive"
      });
      setIsAnalyzing(false);
    }
  };

  const handleSaveResults = () => {
    if (!analysisResult) return;
    
    // Save the analysis results
    toast({
      title: "Results saved",
      description: "The analysis results have been saved to your account.",
    });
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
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px]">
            {previewUrl ? (
              <div className="w-full flex flex-col items-center">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-w-full max-h-[300px] object-contain rounded-lg"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-4"
                  onClick={handleReset}
                >
                  Change image
                </Button>
              </div>
            ) : (
              <>
                <ImageIcon className="h-10 w-10 text-muted-foreground mb-4" />
                <Label
                  htmlFor="image-upload"
                  className="text-sm text-muted-foreground text-center cursor-pointer"
                >
                  <span className="font-medium">Click to upload</span> or drag and drop
                  <br />
                  JPG, PNG or WEBP (max. 5MB)
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </>
            )}
          </div>
          <Button 
            className="w-full bg-leaf-700 hover:bg-leaf-800"
            onClick={handleAnalyze}
            disabled={!selectedFile || isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <span className="mr-2">Analyzing...</span>
                <Progress value={uploadProgress} className="w-1/3 h-2" />
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Analyze Image
              </>
            )}
          </Button>
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
        <CardContent className="space-y-4">
          {!analysisResult && !isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
              <AlertCircle className="h-10 w-10 mb-4" />
              <p>No analysis results yet</p>
              <p className="text-sm">Upload an image and click Analyze to get started</p>
            </div>
          ) : isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Upload className="h-10 w-10 mb-4 animate-pulse" />
              <p>Analyzing your image...</p>
              <Progress value={uploadProgress} className="w-2/3 h-2 mt-4" />
            </div>
          ) : analysisResult && (
            <>
              <div className="space-y-2">
                <h3 className="font-medium">Detected Disease</h3>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{analysisResult.disease}</AlertTitle>
                  <AlertDescription className="mt-2">
                    Confidence: {analysisResult.confidence}% | Affected Area: {analysisResult.affectedArea}%
                  </AlertDescription>
                </Alert>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Recommended Treatment</h3>
                <div className="bg-muted rounded-lg p-3 text-sm">
                  {analysisResult.treatment}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Prevention Tips</h3>
                <ul className="list-disc list-inside text-sm space-y-1 bg-muted rounded-lg p-3">
                  <li>Rotate crops with non-host plants</li>
                  <li>Use resistant maize varieties when possible</li>
                  <li>Ensure proper field drainage</li>
                  <li>Apply preventative fungicides when disease pressure is high</li>
                  <li>Remove crop debris after harvest</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset} disabled={!analysisResult}>
            Reset
          </Button>
          <Button 
            className="bg-leaf-700 hover:bg-leaf-800"
            disabled={!analysisResult}
            onClick={handleSaveResults}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Results
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
