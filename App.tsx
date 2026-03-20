import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { tokens } from './src/theme/tokens';
import { HomeIcon, DiscoverIcon, TrendingIcon, ProfileIcon } from './src/components/Icons';
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
import { OnboardingWelcomeScreen } from './src/screens/OnboardingWelcomeScreen';
import { OnboardingProfileScreen } from './src/screens/OnboardingProfileScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { DiscoverScreen } from './src/screens/DiscoverScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { DishDiscoveryScreen } from './src/screens/DishDiscoveryScreen';
import { TrendingScreen } from './src/screens/TrendingScreen';
import { TrendingFeedScreen } from './src/screens/TrendingFeedScreen';
import { AppStateProvider, useAppState } from './src/state/AppStateContext';

export type TabParamList = {
  Home: undefined;
  Discover: undefined;
  Trending: undefined;
  Profile: undefined;
};

export type DiscoverStackParamList = {
  DiscoverHome: undefined;
  SplashCraving: undefined;
  CuisineSelection: { cravingId: string };
  RestaurantDiscovery: { cravingId: string; cravingText?: string; cuisine: string };
  RestaurantDetail: { restaurantId: string; cravingId: string; cuisine: string; dishId?: string };
  DishDiscovery: { cravingId: string; cuisine: string; attributes: { temperature: string | null; flavor: string | null; texture: string | null; intensity: string | null; occasion: string | null; budget: string | null }; craving_text?: string };
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

export type TrendingStackParamList = {
  TrendingHome: undefined;
  TrendingFeed: undefined;
  RestaurantDetail: { restaurantId: string; cravingId: string; cuisine: string; dishId?: string };
};

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  MainTabs: undefined;
  OnboardingWelcome: undefined;
  OnboardingProfile: undefined;
  SplashCraving: undefined;
  CuisineSelection: { cravingId: string };
  RestaurantDiscovery: { cravingId: string; cravingText?: string; cuisine: string };
  RestaurantDetail: { restaurantId: string; cravingId: string; cuisine: string; dishId?: string };
  DishDiscovery: { cravingId: string; cuisine: string; attributes: { temperature: string | null; flavor: string | null; texture: string | null; intensity: string | null; occasion: string | null; budget: string | null }; craving_text?: string };
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
const Tab = createBottomTabNavigator<TabParamList>();
const DiscoverStack = createNativeStackNavigator<DiscoverStackParamList>();
const TrendingStack = createNativeStackNavigator<TrendingStackParamList>();

function DiscoverStackNavigator() {
  return (
    <DiscoverStack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <DiscoverStack.Screen
        name="DiscoverHome"
        component={DiscoverScreen}
      />
      <DiscoverStack.Screen
        name="SplashCraving"
        component={SplashCravingScreen}
      />
      <DiscoverStack.Screen
        name="CuisineSelection"
        component={CuisineSelectionScreen}
      />
      <DiscoverStack.Screen
        name="RestaurantDiscovery"
        component={RestaurantDiscoveryScreen}
      />
      <DiscoverStack.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
      />
      <DiscoverStack.Screen
        name="DishDiscovery"
        component={DishDiscoveryScreen}
      />
      <DiscoverStack.Screen
        name="SoloCheck"
        component={SoloCheckScreen}
      />
      <DiscoverStack.Screen
        name="CraveConnect"
        component={CraveConnectScreen}
      />
      <DiscoverStack.Screen
        name="MatchSuccess"
        component={MatchSuccessScreen}
      />
      <DiscoverStack.Screen
        name="Chat"
        component={ChatScreen}
      />
      <DiscoverStack.Screen
        name="Reservation"
        component={ReservationScreen}
      />
      <DiscoverStack.Screen
        name="Confirmation"
        component={ConfirmationScreen}
      />
    </DiscoverStack.Navigator>
  );
}

function TrendingStackNavigator() {
  return (
    <TrendingStack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <TrendingStack.Screen
        name="TrendingHome"
        component={TrendingScreen}
      />
      <TrendingStack.Screen
        name="TrendingFeed"
        component={TrendingFeedScreen}
      />
      <TrendingStack.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
      />
    </TrendingStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.colors.primary,
        tabBarInactiveTintColor: tokens.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: tokens.colors.backgroundLight,
          borderTopWidth: 1,
          borderTopColor: tokens.colors.border,
          height: 64,
          paddingBottom: 12,
          paddingTop: 10,
          shadowColor: tokens.colors.textPrimary,
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
          elevation: 4
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 6,
          letterSpacing: 0.2
        }
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <HomeIcon color={color} size={focused ? 24 : 22} />
          )
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverStackNavigator}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <DiscoverIcon color={color} size={focused ? 24 : 22} />
          )
        }}
      />
      <Tab.Screen
        name="Trending"
        component={TrendingStackNavigator}
        options={{
          tabBarLabel: 'Trending',
          tabBarIcon: ({ color, focused }) => (
            <TrendingIcon color={color} size={focused ? 24 : 22} />
          )
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <ProfileIcon color={color} size={focused ? 24 : 22} />
          )
        }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { state } = useAppState();
  const navigationRef = React.useRef<any>(null);

  let initialRouteName: keyof RootStackParamList = 'Login';
  if (state.isAuthenticated) {
    initialRouteName = state.onboardingComplete ? 'MainTabs' : 'OnboardingWelcome';
  }

  React.useEffect(() => {
    // Reset navigation when auth state changes
    if (navigationRef.current) {
      if (state.isAuthenticated) {
        navigationRef.current.reset({
          index: 0,
          routes: [
            {
              name: state.onboardingComplete ? 'MainTabs' : 'OnboardingWelcome'
            }
          ]
        });
      } else {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Login' }]
        });
      }
    }
  }, [state.isAuthenticated, state.onboardingComplete]);

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: tokens.colors.background }
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
        <Stack.Screen name="OnboardingProfile" component={OnboardingProfileScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="SplashCraving" component={SplashCravingScreen} />
        <Stack.Screen name="CuisineSelection" component={CuisineSelectionScreen} />
        <Stack.Screen name="RestaurantDiscovery" component={RestaurantDiscoveryScreen} />
        <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
        <Stack.Screen name="DishDiscovery" component={DishDiscoveryScreen} />
        <Stack.Screen name="SoloCheck" component={SoloCheckScreen} />
        <Stack.Screen name="CraveConnect" component={CraveConnectScreen} />
        <Stack.Screen name="MatchSuccess" component={MatchSuccessScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Reservation" component={ReservationScreen} />
        <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}

