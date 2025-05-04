
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface LocationSearchProps {
  location: string;
  setLocation: (location: string) => void;
  onSearch: () => void;
  isLoading: boolean;
}

export const LocationSearch = ({ 
  location, 
  setLocation, 
  onSearch, 
  isLoading 
}: LocationSearchProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="location">Farm Location</Label>
      <div className="flex gap-2 flex-col sm:flex-row">
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter city or coordinates"
          className="w-full sm:w-auto flex-grow"
        />
        <Button onClick={onSearch} disabled={isLoading} className="ml-0 sm:ml-2">
          Update
        </Button>
      </div>
    </div>
  );
};
