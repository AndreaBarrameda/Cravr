import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { CravrButton } from '../components/UI';
import { useAppState } from '../state/AppStateContext';
import { getLocationWithUserConsent } from '../services/locationService';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingProfile'>;

export function OnboardingProfileScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const { setState } = useAppState();

  const handleDone = async () => {
    if (!name.trim()) return;

    // eslint-disable-next-line no-console
    console.log('🎯 Starting location request in onboarding...');

    // Request location and get location data (handles permission internally)
    const location = await getLocationWithUserConsent();
    // eslint-disable-next-line no-console
    console.log('📍 Location obtained in onboarding:', location);

    setState((prev) => ({
      ...prev,
      userProfile: { name: name.trim() },
      location: location || undefined,
      onboardingComplete: true
    }));
    navigation.navigate('MainTabs');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>What should we call you?</Text>

        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor="#C2B6AF"
          value={name}
          onChangeText={setName}
          returnKeyType="done"
          onSubmitEditing={handleDone}
        />

        <View style={{ flex: 1 }} />

        <CravrButton
          label="Let's eat!"
          onPress={handleDone}
          disabled={!name.trim()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F3',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 40
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFE0CF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#161616'
  }
});
