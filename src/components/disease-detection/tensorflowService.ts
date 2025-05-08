
import * as tf from '@tensorflow/tfjs';
import { knownDiseases } from './diseaseUtils';

// Use the Supabase-hosted model URL with correct path to weight files
const MODEL_URL = 'https://sfsdfdcdethqjwtjrwpz.supabase.co/storage/v1/object/public/tfjs-models/Maize_disease_model/model.json';
let model: tf.LayersModel | null = null;
let modelLoadingPromise: Promise<tf.LayersModel> | null = null;
let modelLoadFailed = false;

// Load the model with improved handling and caching
export const loadModel = async (): Promise<tf.LayersModel> => {
  // If model is already loaded, return it immediately
  if (model) {
    console.log("Using cached model instance");
    return model;
  }
  
  // If model loading previously failed, don't retry until page reload
  if (modelLoadFailed) {
    console.log("Model loading previously failed, throwing error");
    throw new Error("Model loading failed previously. Please refresh the page to try again.");
  }
  
  // If model loading is in progress, return the existing promise
  if (modelLoadingPromise) {
    console.log("Model loading already in progress, reusing promise");
    return modelLoadingPromise;
  }
  
  try {
    console.log("Starting model loading from:", MODEL_URL);
    
    // Log detailed environment info for debugging
    console.log("TensorFlow.js version:", tf.version.tfjs);
    console.log("Using backend:", tf.getBackend());
    
    // Check if backend is operational
    const isWebGLAvailable = tf.getBackend() === 'webgl';
    console.log("WebGL available:", isWebGLAvailable);
    
    if (isWebGLAvailable) {
      try {
        // Check WebGL capabilities
        const gl = (tf.backend() as any).getGPGPUContext().gl;
        console.log("WebGL context:", gl ? "Available" : "Not available");
        if (gl) {
          const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
          console.log("WebGL max texture size:", maxTextureSize);
          const vendor = gl.getParameter(gl.VENDOR);
          const renderer = gl.getParameter(gl.RENDERER);
          console.log("WebGL vendor:", vendor);
          console.log("WebGL renderer:", renderer);
        }
      } catch (glErr) {
        console.warn("Error checking WebGL capabilities:", glErr);
      }
    }
    
    // Add memory management improvements
    console.log("Configuring TensorFlow.js for optimal performance");
    tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
    tf.env().set('WEBGL_CPU_FORWARD', false); // Force GPU
    tf.env().set('WEBGL_PACK', true);
    
    // Try to switch to WebGL2 if available
    if (tf.getBackend() !== 'webgl') {
      console.log("Attempting to switch to WebGL backend");
      try {
        await tf.setBackend('webgl');
        console.log("Successfully switched to WebGL backend");
      } catch (backendErr) {
        console.warn("Could not switch to WebGL backend:", backendErr);
      }
    }
    
    // Create the model loading promise
    modelLoadingPromise = new Promise<tf.LayersModel>(async (resolve, reject) => {
      try {
        // Force garbage collection before loading the model
        if (tf.getBackend() === 'webgl') {
          console.log("Performing WebGL memory cleanup");
          tf.engine().endScope();
          tf.engine().startScope();
          // Run simple ops to test WebGL is working
          const testTensor = tf.tensor([1, 2, 3]);
          testTensor.dispose();
        }
        
        // Explicitly define the model loading configuration
        console.log("Attempting to load model with fetch options");
        
        // More reliable fetch options with credentials and CORS handling
        const loadOptions = {
          weightPathPrefix: 'https://sfsdfdcdethqjwtjrwpz.supabase.co/storage/v1/object/public/tfjs-models/Maize_disease_model/',
          fetchFunc: async (path: string, init?: RequestInit) => {
            console.log(`Fetching model resource: ${path}`);
            
            // Custom fetch with retry logic for reliability
            const maxRetries = 3;
            let lastError;
            
            for (let attempt = 0; attempt < maxRetries; attempt++) {
              try {
                const response = await fetch(path, {
                  ...init,
                  cache: 'force-cache', // Try to use browser cache aggressively
                  mode: 'cors',
                  credentials: 'omit',
                  // Reasonable timeout
                  signal: attempt < maxRetries - 1 ? 
                    AbortSignal.timeout((attempt + 1) * 10000) : // Increasing timeouts
                    undefined // No timeout for final attempt
                });
                
                if (!response.ok) {
                  throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
                }
                
                console.log(`Successfully fetched: ${path}`);
                return response;
              } catch (error) {
                console.warn(`Attempt ${attempt + 1} failed for ${path}:`, error);
                lastError = error;
                // Wait before retry
                await new Promise(res => setTimeout(res, 1000));
              }
            }
            
            throw lastError || new Error(`Failed to fetch ${path} after ${maxRetries} attempts`);
          }
        };
        
        // Try a different approach: load the model in stages
        try {
          console.log("Loading model in stages...");
          
          // First, check if model.json is accessible
          const modelJsonResponse = await fetch(MODEL_URL, { 
            cache: 'force-cache',
            mode: 'cors' 
          });
          
          if (!modelJsonResponse.ok) {
            throw new Error(`Failed to fetch model.json: ${modelJsonResponse.status}`);
          }
          
          const modelJson = await modelJsonResponse.json();
          console.log("Model JSON structure loaded, found weights:", 
            modelJson.weightsManifest ? modelJson.weightsManifest.length : "None");
          
          // Now load the full model
          console.log("Now loading full model...");
          const loadedModel = await tf.loadLayersModel(MODEL_URL, loadOptions);
          
          console.log("Model loaded successfully!");
          console.log("Model architecture:", loadedModel.name || "Unnamed model");
          
          // Check input shape to verify it matches our preprocessing
          if (loadedModel.inputs && loadedModel.inputs[0]) {
            const inputShape = loadedModel.inputs[0].shape;
            console.log("Model input shape:", inputShape);
            // Verify expected input shape (typically [null, 224, 224, 3] for image models)
            if (inputShape[1] !== 224 || inputShape[2] !== 224 || inputShape[3] !== 3) {
              console.warn(`Unexpected input shape: ${inputShape}. Expected [null, 224, 224, 3]`);
            }
          }
          
          // Check output shape to verify it matches our expected number of classes
          if (loadedModel.outputs && loadedModel.outputs[0]) {
            const outputShape = loadedModel.outputs[0].shape;
            console.log("Model output shape:", outputShape);
            console.log("Expected number of classes:", knownDiseases.length);
            
            // Verify output classes match our disease list
            if (outputShape[outputShape.length - 1] !== knownDiseases.length) {
              console.warn(`Model output classes (${outputShape[outputShape.length - 1]}) doesn't match expected diseases (${knownDiseases.length})`);
            }
          }
          
          // Simple warm-up inference to verify model works
          console.log("Warming up model with test inference");
          const dummyInput = tf.zeros([1, 224, 224, 3]);
          const warmupResult = loadedModel.predict(dummyInput) as tf.Tensor;
          
          // Log prediction shape and values
          const predictionShape = warmupResult.shape;
          console.log("Prediction shape:", predictionShape);
          
          const predValues = await warmupResult.data();
          console.log("Prediction sample (first 3 values):", 
            Array.from(predValues).slice(0, 3));
          
          // Cleanup tensors
          warmupResult.dispose();
          dummyInput.dispose();
          
          model = loadedModel;
          
          // Register a beforeunload listener to improve browser caching
          window.addEventListener('beforeunload', () => {
            console.log("Page unloading, ensuring model is cached");
          });
          
          resolve(model);
        } catch (loadError) {
          console.error("Stage-based model loading failed:", loadError);
          throw loadError;
        }
      } catch (error) {
        console.error("Failed to load model in promise:", error);
        modelLoadingPromise = null; // Reset promise to allow retry
        modelLoadFailed = true; // Mark as failed to prevent excessive retries
        reject(error);
      }
    });
    
    // Use a reasonable timeout for model loading (30 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        modelLoadingPromise = null; // Reset promise to allow retry
        modelLoadFailed = true; // Mark as failed
        reject(new Error("Model loading timed out after 30 seconds"));
      }, 30000); // 30 seconds
    });
    
    console.log("Waiting for model to load (timeout: 30s)");
    model = await Promise.race([modelLoadingPromise, timeoutPromise]) as tf.LayersModel;
    
    // Reset loading promise once done
    modelLoadingPromise = null;
    
    console.log("Model successfully loaded and ready for inference");
    return model;
  } catch (error) {
    // Reset loading promise on error
    modelLoadingPromise = null;
    modelLoadFailed = true;
    
    console.error("Failed to load TensorFlow.js model:", error);
    
    // Provide a clear error message based on error type
    if (error instanceof Error) {
      if (error.message.includes('InputLayer')) {
        throw new Error("Model architecture issue. Check input shape definition.");
      } else if (error.message.includes('CORS')) {
        throw new Error("Access error loading model. CORS issue detected.");
      } else if (error.message.includes('fetch') || error.message.includes('timed out')) {
        throw new Error("Network issue loading model. Check your connection and try again.");
      } else if (error.message.includes('WebGL')) {
        throw new Error("GPU acceleration issue. Your browser might not support WebGL fully.");
      }
    }
    
    throw new Error("Could not load disease model: " + (error instanceof Error ? error.message : String(error)));
  }
};

