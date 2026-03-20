import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DiscoverStackParamList } from '../../App';
import { ScreenContainer, CravrButton } from '../components/UI';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';
import { tokens } from '../theme/tokens';

type Props = NativeStackScreenProps<DiscoverStackParamList, 'SplashCraving'>;

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
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
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
    marginBottom: tokens.spacing.xxxl,
    alignItems: 'center'
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: tokens.spacing.lg
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
    textAlign: 'center'
  },
  card: {
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.xl,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadows.md
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: tokens.spacing.md,
    color: tokens.colors.textPrimary
  },
  input: {
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    fontSize: 16,
    backgroundColor: tokens.colors.background,
    color: tokens.colors.textPrimary
  },
  footer: {
    marginTop: 'auto'
  }
});

