
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
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
      const response = await supabase.functions.invoke('chat-with-ai', {
        body: { 
          message: userMessage,
          userId: user?.id,
          previousMessages: chatHistory.slice(-5), // Send last 5 messages for context
          language: language // Send the current language preference
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message || "Error processing request");
      }
      
      // Add AI response to chat history
      setChatHistory((prev) => [...prev, { content: response.data.response, isUser: false }]);
    } catch (error) {
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

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{translate("aiAssistant")}</CardTitle>
          <CardDescription>{translate("Ask the AI assistant about maize farming")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4 max-h-[calc(100vh-350px)] overflow-auto p-2">
            {chatHistory.length === 0 ? (
              <p className="text-center text-muted-foreground italic">
                {translate("Start a conversation with the AI assistant")}
              </p>
            ) : (
              chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    msg.isUser
                      ? "bg-primary text-primary-foreground ml-12"
                      : "bg-muted text-muted-foreground mr-12"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))
            )}
            {isProcessing && (
              <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>{translate("waitingForResponse")}</p>
              </div>
            )}
          </div>
          <form onSubmit={sendMessage} className="space-y-2">
            <Textarea
              placeholder={translate("askMaizeQuestion")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
              disabled={isProcessing}
            />
            <Button type="submit" className="w-full" disabled={isProcessing || !message.trim()}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translate("Processing")}...
                </>
              ) : (
                translate("send")
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          {translate("The AI assistant uses machine learning to provide farming advice")}
        </CardFooter>
      </Card>
    </div>
  );
}
