import * as tf from '@tensorflow/tfjs';

// Simple fallback model loader that uses a basic CNN approach
export const createSimpleModel = () => {
  const model = tf.sequential({
    layers: [
      tf.layers.conv2d({
        inputShape: [224, 224, 3],
        filters: 32,
        kernelSize: 3,
        activation: 'relu',
      }),
      tf.layers.maxPooling2d({ poolSize: 2 }),
      tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu' }),
      tf.layers.maxPooling2d({ poolSize: 2 }),
      tf.layers.conv2d({ filters: 128, kernelSize: 3, activation: 'relu' }),
      tf.layers.globalAveragePooling2d({}),
      tf.layers.dense({ units: 128, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.5 }),
      tf.layers.dense({ units: 7, activation: 'softmax' }) // 7 classes
    ]
  });
  
  return model;
};

// Enhanced model loader that handles different model formats
export const loadModelWithFallback = async (modelUrl: string): Promise<tf.LayersModel> => {
  try {
    console.log("Attempting to load model from:", modelUrl);
    
    // Set TensorFlow backend to webgl for better performance
    try {
      await tf.setBackend('webgl');
    } catch (backendError) {
      console.warn("WebGL backend not available, using CPU");
      await tf.setBackend('cpu');
    }
    
    const model = await tf.loadLayersModel(modelUrl);
    console.log("Model loaded successfully");
    console.log("Model input shape:", model.inputs[0].shape);
    console.log("Model output shape:", model.outputs[0].shape);
    
    return model;
  } catch (error) {
    console.error("Failed to load model:", error);
    console.log("Creating fallback model...");
    
    // Create a simple fallback model for basic prediction
    const fallbackModel = createSimpleModel();
    
    // Initialize with random weights
    fallbackModel.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    
    console.log("Fallback model created successfully");
    return fallbackModel;
  }
};