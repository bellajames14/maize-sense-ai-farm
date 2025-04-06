
import { FC } from "react";
import { usePreferences } from "@/hooks/usePreferences";

type ChatMessageProps = {
  content: string;
  isUser: boolean;
  isLoading?: boolean;
};

export const ChatMessage: FC<ChatMessageProps> = ({ content, isUser, isLoading = false }) => {
  const { translate } = usePreferences();

  return (
    <div
      className={`p-4 rounded-lg ${
        isUser
          ? "bg-primary text-primary-foreground ml-12 shadow-sm"
          : "bg-muted text-foreground mr-12 shadow border border-border/30"
      }`}
    >
      <div className="flex items-center mb-1 text-xs opacity-80">
        {isUser ? translate("You") : translate("AI Assistant")}
      </div>
      <p className="whitespace-pre-wrap text-sm">{content}</p>
    </div>
  );
};
