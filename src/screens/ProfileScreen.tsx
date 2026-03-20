import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from '../../App';
import { CravrButton } from '../components/UI';
import { useAppState } from '../state/AppStateContext';
import { getLocationWithUserConsent } from '../services/locationService';
import { logout } from '../services/firebaseClient';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function ProfileScreen({ navigation }: Props) {
  const { state, setState } = useAppState();
  const [updatingLocation, setUpdatingLocation] = useState(false);

  const name = state.userProfile?.name || 'User';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const handleUpdateLocation = async () => {
    try {
      setUpdatingLocation(true);
      const location = await getLocationWithUserConsent();
      if (location) {
        setState((prev) => ({ ...prev, location }));
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to update location:', e);
    } finally {
      setUpdatingLocation(false);
    }
  };

  const handleReRunOnboarding = () => {
    setState((prev) => ({
      ...prev,
      onboardingComplete: false
    }));
    navigation.navigate('OnboardingWelcome');
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            setState((prev) => ({
              ...prev,
              isAuthenticated: false,
              authUser: undefined,
              onboardingComplete: false,
              userProfile: undefined
            }));
            navigation.navigate('Login');
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar and name */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
        </View>

        {/* Food Preferences */}
        {(state.userProfile?.favoriteCuisine || state.userProfile?.favoriteFood) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🍽️ Food Preferences</Text>
            <View style={styles.preferencesCard}>
              {state.userProfile?.favoriteCuisine && (
                <View style={styles.preferenceRow}>
                  <Text style={styles.preferenceLabel}>Favorite Cuisine:</Text>
                  <Text style={styles.preferenceValue}>{state.userProfile.favoriteCuisine}</Text>
                </View>
              )}
              {state.userProfile?.favoriteFood && (
                <View style={styles.preferenceRow}>
                  <Text style={styles.preferenceLabel}>Favorite Food:</Text>
                  <Text style={styles.preferenceValue}>{state.userProfile.favoriteFood}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Location</Text>
          <View style={styles.locationCard}>
            {state.location?.address ? (
              <>
                <Text style={styles.locationAddress}>{state.location.address}</Text>
                <Text style={styles.coordinatesText}>
                  {state.location.latitude.toFixed(4)}, {state.location.longitude.toFixed(4)}
                </Text>
              </>
            ) : (
              <Text style={styles.noLocationText}>No location set</Text>
            )}
          </View>
          <CravrButton
            label={updatingLocation ? 'Updating...' : 'Update Location'}
            onPress={handleUpdateLocation}
            variant="secondary"
            loading={updatingLocation}
          />
        </View>

        {/* Onboarding */}
        <View style={styles.section}>
          <CravrButton label="Re-run Onboarding" onPress={handleReRunOnboarding} />
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <CravrButton
            label="Sign Out"
            onPress={handleLogout}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F3'
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 40
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#161616'
  },
  section: {
    marginBottom: 32
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161616',
    marginBottom: 12
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: '#161616',
    marginBottom: 4
  },
  coordinatesText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500'
  },
  noLocationText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic'
  },
  preferencesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  preferenceRow: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B6B6B'
  },
  preferenceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6A2A'
  }
});
