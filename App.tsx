import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
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
import { AppStateProvider } from './src/state/AppStateContext';

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

export default function App() {
  return (
    <AppStateProvider>
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
    </AppStateProvider>
  );
}

