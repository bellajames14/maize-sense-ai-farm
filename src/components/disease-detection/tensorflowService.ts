
import * as tf from '@tensorflow/tfjs';
import { knownDiseases } from './diseaseUtils';

// Use the Supabase-hosted model URL with correct path to weight files
const MODEL_URL = 'https://sfsdfdcdethqjwtjrwpz.supabase.co/storage/v1/object/public/tfjs-models/Maize_disease_model/model.json';
let model: tf.LayersModel | null = null;

// Load the model with improved handling and caching
export const loadModel = async (): Promise<tf.LayersModel> => {
  if (model) {
    console.log("Using cached model");
    return model;
  }
  
  try {
    console.log("Starting model loading from:", MODEL_URL);
    
    // Skip cache clearing as it's causing issues with https scheme
    // await tf.io.removeModel(MODEL_URL); // This was causing the error
    
    // Log TensorFlow.js version and backend being used
    console.log("TensorFlow.js version:", tf.version.tfjs);
    console.log("Using backend:", tf.getBackend());
    
    // Explicitly define the model loading configuration
    const modelLoadPromise = tf.loadLayersModel(MODEL_URL, {
      fetchFunc: async (path: string, init?: RequestInit) => {
        console.log(`Fetching model resource: ${path}`);
        
        // Custom fetch with retry logic for reliability
        const maxRetries = 3;
        let lastError;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const response = await fetch(path, {
              ...init,
              cache: 'no-store', // Try to get fresh content
              mode: 'cors',
              credentials: 'omit'
            });
            
            if (!response.ok) {
              throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
            }
            
            console.log(`Successfully fetched: ${path}`);
            return response;
          } catch (error) {
            console.warn(`Attempt ${attempt + 1} failed for ${path}:`, error);
            lastError = error;
            // Wait before retrying
            await new Promise(res => setTimeout(res, 1000));
          }
        }
        
        throw lastError || new Error(`Failed to fetch ${path} after ${maxRetries} attempts`);
      }
    });
    
    // Use a longer timeout for model loading
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Model loading timed out")), 30000); // Increased timeout to 30 seconds
    });
    
    console.log("Waiting for model to load (timeout: 30s)");
    model = await Promise.race([modelLoadPromise, timeoutPromise]) as tf.LayersModel;
    
    console.log("Model loaded successfully:", model);
    if (model.inputs && model.inputs[0]) {
      console.log("Model input shape:", model.inputs[0].shape);
    }
    
    // Warm up the model to ensure it works
    try {
      console.log("Warming up model with test tensor...");
      const dummyTensor = tf.zeros([1, 224, 224, 3]);
      const warmupResult = model.predict(dummyTensor);
      
      if (Array.isArray(warmupResult)) {
        warmupResult.forEach(tensor => tensor.dispose());
      } else {
        warmupResult.dispose();
      }
      
      dummyTensor.dispose();
      console.log("Model warm-up complete");
    } catch (warmupError) {
      console.error("Model warm-up failed:", warmupError);
      throw new Error(`Model loaded but failed validation: ${warmupError instanceof Error ? warmupError.message : "Unknown error"}`);
    }
    
    return model;
  } catch (error) {
    console.error("Failed to load TensorFlow.js model:", error);
    
    // Provide a clear error message
    if (error instanceof Error && error.message.includes('InputLayer')) {
      throw new Error("Model architecture issue. Check input shape definition.");
    }
    // Check if it's a CORS error
    else if (error instanceof Error && error.message.includes('CORS')) {
      throw new Error("Access error loading model. CORS issue detected.");
    }
    // Check if it's a network error
    else if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('timed out'))) {
      throw new Error("Network issue loading model. Check your connection and try again.");
    }
    
    throw new Error("Could not load disease model: " + (error instanceof Error ? error.message : String(error)));
  }
};

// Process image for model input - optimized for performance
export const preprocessImage = async (imageElement: HTMLImageElement): Promise<tf.Tensor> => {
  return tf.tidy(() => {
    try {
      // Convert image to tensor
      let imgTensor = tf.browser.fromPixels(imageElement);
      
      // Resize to model input size (224x224) and normalize in one go for better performance
      return tf.image.resizeBilinear(imgTensor, [224, 224])
        .toFloat()
        .div(255)
        .expandDims(0);
    } catch (error) {
      console.error("Error preprocessing image:", error);
      throw new Error("Failed to process the image. Please try again.");
    }
  });
};

// Predict disease from image
export const predictDisease = async (imageElement: HTMLImageElement): Promise<{diseaseName: string, confidence: number}> => {
  try {
    const loadedModel = await loadModel();
    const processedImg = await preprocessImage(imageElement);
    
    // Get prediction - use executeAsync for better performance on WebGL backend
    const predictions = await loadedModel.predict(processedImg) as tf.Tensor;
    
    // Use typed array for faster processing
    const predictionArray = await predictions.data();
    
    // Find index with highest probability using typed array methods
    const maxIndex = Array.from(predictionArray).reduce(
      (iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 
      0
    );
    
    const maxProb = predictionArray[maxIndex];
    
    // Get disease name and confidence
    const diseaseName = knownDiseases[maxIndex] || "Unknown";
    const confidence = maxProb * 100; // Convert to percentage
    
    // Cleanup tensors to prevent memory leaks
    tf.dispose([processedImg, predictions]);
    
    return {
      diseaseName,
      confidence
    };
  } catch (error) {
    console.error("Error during disease prediction:", error);
    throw new Error("Disease detection model failed. Using cloud-based analysis instead.");
  }
};
