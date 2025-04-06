
import { FC } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import { AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ErrorDisplayProps = {
  errorDetails: string | null;
  showErrorDialog: boolean;
  setShowErrorDialog: (show: boolean) => void;
};

export const ErrorDisplay: FC<ErrorDisplayProps> = ({ 
  errorDetails, 
  showErrorDialog, 
  setShowErrorDialog 
}) => {
  const { translate } = usePreferences();

  if (!errorDetails) return null;

  return (
    <>
      <div className="mt-4 p-2 border border-destructive/40 bg-destructive/10 rounded-md">
        <div 
          className="flex items-center gap-2 text-sm text-destructive cursor-pointer" 
          onClick={() => setShowErrorDialog(true)}
        >
          <AlertCircle className="h-4 w-4" />
          <span>{translate("Error occurred")} - {translate("Click to see details")}</span>
        </div>
      </div>

      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translate("Error Details")}</DialogTitle>
          </DialogHeader>
          <div className="bg-muted/20 p-4 rounded-md overflow-auto max-h-[400px]">
            <pre className="text-xs">{errorDetails}</pre>
          </div>
          <Button onClick={() => setShowErrorDialog(false)}>{translate("Close")}</Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
