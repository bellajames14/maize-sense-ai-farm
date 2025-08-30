import * as tf from '@tensorflow/tfjs';

// Preprocess image for model input - hardcoded for MobileNetV2 requirements
export const preprocessImageForModel = (imageElement: HTMLImageElement): tf.Tensor => {
  return tf.tidy(() => {
    console.log("Preprocessing image for model input");
    console.log("Original image dimensions:", imageElement.width, "x", imageElement.height);
    
    // Convert image to tensor and ensure it's in the right format
    // MobileNetV2 expects: (batch_size, 224, 224, 3) with float32 dtype and [0,1] normalization
    const tensor = tf.browser.fromPixels(imageElement)
      .resizeBilinear([224, 224])  // Resize to 224x224
      .toFloat()                   // Convert to float32
      .div(255.0)                  // Normalize to [0,1] range
      .expandDims(0);              // Add batch dimension: (1, 224, 224, 3)
    
    console.log("Preprocessed tensor shape:", tensor.shape);
    console.log("Preprocessed tensor dtype:", tensor.dtype);
    
    return tensor;
  });
};