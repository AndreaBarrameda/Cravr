import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from '../../App';
import { CravrButton } from '../components/UI';
import { useAppState } from '../state/AppStateContext';
import { getLocationWithUserConsent } from '../services/locationService';
import { logout } from '../services/firebaseClient';
import { tokens } from '../theme/tokens';

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
        {/* Logo and Avatar and name */}
        <View style={styles.profileHeader}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.profileLogo}
            resizeMode="contain"
          />
          <LinearGradient
            colors={[tokens.colors.primary, '#FF8555']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <Text style={styles.name}>{name}</Text>
        </View>

        {/* Food Preferences */}
        {(state.userProfile?.favoriteCuisine || state.userProfile?.favoriteFood) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PREFERENCES</Text>
            <View style={styles.preferencesContainer}>
              {state.userProfile?.favoriteCuisine && (
                <View style={styles.preferenceChip}>
                  <Text style={styles.preferenceChipEmoji}>🍳</Text>
                  <Text style={styles.preferenceChipText}>{state.userProfile.favoriteCuisine}</Text>
                </View>
              )}
              {state.userProfile?.favoriteFood && (
                <View style={styles.preferenceChip}>
                  <Text style={styles.preferenceChipEmoji}>🍽️</Text>
                  <Text style={styles.preferenceChipText}>{state.userProfile.favoriteFood}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LOCATION</Text>
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
    backgroundColor: tokens.colors.background
  },
  scrollContent: {
    paddingHorizontal: tokens.spacing.xl,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxxl
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xxxl
  },
  profileLogo: {
    width: 60,
    height: 60,
    marginBottom: tokens.spacing.lg
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
    ...tokens.shadows.lg
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: tokens.colors.textInverse
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: tokens.colors.textPrimary
  },
  section: {
    marginBottom: tokens.spacing.xxxl
  },
  sectionTitle: {
    ...tokens.typography.label,
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.lg
  },
  locationCard: {
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadows.sm
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.sm
  },
  coordinatesText: {
    fontSize: 12,
    color: tokens.colors.textTertiary,
    fontWeight: '500'
  },
  noLocationText: {
    fontSize: 14,
    color: tokens.colors.textTertiary,
    fontStyle: 'italic'
  },
  preferencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.lg
  },
  preferenceChip: {
    backgroundColor: tokens.colors.primaryTint,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadows.sm
  },
  preferenceChipEmoji: {
    fontSize: 16
  },
  preferenceChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.primary
  }
});
