
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import * as tf from "@tensorflow/tfjs";
import { loadModel } from "../tensorflowService";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface ModelInitializerProps {
  onModelLoaded: (isLoaded: boolean) => void;
}

export const ModelInitializer = ({ onModelLoaded }: ModelInitializerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<string>("Starting initialization...");
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Load TensorFlow.js model
  useEffect(() => {
    const initializeModel = async () => {
      try {
        setIsLoading(true);
        setLoadStatus("Initializing TensorFlow.js...");
        
        // For mobile devices, always use cloud analysis
        if (isMobile) {
          console.log("Mobile device detected, using cloud analysis");
          setLoadStatus("Using cloud analysis for mobile");
          setIsLoading(false);
          onModelLoaded(true);
          
          toast({
            title: "Using cloud analysis",
            description: "For optimal performance on mobile devices, we're using cloud analysis.",
            variant: "default"
          });
          return;
        }
        
        // Enable memory tracking to improve performance
        tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
        tf.env().set('WEBGL_CPU_FORWARD', false); // Force GPU
        tf.env().set('WEBGL_VERSION', 2); // Try to use WebGL 2
        tf.env().set('WEBGL_FORCE_F16_TEXTURES', false);
        tf.env().set('WEBGL_PACK', true);
        
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
        
        // Add additional memory cleanup
        tf.tidy(() => {
          // Run a small operation to initialize backend
          tf.zeros([1, 1, 1, 1]).dispose();
        });
        
        // Set a longer timeout for model loading (30 seconds)
        try {
          setLoadStatus("Loading model (this may take a few moments)...");
          await Promise.race([
            loadModel(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Model loading timeout")), 30000)
            )
          ]);
          
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
            description: "Local model unavailable: " + (modelError instanceof Error ? modelError.message : "Unknown error") + ". Using cloud analysis instead.",
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
  }, [onModelLoaded, toast, isMobile]);

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
