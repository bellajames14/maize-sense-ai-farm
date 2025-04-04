
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/contexts/PreferencesContext";

type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
};

export const AIAssistant = () => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { translate, language } = usePreferences();

  // Function to add a new message to the chat history
  const addMessage = (content: string, isUser: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser,
      timestamp: new Date(),
    };
    setChatHistory((prevHistory) => [...prevHistory, newMessage]);
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    addMessage(message, true);
    setIsLoading(true);
    
    const userMessage = message;
    setMessage(""); // Clear input field
    
    try {
      // Format the chat history for the backend
      const historyForBackend = chatHistory.map(msg => ({
        content: msg.content,
        isUser: msg.isUser,
      }));
      
      // Send the message to your AI backend
      const response = await fetch("https://sfsdfdcdethqjwtjrwpz.functions.supabase.co/chat-with-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          userId: user?.id,
          previousMessages: historyForBackend,
          language: language // Pass the selected language to the backend
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get AI response");
      }
      
      const data = await response.json();
      addMessage(data.response, false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press in the input field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Automatically scroll to the latest message
  useEffect(() => {
    const scrollArea = document.querySelector(".chat-scroll-area");
    if (scrollArea) {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <Card className="flex flex-col h-[80vh]">
      <CardHeader className="px-6">
        <CardTitle>{translate("aiAssistant")}</CardTitle>
        <CardDescription>
          {language === "english" 
            ? "Ask questions about maize/corn farming to get personalized advice" 
            : "Beere awọn ibeere nipa irugbin agbado lati gba imọran adinipada"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="chat-scroll-area h-full px-6 pt-0 pb-3">
          {chatHistory.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <p>{language === "english" 
                  ? "Start a conversation with our AI Assistant" 
                  : "Bẹrẹ ibaraenisoro pẹlu Alawusa AI wa"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex max-w-[80%] ${
                      msg.isUser ? "flex-row-reverse" : "flex-row"
                    } items-start gap-2`}
                  >
                    <Avatar className={msg.isUser ? "bg-primary" : "bg-leaf-600"}>
                      {msg.isUser ? (
                        <>
                          <AvatarFallback>
                            {user?.email?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                          <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.email?.charAt(0) || "U"}`} />
                        </>
                      ) : (
                        <AvatarFallback>
                          <img src="/placeholder.svg" alt="AI" className="h-10 w-10" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div
                      className={`rounded-lg px-4 py-3 text-sm ${
                        msg.isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.content.split("\n").map((line, i) => (
                        <p key={i}>{line || <br />}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2">
                    <Avatar className="bg-leaf-600">
                      <AvatarFallback>
                        <img src="/placeholder.svg" alt="AI" className="h-10 w-10" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg bg-muted px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{translate("waitingForResponse")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="px-6 py-4 border-t">
        <div className="flex w-full items-center space-x-2">
          <Input
            placeholder={translate("askMaizeQuestion")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span className="sr-only">{translate("send")}</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
