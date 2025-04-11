import React, { createContext, useContext, useState } from 'react';

interface EntryCountContextType {
  count: number;
  setCount: (count: number) => void;
}

const EntryCountContext = createContext<EntryCountContextType>({
  count: 0,
  setCount: () => {},
});

export const useEntryCount = () => useContext(EntryCountContext);

export const EntryCountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [count, setCount] = useState(0);

  return (
    <EntryCountContext.Provider value={{ count, setCount }}>
      {children}
    </EntryCountContext.Provider>
  );
}; 