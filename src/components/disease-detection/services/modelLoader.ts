
import * as tf from '@tensorflow/tfjs';
import { knownDiseases } from '../diseaseUtils';

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
    
    // Create the model loading promise
    modelLoadingPromise = tf.loadLayersModel(MODEL_URL);
    
    // Use a reasonable timeout for model loading (30 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
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

// Warm up the model with a test inference
export const warmupModel = async (loadedModel: tf.LayersModel) => {
  console.log("Warming up model with test inference");
  const dummyInput = tf.zeros([1, 224, 224, 3]);
  const warmupResult = loadedModel.predict(dummyInput) as tf.Tensor;
  
  // Log prediction shape and values
  const predictionShape = warmupResult.shape;
  console.log("Prediction shape:", predictionShape);
  
  // Cleanup tensors
  warmupResult.dispose();
  dummyInput.dispose();
  
  return loadedModel;
};
