
import * as tf from '@tensorflow/tfjs';

// Process image for model input - optimized for performance
export const preprocessImage = async (imageElement: HTMLImageElement): Promise<tf.Tensor> => {
  return tf.tidy(() => {
    try {
      console.log("Preprocessing image for model input");
      
      // Convert image to tensor
      let imgTensor = tf.browser.fromPixels(imageElement);
      
      // Resize to model input size (224x224) and normalize in one go for better performance
      const processedTensor = tf.image.resizeBilinear(imgTensor, [224, 224])
        .toFloat()
        .div(tf.scalar(255))
        .expandDims(0);
      
      console.log("Processed tensor shape:", processedTensor.shape);
      return processedTensor;
    } catch (error) {
      console.error("Error preprocessing image:", error);
      throw new Error("Failed to process the image. Please try again.");
    }
  });
};