// Process image for model input - optimized for performance
export const preprocessImage = async (imageElement: HTMLImageElement): Promise<tf.Tensor> => {
  return tf.tidy(() => {
    try {
      console.log("Preprocessing image for model input");
      console.log("Image dimensions:", imageElement.width, "x", imageElement.height);
      
      // Convert image to tensor
      let imgTensor = tf.browser.fromPixels(imageElement);
      console.log("Image tensor shape:", imgTensor.shape);
      
      // Resize to model input size (224x224) and normalize in one go for better performance
      const processedTensor = tf.image.resizeBilinear(imgTensor, [224, 224])
        .toFloat()
        .div(255)
        .expandDims(0);
      
      console.log("Processed tensor shape:", processedTensor.shape);
      return processedTensor;
    } catch (error) {
      console.error("Error preprocessing image:", error);
      throw new Error("Failed to process the image. Please try again.");
    }
  });
};

// Predict disease from image
export const predictDisease = async (imageElement: HTMLImageElement): Promise<{diseaseName: string, confidence: number}> => {
  try {
    console.log("Starting disease prediction process");
    
    const loadedModel = await loadModel();
    console.log("Model loaded for prediction");
    
    const processedImg = await preprocessImage(imageElement);
    console.log("Image preprocessed successfully");
    
    console.log("Running inference...");
    // Get prediction - use executeAsync for better performance on WebGL backend
    const predictions = await loadedModel.predict(processedImg) as tf.Tensor;
    
    // Use typed array for faster processing
    const predictionArray = await predictions.data();
    console.log("Raw predictions:", Array.from(predictionArray));
    
    // Find index with highest probability using typed array methods
    const maxIndex = Array.from(predictionArray).reduce(
      (iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 
      0
    );
    
    const maxProb = predictionArray[maxIndex];
    
    // Get disease name and confidence
    const diseaseName = knownDiseases[maxIndex] || "Unknown";
    const confidence = maxProb * 100; // Convert to percentage
    
    console.log("Prediction result:", diseaseName, "with confidence", confidence.toFixed(2) + "%");
    
    // Cleanup tensors to prevent memory leaks
    tf.dispose([processedImg, predictions]);
    
    return {
      diseaseName,
      confidence
    };
  } catch (error) {
    console.error("Error during disease prediction:", error);
    throw new Error("Disease detection failed: " + (error instanceof Error ? error.message : String(error)));
  }
};
