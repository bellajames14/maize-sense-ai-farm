
import { FC, FormEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { usePreferences } from "@/hooks/usePreferences";

type ChatInputProps = {
  message: string;
  setMessage: (message: string) => void;
  onSendMessage: (event: FormEvent) => void;
  isProcessing: boolean;
};

export const ChatInput: FC<ChatInputProps> = ({ 
  message, 
  setMessage, 
  onSendMessage, 
  isProcessing 
}) => {
  const { translate } = usePreferences();

  return (
    <form onSubmit={onSendMessage} className="space-y-4">
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
                onSendMessage(e);
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
  );
};
