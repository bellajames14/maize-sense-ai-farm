
import { useState, useEffect, useRef } from "react";
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
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [isServiceDown, setIsServiceDown] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { translate, language } = usePreferences();
  const isMobile = useIsMobile();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevLanguageRef = useRef(language);

  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Only reset chat history when language changes and there's existing chat history
  useEffect(() => {
    if (prevLanguageRef.current !== language && chatHistory.length > 0) {
      setChatHistory([]);
      toast({
        title: translate("Language Changed"),
        description: translate("Chat has been reset due to language change"),
      });
    }
    prevLanguageRef.current = language;
  }, [language, toast, translate, chatHistory.length]);

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!message.trim()) return;
    
    const userMessage = message.trim();
    setMessage("");
    
    // Add user message to chat history
    setChatHistory((prev) => [...prev, { content: userMessage, isUser: true }]);
    setIsProcessing(true);
    setIsServiceDown(false); // Reset service status on new message attempt
    
    try {
      console.log(`Sending message to AI in ${language} language: "${userMessage}"`);
      
      // Add a timeout to ensure the UI updates before making the request
      setTimeout(async () => {
        try {
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
            
            // Check specifically for service unavailable errors
            if (response.data.errorDetails && response.data.errorDetails.includes("UNAVAILABLE")) {
              setIsServiceDown(true);
              throw new Error("AI service is currently unavailable");
            } else {
              throw new Error(response.data.error);
            }
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
          
          // Different toast message based on error type
          toast({
            title: translate("Error"),
            description: isServiceDown ? 
              translate("AI service is currently unavailable") : 
              errorMessage,
            variant: "destructive",
          });
          
          // Add appropriate error message to chat
          setChatHistory((prev) => [...prev, { 
            content: isServiceDown ? 
              translate("Sorry, the AI service is currently unavailable. Please try again later.") : 
              translate("Sorry, I couldn't process your request. Please try again later."), 
            isUser: false 
          }]);
        } finally {
          setIsProcessing(false);
        }
      }, 100);
    } catch (error: any) {
      console.error("Initial error:", error);
      setIsProcessing(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  // If the service is down, show a more prominent message
  const renderChatContent = () => {
    if (chatHistory.length === 0) {
      return <WelcomeMessage onSuggestionClick={handleSuggestionClick} />;
    }
    
    return chatHistory.map((msg, index) => (
      <ChatMessage key={index} content={msg.content} isUser={msg.isUser} />
    ));
  };

  return (
    <div className="container mx-auto p-2 sm:p-4">
      <Card className="w-full max-w-4xl mx-auto border-2 border-primary/20">
        <CardHeader className="bg-muted/30">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {translate("aiAssistant")}
          </CardTitle>
          <CardDescription>{translate("Ask the AI assistant about maize farming")}</CardDescription>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 pt-4 sm:pt-6">
          <div 
            ref={chatContainerRef}
            className="space-y-4 sm:space-y-6 mb-4 sm:mb-6 max-h-[calc(100vh-350px)] overflow-auto p-2 rounded-lg"
            style={{ height: isMobile ? '300px' : 'auto', minHeight: '250px' }}
          >
            {renderChatContent()}
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
        <CardFooter className="text-xs sm:text-sm text-muted-foreground bg-muted/30 border-t">
          {isServiceDown ? 
            <span className="text-amber-600">{translate("The AI service is temporarily unavailable")}</span> : 
            translate("The AI assistant uses machine learning to provide farming advice")
          }
        </CardFooter>
      </Card>
    </div>
  );
};
