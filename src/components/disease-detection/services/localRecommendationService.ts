
interface RecommendationData {
  treatment: string[];
  prevention: string[];
  severity: 'low' | 'medium' | 'high';
}

// Local disease recommendations database
const diseaseRecommendations: Record<string, RecommendationData> = {
  "Blight": {
    treatment: [
      "Remove and destroy infected leaves immediately",
      "Apply copper-based fungicide spray",
      "Improve air circulation around plants",
      "Reduce watering frequency and water at soil level"
    ],
    prevention: [
      "Plant resistant varieties when possible",
      "Avoid overhead watering",
      "Ensure proper spacing between plants",
      "Remove plant debris regularly"
    ],
    severity: 'high'
  },
  "Common_Rust": {
    treatment: [
      "Apply fungicide containing propiconazole or azoxystrobin",
      "Remove infected leaves early in the season",
      "Increase plant spacing for better air flow"
    ],
    prevention: [
      "Plant early to avoid peak rust season",
      "Choose rust-resistant varieties",
      "Monitor plants regularly during humid weather",
      "Apply preventive fungicide if conditions favor rust"
    ],
    severity: 'medium'
  },
  "Gray_Leaf_Spot": {
    treatment: [
      "Apply fungicide with active ingredients like strobilurin",
      "Remove infected plant debris",
      "Improve drainage around plants"
    ],
    prevention: [
      "Practice crop rotation",
      "Till under residue to reduce inoculum",
      "Plant resistant hybrids",
      "Monitor weather conditions - disease favors warm, humid weather"
    ],
    severity: 'medium'
  },
  "maize ear rot": {
    treatment: [
      "Remove infected ears immediately",
      "Harvest early if possible to prevent spread",
      "Dry grain quickly after harvest",
      "Store grain properly with adequate ventilation"
    ],
    prevention: [
      "Control insects that create wounds",
      "Avoid plant stress through proper irrigation",
      "Harvest at proper moisture content",
      "Store grain at proper moisture levels (below 14%)"
    ],
    severity: 'high'
  },
  "maize fall armyworm": {
    treatment: [
      "Apply insecticide specifically for armyworm control",
      "Use biological control agents like Bacillus thuringiensis",
      "Remove and destroy heavily infested plants",
      "Apply neem oil as organic treatment"
    ],
    prevention: [
      "Scout fields regularly for early detection",
      "Use pheromone traps for monitoring",
      "Encourage natural predators",
      "Practice good field sanitation"
    ],
    severity: 'high'
  },
  "maize stem borer": {
    treatment: [
      "Apply systemic insecticide early in the season",
      "Cut and destroy infected stems",
      "Use biological control with parasitic wasps"
    ],
    prevention: [
      "Plant early to avoid peak borer activity",
      "Remove crop residues after harvest",
      "Use resistant varieties when available",
      "Implement push-pull farming techniques"
    ],
    severity: 'high'
  },
  "Healthy": {
    treatment: [
      "Continue current care practices",
      "Monitor regularly for any changes",
      "Maintain proper nutrition and watering"
    ],
    prevention: [
      "Continue regular monitoring",
      "Maintain good agricultural practices",
      "Ensure proper nutrition and water management",
      "Practice crop rotation"
    ],
    severity: 'low'
  }
};

export const getLocalRecommendations = (diseaseName: string, confidence: number): string => {
  // Handle special cases
  if (diseaseName === "Low_Confidence") {
    return "The image is unclear. Please try uploading a clearer or brighter picture of the maize leaf for accurate diagnosis.";
  }
  
  if (diseaseName === "Unknown" || diseaseName === "Analysis_Failed") {
    return "The model cannot identify this disease. Please try uploading a clearer image of the affected plant area, or consult with an agricultural expert for detailed analysis.";
  }
  
  // Get recommendations for known diseases
  const recommendations = diseaseRecommendations[diseaseName];
  
  if (!recommendations) {
    return "This disease is not in our database. Please consult with a local agricultural expert for specific treatment recommendations.";
  }
  
  // Format recommendations
  let result = `**Disease:** ${diseaseName}\n**Confidence:** ${confidence.toFixed(1)}%\n**Severity:** ${recommendations.severity.toUpperCase()}\n\n`;
  
  result += "**Immediate Treatment:**\n";
  recommendations.treatment.forEach((treatment, index) => {
    result += `${index + 1}. ${treatment}\n`;
  });
  
  result += "\n**Prevention for Future:**\n";
  recommendations.prevention.forEach((prevention, index) => {
    result += `${index + 1}. ${prevention}\n`;
  });
  
  if (recommendations.severity === 'high') {
    result += "\n⚠️ **Warning:** This is a serious condition that requires immediate attention to prevent crop loss.";
  }
  
  return result;
};
