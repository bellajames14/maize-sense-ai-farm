
import { FC } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

type WelcomeMessageProps = {
  onSuggestionClick: (suggestion: string) => void;
};

export const WelcomeMessage: FC<WelcomeMessageProps> = ({ onSuggestionClick }) => {
  const { translate, language } = usePreferences();

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
              onClick={() => onSuggestionClick(suggestion)}
            >
              "{suggestion}"
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
