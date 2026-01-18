import React, { createContext, useContext } from "react";
import { useDesignSettings, DesignSettings } from "@/hooks/useDesignSettings";

interface DesignContextType {
  settings: DesignSettings;
  isLoading: boolean;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export function DesignProvider({ children }: { children: React.ReactNode }) {
  const { settings, isLoading } = useDesignSettings();

  return (
    <DesignContext.Provider value={{ settings, isLoading }}>
      {children}
    </DesignContext.Provider>
  );
}

export function useDesignContext() {
  const context = useContext(DesignContext);
  if (!context) {
    throw new Error("useDesignContext must be used within a DesignProvider");
  }
  return context;
}
