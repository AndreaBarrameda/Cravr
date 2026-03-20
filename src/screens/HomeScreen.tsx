import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  FlatList,
  Image
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from '../../App';
import { CravrButton } from '../components/UI';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';
import { tokens } from '../theme/tokens';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
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
      navigation.navigate('Discover' as any);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const moodShortcuts = [
    { emoji: '🌶️', label: 'Spicy', tags: 'spicy' },
    { emoji: '🧊', label: 'Cold', tags: 'cold' },
    { emoji: '🥗', label: 'Fresh', tags: 'light fresh' },
    { emoji: '🍝', label: 'Comfort', tags: 'comfort food' },
    { emoji: '🍰', label: 'Sweet', tags: 'sweet' },
    { emoji: '🌮', label: 'Quick', tags: 'casual' }
  ];

  const handleMoodTap = (tags: string) => {
    setText(tags);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - minimal and muted */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hey {state.userProfile?.name || 'Friend'} 👋
          </Text>
          {state.location?.address && (
            <View style={styles.locationBadge}>
              <Text style={styles.locationText}>
                📍 {state.location.address}
              </Text>
            </View>
          )}
          {/* Green freshness signal */}
          <View style={styles.freshChip}>
            <Text style={styles.freshDot}>●</Text>
            <Text style={styles.freshText}>
              Restaurants open near you
            </Text>
          </View>
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Main heading */}
        <Text style={styles.mainHeading}>What are you craving today?</Text>

        {/* Input card - clean minimal */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>TYPE YOUR CRAVING</Text>
          <TextInput
            style={styles.input}
            placeholder="spicy ramen, burger, sushi..."
            placeholderTextColor={tokens.colors.textTertiary}
            value={text}
            onChangeText={setText}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />
        </View>

        {/* Mood chips - horizontal scroll */}
        <View style={styles.moodsContainer}>
          <Text style={styles.moodsSectionLabel}>TRY A MOOD</Text>
          <FlatList
            data={moodShortcuts}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.moodChip}
                onPress={() => handleMoodTap(item.tags)}
              >
                <Text style={styles.moodChipEmoji}>{item.emoji}</Text>
                <Text style={styles.moodChipLabel}>{item.label}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(_, idx) => idx.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingRight: tokens.spacing.xl }}
          />
        </View>
      </ScrollView>

      {/* Footer with glow button and gradient fade */}
      <View style={styles.footer}>
        <View style={styles.fadeGradient} />
        <CravrButton
          label={loading ? 'Finding your vibe...' : 'Find food'}
          onPress={onSubmit}
          disabled={!text.trim()}
          loading={loading}
        />
      </View>
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
    paddingBottom: 200 // Extra space for footer
  },
  header: {
    marginBottom: tokens.spacing.xxxl
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
    color: tokens.colors.textSecondary,
    marginBottom: tokens.spacing.md
  },
  locationBadge: {
    backgroundColor: tokens.colors.backgroundLight,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: tokens.spacing.lg
  },
  locationText: {
    fontSize: 12,
    color: tokens.colors.textSecondary,
    fontWeight: '500'
  },
  freshChip: {
    backgroundColor: tokens.colors.accentGreenLight,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm
  },
  freshDot: {
    color: tokens.colors.accentGreen,
    fontSize: 12,
    fontWeight: '700'
  },
  freshText: {
    fontSize: 12,
    color: tokens.colors.accentGreen,
    fontWeight: '600'
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xxxl,
    paddingVertical: tokens.spacing.xl
  },
  logo: {
    width: 100,
    height: 100
  },
  mainHeading: {
    fontSize: tokens.typography.h2.fontSize,
    fontWeight: tokens.typography.h2.fontWeight,
    letterSpacing: tokens.typography.h2.letterSpacing,
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.xxxl,
    textAlign: 'center'
  },
  inputCard: {
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadows.md,
    marginBottom: tokens.spacing.xxxl
  },
  inputLabel: {
    ...tokens.typography.label,
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.md
  },
  input: {
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    fontSize: tokens.typography.body.fontSize,
    backgroundColor: tokens.colors.background,
    color: tokens.colors.textPrimary
  },
  moodsContainer: {
    marginBottom: tokens.spacing.xl
  },
  moodsSectionLabel: {
    ...tokens.typography.label,
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.md
  },
  moodChip: {
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadows.sm
  },
  moodChipEmoji: {
    fontSize: 20,
    marginBottom: tokens.spacing.xs
  },
  moodChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.textPrimary,
    textAlign: 'center'
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: tokens.spacing.xl,
    paddingBottom: tokens.spacing.xxl,
    paddingTop: tokens.spacing.xxl,
    backgroundColor: tokens.colors.background
  },
  fadeGradient: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'transparent'
  }
});
