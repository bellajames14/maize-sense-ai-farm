
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePreferences } from "@/hooks/usePreferences";

type ChatMessage = {
  content: string;
  isUser: boolean;
};

export function AIAssistant() {
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
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
      console.log(`Sending message to AI in ${language} language`);
      
      const response = await supabase.functions.invoke('chat-with-ai', {
        body: { 
          message: userMessage,
          userId: user?.id || null, // Handle cases where user might not be logged in
          previousMessages: chatHistory.slice(-5), // Send last 5 messages for context
          language: language // Send the current language preference
        }
      });
      
      // Check if response has any errors
      if (response.error) {
        console.error("Supabase function error:", response.error);
        throw new Error(response.error.message || "Error processing request");
      }
      
      // Check if the response data is valid
      if (!response.data || !response.data.response) {
        console.error("Invalid response format:", response.data);
        throw new Error("Invalid response from AI assistant");
      }
      
      console.log("AI response received:", response.data);
      
      // Add AI response to chat history
      setChatHistory((prev) => [...prev, { content: response.data.response, isUser: false }]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: translate("Error"),
        description: typeof error === "string" ? error : translate("Failed to process your request"),
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

  // Example message suggestions based on language
  const getMessageSuggestions = () => {
    if (language === "english") {
      return [
        "How do I identify maize diseases?",
        "When is the best time to plant maize?",
        "How can I protect my crops from pests?",
        "What fertilizer is best for maize farming?"
      ];
    } else {
      return [
        "Bawo ni mo ṣe le ṣe idamo arun agbado?",
        "Igba wo ni o dara julọ lati gbin agbado?",
        "Bawo ni mo ṣe le daabo bo awọn ọka mi lowo kokoro?", 
        "Eyi tani ilẹ̀ àjèjì ti o dara julọ fun irugbin agbado?"
      ];
    }
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
              <div className="text-center p-8 bg-muted/20 rounded-lg">
                <MessageCircle className="h-10 w-10 mx-auto mb-2 text-primary/60" />
                <p className="text-muted-foreground">
                  {translate("Start a conversation with the AI assistant")}
                </p>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">{translate("Try asking")}:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {getMessageSuggestions().map((suggestion, index) => (
                      <Button 
                        key={index}
                        variant="outline" 
                        className="text-xs text-left justify-start h-auto py-2 border-dashed"
                        onClick={() => {
                          setMessage(suggestion);
                        }}
                      >
                        "{suggestion}"
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    msg.isUser
                      ? "bg-primary text-primary-foreground ml-12 shadow-sm"
                      : "bg-muted text-foreground mr-12 shadow border border-border/30"
                  }`}
                >
                  <div className="flex items-center mb-1 text-xs opacity-80">
                    {msg.isUser ? translate("You") : translate("AI Assistant")}
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>
              ))
            )}
            {isProcessing && (
              <div className="flex items-center justify-center space-x-2 p-4 rounded-lg bg-muted mr-12 shadow border border-border/30">
                <div className="flex items-center mb-1 text-xs opacity-80 mr-2">
                  {translate("AI Assistant")}
                </div>
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm text-muted-foreground">{translate("waitingForResponse")}</p>
              </div>
            )}
          </div>
          <form onSubmit={sendMessage} className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder={translate("askMaizeQuestion")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px] pr-12 resize-none border-2"
                disabled={isProcessing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (message.trim()) {
                      sendMessage(e);
                    }
                  }
                }}
              />
              <Button 
                type="submit" 
                size="icon"
                className="absolute bottom-2 right-2 rounded-full h-8 w-8" 
                disabled={isProcessing || !message.trim()}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground bg-muted/30 border-t">
          {translate("The AI assistant uses machine learning to provide farming advice")}
        </CardFooter>
      </Card>
    </div>
  );
}
