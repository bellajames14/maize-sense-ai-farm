
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ImageUploaderProps {
  selectedFile: File | null;
  previewUrl: string | null;
  isAnalyzing: boolean;
  uploadProgress: number;
  onFileChange: (file: File | null) => void;
  onAnalyze: () => Promise<void>;
  onReset: () => void;
}

export const ImageUploader = ({
  selectedFile,
  previewUrl,
  isAnalyzing,
  uploadProgress,
  onFileChange,
  onAnalyze,
  onReset,
}: ImageUploaderProps) => {
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      onFileChange(file);
      const fileReader = new FileReader();
      fileReader.onload = () => {
        // The parent component will handle setting the preview URL
      };
      fileReader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px]">
        {previewUrl ? (
          <div className="w-full flex flex-col items-center">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="max-w-full max-h-[300px] object-contain rounded-lg"
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-4"
              onClick={onReset}
            >
              Change image
            </Button>
          </div>
        ) : (
          <>
            <ImageIcon className="h-10 w-10 text-muted-foreground mb-4" />
            <Label
              htmlFor="image-upload"
              className="text-sm text-muted-foreground text-center cursor-pointer"
            >
              <span className="font-medium">Click to upload</span> or drag and drop
              <br />
              JPG, PNG or WEBP (max. 5MB)
            </Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/jpeg, image/png, image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}
      </div>
      <Button 
        className="w-full bg-green-700 hover:bg-green-800"
        onClick={onAnalyze}
        disabled={!selectedFile || isAnalyzing}
      >
        {isAnalyzing ? (
          <>
            <span className="mr-2">Analyzing...</span>
            <Progress value={uploadProgress} className="w-1/3 h-2" />
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Analyze Image
          </>
        )}
      </Button>
    </div>
  );
};
