import React, { createContext, useContext, ReactNode } from 'react';
import { Group } from 'three';

interface ModelContextType {
  selectedModel: Group | null;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const useModel = () => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
};

interface ModelProviderProps {
  selectedModel: Group | null;
  children: ReactNode;
}

export const ModelProvider: React.FC<ModelProviderProps> = ({
  selectedModel,
  children,
}) => {
  return (
    <ModelContext.Provider value={{ selectedModel }}>
      {children} {/* Render children here */}
    </ModelContext.Provider>
  );
};
