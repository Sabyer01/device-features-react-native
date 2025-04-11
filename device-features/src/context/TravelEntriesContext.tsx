import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TravelEntry {
  id: string;
  title: string;
  imageUri: string;
  address: string;
  description: string;
  timestamp: string;
}

interface TravelEntriesContextType {
  entries: TravelEntry[];
  refreshEntries: () => Promise<void>;
}

const TravelEntriesContext = createContext<TravelEntriesContextType | undefined>(undefined);

export function TravelEntriesProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<TravelEntry[]>([]);

  const refreshEntries = async () => {
    try {
      const storedEntries = await AsyncStorage.getItem('travelEntries');
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  useEffect(() => {
    refreshEntries();
  }, []);

  return (
    <TravelEntriesContext.Provider value={{ entries, refreshEntries }}>
      {children}
    </TravelEntriesContext.Provider>
  );
}

export function useTravelEntries() {
  const context = useContext(TravelEntriesContext);
  if (context === undefined) {
    throw new Error('useTravelEntries must be used within a TravelEntriesProvider');
  }
  return context;
} 