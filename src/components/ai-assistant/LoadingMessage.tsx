
import { FC } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import { Loader2 } from "lucide-react";

export const LoadingMessage: FC = () => {
  const { translate } = usePreferences();
  
  return (
    <div className="flex items-center justify-center space-x-2 p-4 rounded-lg bg-muted mr-12 shadow border border-border/30">
      <div className="flex items-center mb-1 text-xs opacity-80 mr-2">
        {translate("AI Assistant")}
      </div>
      <Loader2 className="h-4 w-4 animate-spin" />
      <p className="text-sm text-muted-foreground">{translate("waitingForResponse")}</p>
    </div>
  );
};
