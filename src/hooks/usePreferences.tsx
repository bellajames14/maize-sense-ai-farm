
import { useContext } from 'react';
import { PreferencesContext } from '@/contexts/PreferencesContext';
import { PreferencesContextType } from '@/types/preferences';

export const usePreferences = () => {
  const context = useContext(PreferencesContext) as PreferencesContextType;
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
};
