
import { useState } from 'react';

export const useFileHandler = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (file: File | null) => {
    if (file) {
      setSelectedFile(file);
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return {
    selectedFile,
    previewUrl,
    handleFileChange,
    handleReset
  };
};
