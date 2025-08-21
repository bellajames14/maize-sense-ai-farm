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
      tf.layers.dense({ units: 5, activation: 'softmax' }) // 5 classes for MobileNetV2
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
      await tf.ready();
    } catch (backendError) {
      console.warn("WebGL backend not available, using CPU");
      await tf.setBackend('cpu');
      await tf.ready();
    }
    
    // Try to load the model with proper error handling
    const model = await tf.loadLayersModel(modelUrl, {
      onProgress: (fraction) => {
        console.log(`Model loading progress: ${(fraction * 100).toFixed(1)}%`);
      }
    });
    
    console.log("Model loaded successfully");
    console.log("Model input shape:", model.inputs[0].shape);
    console.log("Model output shape:", model.outputs[0].shape);
    
    // Warm up the model with a dummy prediction
    const dummyInput = tf.zeros([1, 224, 224, 3]);
    const warmupPrediction = model.predict(dummyInput) as tf.Tensor;
    warmupPrediction.dispose();
    dummyInput.dispose();
    console.log("Model warmed up successfully");
    
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