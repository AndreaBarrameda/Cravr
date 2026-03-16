import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getLocationWithUserConsent } from '../services/locationService';

type CravingStruct = {
  craving_id: string;
  normalized: string;
  tags: string[];
  suggested_cuisines: { slug: string; name: string; score: number }[];
};

type LocationData = {
  latitude: number;
  longitude: number;
  address?: string;
};

type AppState = {
  location?: LocationData;
  craving?: CravingStruct;
  selectedCuisine?: string;
  selectedRestaurantId?: string;
  selectedDishId?: string;
  soloSessionId?: string;
  matchId?: string;
  reservationId?: string;
  onboardingComplete?: boolean;
  preferences?: string[];
  userProfile?: { name: string };
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

  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const location = await getLocationWithUserConsent();
        // eslint-disable-next-line no-console
        console.log('📍 Location initialized in AppStateContext:', location);
        if (location) {
          setState((prev) => ({ ...prev, location }));
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize location:', error);
      }
    };

    initializeLocation();
  }, []);

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

