import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
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
import { getTimeOfDay, getWeatherData, getFoodSuggestions, type WeatherData } from '../utils/contextual';
import { WeatherWidget } from '../components/WeatherWidget';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { state, setState } = useAppState();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<string>('');
  const [contextualSuggestions, setContextualSuggestions] = useState<string[]>([]);

  // Fetch weather and time on mount
  useEffect(() => {
    const initializeContext = async () => {
      const time = getTimeOfDay();
      setTimeOfDay(time);

      if (state.location) {
        const weatherData = await getWeatherData(
          state.location.latitude,
          state.location.longitude
        );
        setWeather(weatherData);

        const suggestions = getFoodSuggestions(time, weatherData);
        setContextualSuggestions(suggestions);
      }
    };

    initializeContext();
  }, [state.location]);

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

  const moods = [
    { emoji: '🌶️', label: 'Spicy', tags: 'spicy', color: '#FFE8E0' },
    { emoji: '🧊', label: 'Refreshing', tags: 'cold', color: '#E0F2FE' },
    { emoji: '🥗', label: 'Fresh', tags: 'light fresh', color: '#F0FDE4' },
    { emoji: '🍲', label: 'Comfort', tags: 'comfort food', color: '#FEF0D9' },
    { emoji: '🍰', label: 'Sweet', tags: 'sweet', color: '#FBE8F0' },
    { emoji: '🍖', label: 'Savory', tags: 'savory', color: '#F5E6D3' },
    { emoji: '🍟', label: 'Crispy', tags: 'crispy crunchy', color: '#FFF4E0' },
    { emoji: '🥑', label: 'Creamy', tags: 'creamy', color: '#F0F9E8' }
  ];

  const popularDishes = [
    { emoji: '🍜', label: 'Ramen' },
    { emoji: '☕', label: 'Coffee' },
    { emoji: '🍔', label: 'Burger' },
    { emoji: '🌮', label: 'Tacos' },
    { emoji: '🍱', label: 'Sushi' }
  ];

  const handleMoodTap = (tags: string) => {
    setText(tags);
  };

  const handleDishTap = (dish: string) => {
    setText(dish);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerTop}>
          <Text style={styles.greeting}>
            Welcome back,{'\n'}{state.userProfile?.name?.split(' ')[0] || 'Andrea'}
          </Text>
        </View>

        {/* Weather & Time Widget */}
        <WeatherWidget />

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.mainHeading}>What are you craving?</Text>
          <Text style={styles.subtitle}>
            {contextualSuggestions.length > 0
              ? `Try ${contextualSuggestions.slice(0, 3).join(', ')}...`
              : 'Discover new favorites near you'}
          </Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="spicy, creamy, fresh..."
            placeholderTextColor={tokens.colors.textTertiary}
            value={text}
            onChangeText={setText}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />
        </View>

        {/* Browse by Mood Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BROWSE BY MOOD</Text>
          <FlatList
            data={moods}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.moodCard, { backgroundColor: item.color }]}
                onPress={() => handleMoodTap(item.tags)}
                activeOpacity={0.8}
              >
                <Text style={styles.moodEmoji}>{item.emoji}</Text>
                <Text style={styles.moodLabel}>{item.label}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(_, idx) => idx.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            contentContainerStyle={styles.moodListContent}
          />
        </View>

        {/* Popular Now Near You Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>POPULAR NEAR YOU</Text>
          <FlatList
            data={popularDishes}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dishPill}
                onPress={() => handleDishTap(item.label.toLowerCase())}
                activeOpacity={0.75}
              >
                <Text style={styles.dishEmoji}>{item.emoji}</Text>
                <Text style={styles.dishLabel}>{item.label}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(_, idx) => idx.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            contentContainerStyle={styles.dishListContent}
          />
        </View>

        {/* Spacer */}
        <View style={{ height: tokens.spacing.xxxl }} />
      </ScrollView>

      {/* CTA Footer */}
      <View style={styles.footer}>
        <CravrButton
          label={loading ? 'Finding matches...' : 'Find my matches'}
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
    paddingTop: tokens.spacing.xxl,
    paddingBottom: 100 // Space for footer
  },
  // Header Section
  headerTop: {
    marginBottom: tokens.spacing.xl,
    alignItems: 'center',
    width: '100%'
  },
  headerContent: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    color: '#2D3748',
    lineHeight: 24,
    textAlign: 'center'
  },
  headerSubtext: {
    fontSize: 13,
    fontWeight: '500',
    color: tokens.colors.textSecondary,
    marginTop: tokens.spacing.xs,
    display: 'none'
  },
  locationPill: {
    display: 'none'
  },
  locationIcon: {
    fontSize: 14
  },
  locationAddress: {
    fontSize: 14,
    color: tokens.colors.textSecondary,
    fontWeight: '500'
  },
  openStatusPill: {
    display: 'none'
  },
  openCheckmark: {
    fontSize: 14,
    color: tokens.colors.accentGreen,
    fontWeight: '700'
  },
  openStatus: {
    fontSize: 14,
    color: tokens.colors.accentGreen,
    fontWeight: '600'
  },
  // Hero Section
  heroSection: {
    marginBottom: tokens.spacing.xxl,
    alignItems: 'center',
    width: '100%'
  },
  mainHeading: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: '#2D3748',
    marginBottom: tokens.spacing.md,
    lineHeight: 38,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22
  },
  // Search
  searchContainer: {
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.xl,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.xxxl,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadows.sm
  },
  searchIcon: {
    fontSize: 18,
    marginRight: tokens.spacing.md
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: tokens.colors.textPrimary,
    fontWeight: '400',
    lineHeight: 24
  },
  // Sections
  section: {
    marginBottom: tokens.spacing.xxl
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: '#718096',
    marginBottom: tokens.spacing.lg,
    textTransform: 'uppercase'
  },
  // Mood Cards
  moodListContent: {
    gap: tokens.spacing.sm,
    paddingRight: tokens.spacing.xl
  },
  moodCard: {
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    borderWidth: 0,
    opacity: 0.9
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: tokens.spacing.xs
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.textPrimary,
    textAlign: 'center'
  },
  // Dish Pills
  dishListContent: {
    gap: tokens.spacing.sm,
    paddingRight: tokens.spacing.xl
  },
  dishPill: {
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border
  },
  dishEmoji: {
    fontSize: 16
  },
  dishLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.textPrimary
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.lg,
    backgroundColor: tokens.colors.background,
    borderTopWidth: 0
  }
});
