
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePreferences } from "@/hooks/usePreferences";
import { ChatMessage } from "./ChatMessage";
import { LoadingMessage } from "./LoadingMessage";
import { WelcomeMessage } from "./WelcomeMessage";
import { ChatInput } from "./ChatInput";
import { ErrorDisplay } from "./ErrorDisplay";

type ChatMessage = {
  content: string;
  isUser: boolean;
};

export function AIAssistant() {
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { translate, language } = usePreferences();

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!message.trim()) return;
    
    const userMessage = message.trim();
    setMessage("");
    
    // Add user message to chat history
    setChatHistory((prev) => [...prev, { content: userMessage, isUser: true }]);
    setIsProcessing(true);
    
    try {
      console.log(`Sending message to AI in ${language} language: "${userMessage}"`);
      
      const response = await supabase.functions.invoke('chat-with-ai', {
        body: { 
          message: userMessage,
          userId: user?.id || null,
          previousMessages: chatHistory.slice(-5), // Send last 5 messages for context
          language: language // Send the current language preference
        }
      });
      
      console.log("Raw response from chat-with-ai function:", response);
      
      // Check if response has any errors
      if (response.error) {
        console.error("Supabase function error:", response.error);
        throw new Error(response.error.message || "Error processing request");
      }
      
      // Check if the response data contains an error field
      if (response.data && response.data.error) {
        setErrorDetails(JSON.stringify(response.data, null, 2));
        throw new Error(response.data.error);
      }
      
      // Check if the response data is valid
      if (!response.data || !response.data.response) {
        console.error("Invalid response format:", response.data);
        setErrorDetails(JSON.stringify(response.data, null, 2));
        throw new Error("Invalid response from AI assistant");
      }
      
      console.log("AI response received:", response.data.response.substring(0, 50) + "...");
      
      // Add AI response to chat history
      setChatHistory((prev) => [...prev, { content: response.data.response, isUser: false }]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      
      let errorMessage = typeof error === "string" ? error : (error.message || translate("Failed to process your request"));
      
      setErrorDetails(JSON.stringify(error, null, 2));
      
      toast({
        title: translate("Error"),
        description: errorMessage,
        variant: "destructive",
      });
      
      // Add error message to chat
      setChatHistory((prev) => [...prev, { 
        content: translate("Sorry, I couldn't process your request. Please try again later."), 
        isUser: false 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto border-2 border-primary/20">
        <CardHeader className="bg-muted/30">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {translate("aiAssistant")}
          </CardTitle>
          <CardDescription>{translate("Ask the AI assistant about maize farming")}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-6">
          <div className="space-y-6 mb-6 max-h-[calc(100vh-350px)] overflow-auto p-2 rounded-lg">
            {chatHistory.length === 0 ? (
              <WelcomeMessage onSuggestionClick={handleSuggestionClick} />
            ) : (
              chatHistory.map((msg, index) => (
                <ChatMessage key={index} content={msg.content} isUser={msg.isUser} />
              ))
            )}
            {isProcessing && <LoadingMessage />}
          </div>
          <ChatInput 
            message={message}
            setMessage={setMessage}
            onSendMessage={sendMessage}
            isProcessing={isProcessing}
          />
          <ErrorDisplay 
            errorDetails={errorDetails} 
            showErrorDialog={showErrorDialog} 
            setShowErrorDialog={setShowErrorDialog} 
          />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground bg-muted/30 border-t">
          {translate("The AI assistant uses machine learning to provide farming advice")}
        </CardFooter>
      </Card>
    </div>
  );
}
