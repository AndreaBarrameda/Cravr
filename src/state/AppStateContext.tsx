import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getLocationWithUserConsent } from '../services/locationService';
import type { AuthUser } from '../services/supabaseClient';

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
  userProfile?: {
    name: string;
    bio?: string;
    favoriteCuisine?: string;
    favoriteFood?: string;
  };
  isAuthenticated?: boolean;
  authUser?: AuthUser;
  darkMode?: boolean;
};

type AppStateContextValue = {
  state: AppState;
  setState: (updater: (prev: AppState) => AppState) => void;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setInternalState] = useState<AppState>({
    isAuthenticated: false,
    onboardingComplete: false
  });

  const setState = (updater: (prev: AppState) => AppState) => {
    setInternalState((prev) => updater(prev));
  };

  useEffect(() => {
    // Initialize location
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

    // TODO: Re-enable auth listener after fixing Supabase rate limits
    // Set up auth listener
    // const unsubscribe = onAuthStateChange((user) => {
    //   if (user) {
    //     setState((prev) => ({
    //       ...prev,
    //       isAuthenticated: true,
    //       authUser: user,
    //       userProfile: { name: user.name || user.email }
    //     }));
    //   } else {
    //     setState((prev) => ({
    //       ...prev,
    //       isAuthenticated: false,
    //       authUser: undefined,
    //       onboardingComplete: false
    //     }));
    //   }
    // });

    // return () => {
    //   if (unsubscribe) {
    //     unsubscribe().catch(() => {
    //       // Ignore errors
    //     });
    //   }
    // };
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

