
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import * as tf from "@tensorflow/tfjs";
import { loadModel } from "../tensorflowService";
import { useToast } from "@/components/ui/use-toast";

interface ModelInitializerProps {
  onModelLoaded: (isLoaded: boolean) => void;
}

export const ModelInitializer = ({ onModelLoaded }: ModelInitializerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<string>("Starting initialization...");
  const { toast } = useToast();

  // Load TensorFlow.js model
  useEffect(() => {
    const initializeModel = async () => {
      try {
        setIsLoading(true);
        setLoadStatus("Initializing TensorFlow.js...");
        
        // Enable memory tracking to improve performance
        tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
        tf.env().set('WEBGL_CPU_FORWARD', false); // Force GPU
        
        // Initialize TensorFlow.js
        await tf.ready();
        console.log("TensorFlow.js is ready");
        setLoadStatus("TensorFlow ready. Loading model...");
        
        // Check if WebGL is available and working correctly
        const backend = tf.getBackend();
        console.log("Using backend:", backend);
        
        // Try to enforce WebGL backend if not already using it
        if (backend !== 'webgl') {
          try {
            await tf.setBackend('webgl');
            console.log("Successfully switched to WebGL backend");
          } catch (backendError) {
            console.warn("Using", backend, "backend instead of WebGL");
          }
        }
        
        // Load the model with fast timeout
        try {
          setLoadStatus("Loading model...");
          await loadModel();
          
          console.log("Model loaded successfully");
          setLoadStatus("Model ready!");
          setIsLoading(false);
          onModelLoaded(true);
          
          toast({
            title: "Model loaded successfully",
            description: "Disease detection model is ready to use",
          });
        } catch (modelError) {
          console.error("Model loading failed:", modelError);
          
          // If model fails, we'll use the cloud-based approach instead
          setLoadStatus("Using cloud-based analysis");
          setIsLoading(false);
          onModelLoaded(true); // Still allow the user to analyze images
          
          toast({
            title: "Using cloud analysis",
            description: "Local model unavailable. Using cloud analysis instead.",
            variant: "default"
          });
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
          
        setLoadError(`Using cloud-based analysis instead: ${errorMessage}`);
        setIsLoading(false);
        onModelLoaded(true); // Still allow the user to analyze images with fallback
        
        toast({
          title: "Using cloud analysis",
          description: "We'll analyze your images using our cloud service instead.",
          variant: "default"
        });
      }
    };

    initializeModel();
  }, [onModelLoaded, toast]);

  if (loadError) {
    return (
      <Alert variant="default" className="mb-4">
        <CheckCircle2 className="h-4 w-4 mr-2" />
        <AlertTitle>Cloud Analysis Active</AlertTitle>
        <AlertDescription>{loadError}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-muted-foreground">
        <div className="flex items-center mb-2">
          <Loader2 className="animate-spin mr-2 h-4 w-4" />
          <span>Preparing analysis tools...</span>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-1">{loadStatus}</p>
      </div>
    );
  }

  return null;
};
