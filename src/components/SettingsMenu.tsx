import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  ActivityIndicator,
  Alert
} from 'react-native';
import { tokens } from '../theme/tokens';
import { useAppState } from '../state/AppStateContext';
import { getLocationWithUserConsent } from '../services/locationService';
import { logout } from '../services/firebaseClient';
import { LocationSearchModal } from './LocationSearchModal';
import { GeocodeResult } from '../services/geocoding';

type SettingsMenuProps = {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  onNavigateOnboarding: () => void;
};

export function SettingsMenu({
  visible,
  onClose,
  onLogout,
  onNavigateOnboarding
}: SettingsMenuProps) {
  const { state, setState } = useAppState();
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [locationSearchVisible, setLocationSearchVisible] = useState(false);

  const isDark = state.darkMode ?? false;

  const handleToggleDarkMode = () => {
    setState((prev) => ({
      ...prev,
      darkMode: !prev.darkMode
    }));
  };

  const handleSelectSearchLocation = (location: GeocodeResult) => {
    setState((prev) => ({
      ...prev,
      searchLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || location.name
      }
    }));
    setLocationSearchVisible(false);
  };

  const handleUpdateLocation = async () => {
    try {
      setUpdatingLocation(true);
      const location = await getLocationWithUserConsent();
      if (location) {
        setState((prev) => ({ ...prev, location }));
        Alert.alert('Success', 'Location updated');
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to update location:', e);
      Alert.alert('Error', 'Failed to update location');
    } finally {
      setUpdatingLocation(false);
    }
  };

  const handleLogout = () => {
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
            onLogout();
            onClose();
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        }
      }
    ]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A1A1A' : tokens.colors.backgroundLight }]}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: isDark ? '#FFFFFF' : tokens.colors.textPrimary }]}>
                Settings
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Dark Mode Toggle */}
            <View style={[styles.menuItem, { borderBottomColor: isDark ? '#2A2A2A' : tokens.colors.border }]}>
              <View style={styles.menuItemLeft}>
                <Text style={[styles.menuItemIcon]}>🌙</Text>
                <Text style={[styles.menuItemText, { color: isDark ? '#FFFFFF' : tokens.colors.textPrimary }]}>
                  Dark Mode
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={handleToggleDarkMode}
                trackColor={{
                  false: tokens.colors.border,
                  true: tokens.colors.primary
                }}
                thumbColor={isDark ? tokens.colors.primary : tokens.colors.textTertiary}
              />
            </View>

            {/* Update Location */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: isDark ? '#2A2A2A' : tokens.colors.border }]}
              onPress={handleUpdateLocation}
              disabled={updatingLocation}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemIcon}>📍</Text>
                <View style={styles.menuItemContent}>
                  <Text style={[styles.menuItemText, { color: isDark ? '#FFFFFF' : tokens.colors.textPrimary }]}>
                    Update Location
                  </Text>
                  {state.location?.address && (
                    <Text style={[styles.menuItemSubtext, { color: isDark ? '#B0B0B0' : tokens.colors.textSecondary }]}>
                      {state.location.address}
                    </Text>
                  )}
                </View>
              </View>
              {updatingLocation && <ActivityIndicator color={tokens.colors.primary} size="small" />}
            </TouchableOpacity>

            {/* Search by Location */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: isDark ? '#2A2A2A' : tokens.colors.border }]}
              onPress={() => setLocationSearchVisible(true)}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemIcon}>🔍</Text>
                <View style={styles.menuItemContent}>
                  <Text style={[styles.menuItemText, { color: isDark ? '#FFFFFF' : tokens.colors.textPrimary }]}>
                    Search by Location
                  </Text>
                  {state.searchLocation?.address && (
                    <Text style={[styles.menuItemSubtext, { color: isDark ? '#B0B0B0' : tokens.colors.textSecondary }]}>
                      {state.searchLocation.address}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {/* Re-run Onboarding */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: isDark ? '#2A2A2A' : tokens.colors.border }]}
              onPress={() => {
                onNavigateOnboarding();
                onClose();
              }}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemIcon}>🎯</Text>
                <Text style={[styles.menuItemText, { color: isDark ? '#FFFFFF' : tokens.colors.textPrimary }]}>
                  Re-run Onboarding
                </Text>
              </View>
            </TouchableOpacity>

            {/* Sign Out */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleLogout}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemIcon}>🚪</Text>
                <Text style={[styles.menuItemText, { color: '#EF4444' }]}>
                  Sign Out
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>

        <LocationSearchModal
          visible={locationSearchVisible}
          onClose={() => setLocationSearchVisible(false)}
          onSelectLocation={handleSelectSearchLocation}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end'
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  container: {
    width: '85%',
    maxWidth: 350,
    borderTopLeftRadius: tokens.radius.xl,
    borderBottomLeftRadius: tokens.radius.xl,
    maxHeight: '80%'
  },
  content: {
    paddingVertical: tokens.spacing.lg
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border
  },
  title: {
    fontSize: 20,
    fontWeight: '700'
  },
  closeButton: {
    fontSize: 24,
    color: tokens.colors.textTertiary,
    padding: tokens.spacing.sm
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
    borderBottomWidth: 1
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: tokens.spacing.md
  },
  menuItemIcon: {
    fontSize: 20
  },
  menuItemContent: {
    flex: 1
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500'
  },
  menuItemSubtext: {
    fontSize: 12,
    marginTop: tokens.spacing.xs
  }
});
