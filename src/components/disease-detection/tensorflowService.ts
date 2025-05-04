
import * as tf from '@tensorflow/tfjs';
import { knownDiseases } from './diseaseUtils';

// Use the Supabase-hosted model URL
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
    
    // Shorter timeout for faster detection of issues
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Model loading timed out")), 10000);
    });
    
    // Use explicit model loading options with cache options
    const modelLoadingOptions = {
      fetchFunc: (url: string, init?: RequestInit) => {
        // Add cache control for better performance
        const headers = new Headers(init?.headers);
        headers.set('Cache-Control', 'max-age=86400');
        
        return fetch(url, {
          ...init,
          headers,
          cache: 'force-cache', // Force using cached version when available
          credentials: 'omit', // Avoid sending cookies to prevent CORS issues
        });
      }
    };
    
    // Race the model loading against the timeout
    model = await Promise.race([
      tf.loadLayersModel(MODEL_URL, modelLoadingOptions),
      timeoutPromise
    ]) as tf.LayersModel;
    
    console.log("Model loaded successfully");
    
    // Warm up the model with a test prediction to ensure it's working
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
      throw new Error("Model architecture issue. Using alternative analysis method.");
    }
    // Check if it's a CORS error
    else if (error instanceof Error && error.message.includes('CORS')) {
      throw new Error("Access error loading model. Using alternative analysis method.");
    }
    // Check if it's a network error
    else if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('timed out'))) {
      throw new Error("Network issue loading model. Using alternative analysis method.");
    }
    
    throw new Error("Could not load disease model. Using alternative analysis method.");
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
