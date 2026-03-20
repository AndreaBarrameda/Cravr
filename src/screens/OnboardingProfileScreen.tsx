import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { CravrButton } from '../components/UI';
import { useAppState } from '../state/AppStateContext';
import { getLocationWithUserConsent } from '../services/locationService';
import { saveUserPreferences } from '../services/firebaseClient';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingProfile'>;

const CUISINES = [
  'Filipino',
  'Chinese',
  'Japanese',
  'Korean',
  'Thai',
  'Vietnamese',
  'Indian',
  'Italian',
  'American',
  'Mexican',
  'Mediterranean',
  'Middle Eastern'
];

export function OnboardingProfileScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [favoriteFood, setFavoriteFood] = useState('');
  const { state, setState } = useAppState();

  const handleDone = async () => {
    if (!name.trim() || !selectedCuisine || !favoriteFood.trim()) return;

    // Update state immediately and navigate - don't block on location
    setState((prev) => ({
      ...prev,
      userProfile: {
        name: name.trim(),
        favoriteCuisine: selectedCuisine,
        favoriteFood: favoriteFood.trim()
      },
      onboardingComplete: true
    }));
    navigation.navigate('MainTabs');

    // Save preferences to Firebase in background (non-blocking)
    if (state.authUser?.id) {
      saveUserPreferences(state.authUser.id, {
        favoriteCuisine: selectedCuisine,
        favoriteFood: favoriteFood.trim()
      })
        .then(() => {
          // eslint-disable-next-line no-console
          console.log('✅ Preferences saved to Firebase');
        })
        .catch(() => {
          // Silently fail - preferences can still be used locally
        });
    }

    // Request location in background (non-blocking)
    getLocationWithUserConsent()
      .then((location) => {
        // eslint-disable-next-line no-console
        console.log('📍 Location obtained in background:', location);
        if (location) {
          setState((prev) => ({ ...prev, location }));
        }
      })
      .catch(() => {
        // Silently fail - location is optional
      });
  };

  const isComplete = name.trim() && selectedCuisine && favoriteFood.trim();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Tell us about your food preferences</Text>

        {/* Name Input */}
        <View style={styles.section}>
          <Text style={styles.label}>What should we call you?</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor="#C2B6AF"
            value={name}
            onChangeText={setName}
            returnKeyType="next"
          />
        </View>

        {/* Cuisine Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Your favorite cuisine</Text>
          <View style={styles.cuisineGrid}>
            {CUISINES.map((cuisine) => (
              <TouchableOpacity
                key={cuisine}
                style={[
                  styles.cuisineButton,
                  selectedCuisine === cuisine && styles.cuisineButtonSelected
                ]}
                onPress={() => setSelectedCuisine(cuisine)}
              >
                <Text
                  style={[
                    styles.cuisineButtonText,
                    selectedCuisine === cuisine && styles.cuisineButtonTextSelected
                  ]}
                >
                  {cuisine}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Favorite Food Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Your favorite food</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Adobo, Pad Thai, Sushi..."
            placeholderTextColor="#C2B6AF"
            value={favoriteFood}
            onChangeText={setFavoriteFood}
            returnKeyType="done"
          />
        </View>

        <View style={styles.spacer} />

        <CravrButton
          label="Let's eat!"
          onPress={handleDone}
          disabled={!isComplete}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F3'
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 32
  },
  section: {
    marginBottom: 32
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161616',
    marginBottom: 12
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0CF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#161616'
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  cuisineButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE0CF',
    backgroundColor: '#FFFFFF',
    marginBottom: 8
  },
  cuisineButtonSelected: {
    backgroundColor: '#FF6A2A',
    borderColor: '#FF6A2A'
  },
  cuisineButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#161616'
  },
  cuisineButtonTextSelected: {
    color: '#FFFFFF'
  },
  spacer: {
    flex: 1,
    minHeight: 20
  }
});
