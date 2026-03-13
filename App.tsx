import React, { useEffect, useState } from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SplashCravingScreen } from './src/screens/SplashCravingScreen';
import { CuisineSelectionScreen } from './src/screens/CuisineSelectionScreen';
import { RestaurantDiscoveryScreen } from './src/screens/RestaurantDiscoveryScreen';
import { RestaurantDetailScreen } from './src/screens/RestaurantDetailScreen';
import { SoloCheckScreen } from './src/screens/SoloCheckScreen';
import { CraveConnectScreen } from './src/screens/CraveConnectScreen';
import { MatchSuccessScreen } from './src/screens/MatchSuccessScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ReservationScreen } from './src/screens/ReservationScreen';
import { ConfirmationScreen } from './src/screens/ConfirmationScreen';
import { AppStateProvider, useAppState } from './src/state/AppStateContext';
import { LocationPermissionModal } from './src/components/LocationPermissionModal';
import { getLocationWithUserConsent } from './src/services/locationService';

export type RootStackParamList = {
  SplashCraving: undefined;
  CuisineSelection: { cravingId: string };
  RestaurantDiscovery: { cravingId: string; cuisine: string };
  RestaurantDetail: { restaurantId: string; cravingId: string; cuisine: string };
  SoloCheck: {
    restaurantId: string;
    dishId?: string;
    cravingId: string;
    cuisine: string;
  };
  CraveConnect: {
    soloSessionId: string;
  };
  MatchSuccess: { matchId: string };
  Chat: { matchId: string };
  Reservation: {
    restaurantId: string;
    dishId?: string;
    diningMode: 'solo' | 'group' | 'crave_connect';
    matchId?: string;
  };
  Confirmation: { reservationId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const [locationModalVisible, setLocationModalVisible] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const { setState } = useAppState();

  useEffect(() => {
    // Initialize location on app start
    const initializeLocation = async () => {
      const location = await getLocationWithUserConsent(async () => {
        return new Promise<boolean>((resolve) => {
          // The modal is handled by React state, so we resolve when user taps Allow/Not Now
          // This callback will be called after the modal decision
          const checkUserChoice = setInterval(() => {
            // This is handled by the modal callbacks
            clearInterval(checkUserChoice);
          }, 100);
        });
      });

      if (location) {
        setState((prev) => ({
          ...prev,
          location
        }));
      }

      setAppReady(true);
      setLocationModalVisible(false);
    };

    // Auto-hide modal after initial permission is checked
    setTimeout(() => {
      if (!appReady) {
        setLocationModalVisible(false);
        initializeLocation();
      }
    }, 500);
  }, []);

  const handleLocationAllow = async () => {
    setLocationModalVisible(false);
    const location = await getLocationWithUserConsent();

    if (location) {
      setState((prev) => ({
        ...prev,
        location
      }));
    }

    setAppReady(true);
  };

  const handleLocationDeny = () => {
    setLocationModalVisible(false);
    // App continues without location
    setAppReady(true);
  };

  if (!appReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFF8F3' }}>
        <LocationPermissionModal
          visible={locationModalVisible}
          onAllow={handleLocationAllow}
          onDeny={handleLocationDeny}
        />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          initialRouteName="SplashCraving"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FFF8F3' }
          }}
        >
          <Stack.Screen name="SplashCraving" component={SplashCravingScreen} />
          <Stack.Screen name="CuisineSelection" component={CuisineSelectionScreen} />
          <Stack.Screen name="RestaurantDiscovery" component={RestaurantDiscoveryScreen} />
          <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
          <Stack.Screen name="SoloCheck" component={SoloCheckScreen} />
          <Stack.Screen name="CraveConnect" component={CraveConnectScreen} />
          <Stack.Screen name="MatchSuccess" component={MatchSuccessScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Reservation" component={ReservationScreen} />
          <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}

