import React, { createContext, useContext, useState, ReactNode } from 'react';

type CravingStruct = {
  craving_id: string;
  normalized: string;
  tags: string[];
  suggested_cuisines: { slug: string; name: string; score: number }[];
};

type AppState = {
  craving?: CravingStruct;
  selectedCuisine?: string;
  selectedRestaurantId?: string;
  selectedDishId?: string;
  soloSessionId?: string;
  matchId?: string;
  reservationId?: string;
};

type AppStateContextValue = {
  state: AppState;
  setState: (updater: (prev: AppState) => AppState) => void;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setInternalState] = useState<AppState>({});

  const setState = (updater: (prev: AppState) => AppState) => {
    setInternalState((prev) => updater(prev));
  };

  return (
    <AppStateContext.Provider value={{ state, setState }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}

