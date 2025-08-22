import React from 'react';
import * as tf from '@tensorflow/tfjs';

// Optimized model configuration for accuracy preservation
const MODEL_CONFIG = {
  url: 'https://sfsdfdcdethqjwtjrwpz.supabase.co/storage/v1/object/public/tfjs-models/Maize_disease_model_v1/model.json',
  inputShape: [224, 224, 3] as const,
  numClasses: 7,
  meanValues: [0.485, 0.456, 0.406], // ImageNet normalization
  stdValues: [0.229, 0.224, 0.225],  // ImageNet normalization
  backend: 'webgl' as const
};

let modelInstance: tf.LayersModel | null = null;
let loadingPromise: Promise<tf.LayersModel> | null = null;

// Optimized model loading with accuracy preservation
export const loadOptimizedModel = async (): Promise<tf.LayersModel> => {
  if (modelInstance) {
    return modelInstance;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      console.log('Setting up optimized TensorFlow backend...');
      
      // Set backend with optimization flags
      await tf.setBackend(MODEL_CONFIG.backend);
      await tf.ready();
      
      // Enable high precision mode
      tf.env().set('WEBGL_FORCE_F16_TEXTURES', false);
      tf.env().set('WEBGL_RENDER_FLOAT32_CAPABLE', true);
      tf.env().set('WEBGL_RENDER_FLOAT32_ENABLED', true);
      
      console.log('Loading model with precision optimizations...');
      
      const model = await tf.loadLayersModel(MODEL_CONFIG.url, {
        onProgress: (fraction) => {
          console.log(`Model loading: ${(fraction * 100).toFixed(1)}%`);
        }
      });

      console.log('Model loaded successfully');
      console.log('Input shape:', model.inputs[0].shape);
      console.log('Output shape:', model.outputs[0].shape);
      
      // Verify model architecture
      if (model.inputs[0].shape?.slice(1, 4).toString() !== MODEL_CONFIG.inputShape.toString()) {
        console.warn('Model input shape mismatch - this may affect accuracy');
      }

      // Warm up model with proper preprocessing
      await warmUpModel(model);
      
      modelInstance = model;
      loadingPromise = null;
      
      return model;
    } catch (error) {
      loadingPromise = null;
      console.error('Optimized model loading failed:', error);
      throw new Error(`Failed to load optimized model: ${error instanceof Error ? error.message : String(error)}`);
    }
  })();

  return loadingPromise;
};

// Warm up model with realistic preprocessing
const warmUpModel = async (model: tf.LayersModel): Promise<void> => {
  console.log('Warming up model with optimized preprocessing...');
  
  // Create a realistic test input (not zeros)
  const warmupInput = tf.tidy(() => {
    // Create a more realistic input pattern
    const randomInput = tf.randomUniform([1, ...MODEL_CONFIG.inputShape], 0, 255);
    
    // Apply the same normalization as real predictions
    const normalized = randomInput.div(255.0);
    const mean = tf.tensor(MODEL_CONFIG.meanValues);
    const std = tf.tensor(MODEL_CONFIG.stdValues);
    
    return normalized.sub(mean).div(std);
  });

  try {
    const prediction = model.predict(warmupInput) as tf.Tensor;
    console.log('Warmup prediction shape:', prediction.shape);
    
    // Test that we get a valid probability distribution
    const probSum = tf.sum(prediction).dataSync()[0];
    console.log('Warmup prediction sum:', probSum);
    
    prediction.dispose();
  } finally {
    warmupInput.dispose();
  }
  
  console.log('Model warmed up successfully');
};

// Get model configuration
export const getModelConfig = () => MODEL_CONFIG;

// Cleanup function
export const disposeModel = () => {
  if (modelInstance) {
    modelInstance.dispose();
    modelInstance = null;
  }
  loadingPromise = null;
};