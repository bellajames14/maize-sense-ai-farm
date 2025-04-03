
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Mic, MicOff } from "lucide-react";

type Message = {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
};

export const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! I'm your AI farming assistant. How can I help you with your maize crop today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState("english");
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response - in production, this would be an API call to a model like Gemini
    setTimeout(() => {
      const responses: Record<string, string> = {
        "How do I identify northern corn leaf blight?": "Northern Corn Leaf Blight appears as long, narrow tan lesions on maize leaves, typically 1-6 inches in length. The lesions are parallel to the leaf margins and may have dark borders. In humid conditions, the lesions may develop dark gray or black spores. Early symptoms include small, pale green to tan spots on the leaves. The disease typically starts on lower leaves and moves upward as it progresses.",
        "What is the best fertilizer for maize?": "The best fertilizer for maize typically includes a balanced NPK (Nitrogen, Phosphorus, Potassium) ratio, with emphasis on nitrogen. A common recommendation is NPK 15-15-15 as a basal application, followed by nitrogen-rich top dressing (like urea) during the growing stage. The specific amounts depend on your soil quality and previous crop history. Conduct a soil test for the most accurate recommendations for your farm.",
        "When should I harvest my maize?": "Maize is typically ready for harvest when the kernels have reached the 'black layer' stage, which indicates physiological maturity. The husks will be dry and brown, and kernels will be hard and glossy. When pressed with your thumbnail, mature kernels won't dent. For grain, moisture content should be around 15-20%. This usually occurs about 7-8 weeks after silking, depending on variety and growing conditions.",
      };

      // Check if we have a canned response for this query
      let responseText = responses[input.trim()];
      
      // If no canned response, provide a generic one
      if (!responseText) {
        responseText = "Thank you for your question about maize farming. While I don't have specific information about that query, I recommend monitoring your crops regularly, ensuring proper irrigation, and following recommended fertilization schedules for your region. If you're seeing concerning symptoms, consider uploading images through our disease detection tool for a more accurate assessment.";
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseText,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleListening = () => {
    // In a real implementation, this would connect to the device's microphone
    // and use speech recognition
    setIsListening(!isListening);
    if (!isListening) {
      // Mock voice recognition - would be replaced with actual speech recognition
      setTimeout(() => {
        setInput("How do I identify northern corn leaf blight?");
        setIsListening(false);
      }, 2000);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>AI Farming Assistant</CardTitle>
            <CardDescription>
              Ask questions about maize farming in your preferred language
            </CardDescription>
          </div>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="yoruba">Yoruba</SelectItem>
              <SelectItem value="igbo">Igbo</SelectItem>
              <SelectItem value="hausa">Hausa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-[420px] pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-[80%] ${
                    message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full ${
                      message.sender === "user" ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    {message.sender === "user" ? (
                      <User className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg px-4 py-3 text-sm ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[80%]">
                  <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-muted">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-lg px-4 py-3 text-sm bg-muted flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex w-full items-center space-x-2"
        >
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={toggleListening}
            className={isListening ? "bg-red-100" : ""}
          >
            {isListening ? (
              <MicOff className="h-4 w-4 text-red-500" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle voice input</span>
          </Button>
          <Input
            type="text"
            placeholder="Type your question here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon"
            className="bg-leaf-700 hover:bg-leaf-800"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};
