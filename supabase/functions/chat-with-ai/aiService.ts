
import { GEMINI_API_KEY } from "./config.ts";
import { cleanTextForFarmers } from "./textUtils.ts";
import { systemPrompts } from "./prompts.ts";

type ChatMessage = {
  content: string;
  isUser: boolean;
};

type ConversationMessage = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};

export async function generateAIResponse(
  message: string,
  previousMessages: ChatMessage[] = [],
  language: string = "english"
): Promise<string> {
  // Choose the appropriate system prompt based on language
  const systemPrompt = systemPrompts[language] || systemPrompts.english;

  // Format conversation history for the AI model
  const formattedPreviousMessages = previousMessages.map(msg => ({
    role: msg.isUser ? "user" : "model",
    parts: [{ text: msg.content }]
  }));

  // Add system prompt as the first message
  const conversationHistory = [
    {
      role: "model",
      parts: [{ text: systemPrompt }]
    },
    ...formattedPreviousMessages,
    {
      role: "user",
      parts: [{ text: message }]
    }
  ] as ConversationMessage[];

  console.log("Calling Gemini API with language:", language);
  
  // Create proper request body for Gemini model
  const requestBody = {
    contents: conversationHistory,
    generationConfig: {
      temperature: 0.6, // Lowered temperature for more straightforward responses
      maxOutputTokens: 800,
    }
  };
  
  // Call Google's Gemini API
  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();
    console.error("Gemini API error response:", errorText);
    throw new Error(`Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText} - ${errorText}`);
  }

  const responseData = await geminiResponse.json();
  
  if (responseData.candidates && 
      responseData.candidates.length > 0 && 
      responseData.candidates[0].content && 
      responseData.candidates[0].content.parts && 
      responseData.candidates[0].content.parts.length > 0) {
    // Get raw response then clean it for farmers
    const rawResponse = responseData.candidates[0].content.parts[0].text;
    return cleanTextForFarmers(rawResponse);
  } else {
    console.error("Unexpected response format:", JSON.stringify(responseData));
    throw new Error("Unexpected response format from Gemini API");
  }
}
