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
import { ScreenContainer, CravrButton } from '../components/UI';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';

type Props = NativeStackScreenProps<RootStackParamList, 'SplashCraving'>;

export function SplashCravingScreen({ navigation }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { state, setState } = useAppState();

  const onSubmit = async () => {
    if (!text.trim()) return;
    try {
      setLoading(true);
      const location = state.location
        ? { lat: state.location.latitude, lng: state.location.longitude }
        : undefined;

      // eslint-disable-next-line no-console
      console.log('🔍 Using location:', location);
      // eslint-disable-next-line no-console
      console.log('📍 Full location data:', state.location);

      const result = await api.resolveCraving(text.trim(), location);
      setState((prev) => ({
        ...prev,
        craving: {
          craving_id: result.craving_id,
          normalized: result.normalized,
          tags: result.tags ?? [],
          suggested_cuisines: result.suggested_cuisines ?? []
        }
      }));
      navigation.navigate('CuisineSelection', {
        cravingId: result.craving_id,
        cravingText: result.normalized || text.trim() // Pass actual craving text
      });
    } catch (e) {
      // TODO: surface error to user
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenContainer>
        <View style={styles.header}>
          <Text style={styles.logo}>CRAVR</Text>
          <Text style={styles.tagline}>Start with your craving.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>What are you craving?</Text>
          <TextInput
            style={styles.input}
            placeholder="Type something like “spicy ramen”"
            placeholderTextColor="#C2B6AF"
            value={text}
            onChangeText={setText}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />
        </View>

        <View style={styles.footer}>
          <CravrButton
            label="Find food"
            onPress={onSubmit}
            disabled={!text.trim()}
            loading={loading}
          />
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 40
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FF6A2A',
    letterSpacing: 1
  },
  tagline: {
    marginTop: 8,
    fontSize: 16,
    color: '#6B6B6B'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#161616'
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFE0CF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFF8F3'
  },
  footer: {
    marginTop: 'auto'
  }
});

