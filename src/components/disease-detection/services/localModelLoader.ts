import * as tf from '@tensorflow/tfjs';

let cachedModel: tf.LayersModel | null = null;

// Load model directly from public folder
export const loadLocalModel = async (): Promise<tf.LayersModel> => {
  if (cachedModel) {
    console.log("Using cached local model");
    return cachedModel;
  }

  try {
    console.log("Loading TensorFlow.js model from /model.json");
    
    // Set backend to WebGL for better performance
    await tf.setBackend('webgl');
    await tf.ready();
    
    // Load model from public folder
    cachedModel = await tf.loadLayersModel("/model.json");
    
    console.log("Model loaded successfully from local path");
    console.log("Model input shape:", cachedModel.inputs[0].shape);
    
    // Verify input shape matches expected (None, 224, 224, 3)
    const expectedShape = [null, 224, 224, 3];
    const actualShape = cachedModel.inputs[0].shape;
    console.log("Expected input shape:", expectedShape);
    console.log("Actual input shape:", actualShape);
    
    // Warm up model with dummy prediction
    await warmupModel(cachedModel);
    
    return cachedModel;
  } catch (error) {
    console.error("Failed to load local TensorFlow.js model:", error);
    throw new Error("Could not load disease detection model: " + (error instanceof Error ? error.message : String(error)));
  }
};

// Warm up model to ensure it's ready
const warmupModel = async (model: tf.LayersModel): Promise<void> => {
  console.log("Warming up model with test prediction");
  
  // Create dummy input with correct shape: (1, 224, 224, 3)
  const dummyInput = tf.zeros([1, 224, 224, 3], 'float32');
  
  try {
    const warmupResult = model.predict(dummyInput) as tf.Tensor;
    console.log("Warmup prediction shape:", warmupResult.shape);
    
    // Cleanup
    warmupResult.dispose();
    dummyInput.dispose();
    
    console.log("Model warmup completed successfully");
  } catch (error) {
    dummyInput.dispose();
    throw error;
  }
};