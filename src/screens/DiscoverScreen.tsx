import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
  Image,
  Alert
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList, DiscoverStackParamList } from '../../App';
import { CravrButton } from '../components/UI';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';
import { tokens } from '../theme/tokens';
import { WeatherWidget } from '../components/WeatherWidget';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Discover'>,
  NativeStackScreenProps<DiscoverStackParamList>
>;

type Attributes = {
  temperature: string | null;
  flavor: string | null;
  texture: string | null;
  intensity: string | null;
  occasion: string | null;
  budget: string | null;
};

function buildAttributesFromTags(tags: string[]): Attributes {
  const tagLower = tags.map((t) => t.toLowerCase());

  return {
    temperature: tagLower.includes('hot') ? 'hot' : tagLower.includes('cold') ? 'cold' : null,
    flavor: tagLower.some((t) =>
      ['spicy', 'savory', 'sweet', 'umami', 'sour'].includes(t)
    )
      ? tagLower.find((t) =>
          ['spicy', 'savory', 'sweet', 'umami', 'sour'].includes(t)
        ) || null
      : null,
    texture: tagLower.includes('crunchy')
      ? 'crunchy'
      : tagLower.includes('creamy')
        ? 'creamy'
        : tagLower.includes('soft')
          ? 'soft'
          : null,
    intensity: tagLower.includes('intense')
      ? 'intense'
      : tagLower.includes('medium')
        ? 'medium'
        : tagLower.includes('mild')
          ? 'mild'
          : null,
    occasion: tagLower.some((t) => ['solo', 'date', 'group'].includes(t))
      ? (tagLower.find((t) => ['solo', 'date', 'group'].includes(t)) || null)
      : null,
    budget: tagLower.includes('upscale')
      ? 'upscale'
      : tagLower.includes('budget')
        ? 'budget'
        : tagLower.includes('casual')
          ? 'casual'
          : null
  };
}

export function DiscoverScreen({ navigation }: Props) {
  const [mode, setMode] = useState<'search' | 'swipe'>('search');
  const [text, setText] = useState('');
  const [selectedMoodTags, setSelectedMoodTags] = useState<string[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<string>('Any');
  const [loading, setLoading] = useState(false);
  const [dishes, setDishes] = useState<any[]>([]);
  const [currentDishIndex, setCurrentDishIndex] = useState(0);
  const [savedDishes, setSavedDishes] = useState<string[]>([]);
  const [imageLoadError, setImageLoadError] = useState<{ [key: string]: boolean }>({});
  const { state, setState } = useAppState();

  // Auto-navigate if there's an active craving (from HomeScreen)
  React.useEffect(() => {
    if (state.craving?.craving_id) {
      navigation.navigate('CuisineSelection', {
        cravingId: state.craving.craving_id
      });
    }
  }, [state.craving?.craving_id]);

  const moodTags = [
    { label: 'Spicy', emoji: '🌶️', value: 'Spicy' },
    { label: 'Salty', emoji: '🧂', value: 'Salty' },
    { label: 'Sweet', emoji: '🍯', value: 'Sweet' },
    { label: 'Hot', emoji: '🔥', value: 'Hot' },
    { label: 'Cold', emoji: '🧊', value: 'Cold' },
    { label: 'Noodles', emoji: '🍜', value: 'Noodles' },
    { label: 'Chicken', emoji: '🍗', value: 'Chicken' },
    { label: 'Vegetarian', emoji: '🥦', value: 'Vegetarian' },
    { label: 'Creamy', emoji: '🥑', value: 'Creamy' },
    { label: 'Crunchy', emoji: '🥒', value: 'Crunchy' },
    { label: 'Comfort Food', emoji: '🍔', value: 'Comfort Food' },
    { label: 'Light', emoji: '🥗', value: 'Light' }
  ];

  const cuisines = [
    'Any',
    'Italian',
    'Japanese',
    'Thai',
    'Mexican',
    'Indian',
    'American',
    'Korean',
    'Filipino'
  ];

  // Fetch dishes for swipe mode
  React.useEffect(() => {
    if (mode === 'swipe') {
      fetchDishes();
    }
  }, [mode, selectedMoodTags, selectedCuisine]);

  const toggleMoodTag = (tagValue: string) => {
    setSelectedMoodTags((prev) =>
      prev.includes(tagValue)
        ? prev.filter((t) => t !== tagValue)
        : [...prev, tagValue]
    );
  };

  const fetchDishes = async () => {
    try {
      setLoading(true);
      const searchLoc = state.searchLocation || state.location;
      const location = searchLoc
        ? { lat: searchLoc.latitude, lng: searchLoc.longitude }
        : { lat: 10.3157, lng: 123.8854 };

      const attributes = buildAttributesFromTags([...selectedMoodTags, selectedCuisine]);
      const cravingText = selectedMoodTags.join(', ') || selectedCuisine;

      const result = await api.discoverDishesByAttributes({
        craving_text: cravingText,
        cuisine: selectedCuisine === 'Any' ? '' : selectedCuisine,
        attributes,
        location
      });

      // eslint-disable-next-line no-console
      console.log('API Response:', result.results?.[0]);
      setDishes(result.results || []);
      setCurrentDishIndex(0);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch dishes:', e);
      Alert.alert('Error', 'Failed to load dishes. Try adjusting your filters.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipeLeft = () => {
    setCurrentDishIndex((prev) => prev + 1);
  };

  const handleSwipeRight = () => {
    const currentDish = dishes[currentDishIndex];
    if (currentDish) {
      setSavedDishes((prev) => [...prev, currentDish.dish_id]);
      Alert.alert('Saved!', `"${currentDish.name}" saved to favorites`, [
        { text: 'OK', onPress: () => handleSwipeLeft() }
      ]);
    }
  };

  const handleViewRestaurant = () => {
    const currentDish = dishes[currentDishIndex];
    if (currentDish) {
      navigation.navigate('RestaurantDetail', {
        restaurantId: currentDish.restaurant_id,
        cravingId: 'discover',
        cuisine: selectedCuisine
      });
    }
  };

  const handleSubmit = async () => {
    const searchText = text.trim() || selectedMoodTags.join(', ') || selectedCuisine;
    if (!searchText) return;

    try {
      setLoading(true);
      const location = state.location
        ? { lat: state.location.latitude, lng: state.location.longitude }
        : undefined;

      const result = await api.resolveCraving(searchText, location);
      const attributes = buildAttributesFromTags([...selectedMoodTags, selectedCuisine]);

      setState((prev) => ({
        ...prev,
        craving: {
          craving_id: result.craving_id,
          normalized: result.normalized,
          tags: result.tags ?? [],
          suggested_cuisines: result.suggested_cuisines ?? []
        }
      }));

      navigation.navigate('DishDiscovery', {
        cravingId: result.craving_id,
        cuisine: selectedCuisine === 'Any' ? '' : selectedCuisine,
        attributes,
        craving_text: searchText
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filterCount = selectedMoodTags.length + (selectedCuisine !== 'Any' ? 1 : 0) + (text.trim() ? 1 : 0);
  const currentDish = dishes[currentDishIndex];
  const hasMoreDishes = currentDishIndex < dishes.length;

  // Debug logging
  React.useEffect(() => {
    if (currentDish) {
      // eslint-disable-next-line no-console
      console.log('Current Dish:', {
        name: currentDish.name,
        photo_url: currentDish.photo_url,
        has_photo: !!currentDish.photo_url,
        imageError: imageLoadError[currentDish.dish_id]
      });
    }
  }, [currentDish, imageLoadError]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Discover</Text>
          {/* Mode toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'search' && styles.modeButtonActive]}
              onPress={() => setMode('search')}
            >
              <Text style={[styles.modeButtonText, mode === 'search' && styles.modeButtonTextActive]}>
                🔍 Search
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'swipe' && styles.modeButtonActive]}
              onPress={() => setMode('swipe')}
            >
              <Text style={[styles.modeButtonText, mode === 'swipe' && styles.modeButtonTextActive]}>
                🎴 Swipe
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {mode === 'search' ? (
            <>
              <WeatherWidget />

          {/* Search input - editorial with emoji prefix */}
          <View style={styles.section}>
            <View style={styles.searchHeader}>
              <Text style={styles.sectionLabel}>SEARCH</Text>
              {text.trim() && (
                <TouchableOpacity onPress={() => setText('')}>
                  <Text style={styles.clearLink}>Clear ✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.searchInputWrapper}>
              <Text style={styles.searchEmoji}>🔍</Text>
              <TextInput
                style={styles.input}
                placeholder="Try 'spicy', 'pizza', 'sushi'..."
                placeholderTextColor={tokens.colors.textTertiary}
                value={text}
                onChangeText={setText}
              />
            </View>
          </View>

          {/* Mood tags */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>MOOD</Text>
              {selectedMoodTags.length > 0 && (
                <TouchableOpacity onPress={() => setSelectedMoodTags([])}>
                  <Text style={styles.clearLink}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.tagGrid}>
              {moodTags.map((tag) => (
                <TouchableOpacity
                  key={tag.value}
                  style={[
                    styles.tag,
                    selectedMoodTags.includes(tag.value) && styles.tagSelected
                  ]}
                  onPress={() => toggleMoodTag(tag.value)}
                >
                  <Text style={styles.tagEmoji}>{tag.emoji}</Text>
                  <Text
                    style={[
                      styles.tagText,
                      selectedMoodTags.includes(tag.value) && styles.tagTextSelected
                    ]}
                  >
                    {tag.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cuisine selector - horizontal scroll */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CUISINE</Text>
            <FlatList
              data={cuisines}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.cuisineChip,
                    selectedCuisine === item && styles.cuisineChipSelected
                  ]}
                  onPress={() => setSelectedCuisine(item)}
                >
                  <Text
                    style={[
                      styles.cuisineChipText,
                      selectedCuisine === item && styles.cuisineChipTextSelected
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              contentContainerStyle={{ gap: tokens.spacing.md, paddingRight: tokens.spacing.xl }}
            />
          </View>
            </>
          ) : (
            // Swipe mode
            <View style={styles.swipeSection}>
              {/* Mood filter */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>MOOD</Text>
                  {selectedMoodTags.length > 0 && (
                    <TouchableOpacity onPress={() => setSelectedMoodTags([])}>
                      <Text style={styles.clearLink}>Clear all</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.tagGrid}>
                  {moodTags.map((tag) => (
                    <TouchableOpacity
                      key={tag.value}
                      style={[
                        styles.tag,
                        selectedMoodTags.includes(tag.value) && styles.tagSelected
                      ]}
                      onPress={() => toggleMoodTag(tag.value)}
                    >
                      <Text style={styles.tagEmoji}>{tag.emoji}</Text>
                      <Text
                        style={[
                          styles.tagText,
                          selectedMoodTags.includes(tag.value) && styles.tagTextSelected
                        ]}
                      >
                        {tag.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Cuisine filter */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>CUISINE</Text>
                <FlatList
                  data={cuisines}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.cuisineChip,
                        selectedCuisine === item && styles.cuisineChipSelected
                      ]}
                      onPress={() => setSelectedCuisine(item)}
                    >
                      <Text
                        style={[
                          styles.cuisineChipText,
                          selectedCuisine === item && styles.cuisineChipTextSelected
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  scrollEventThrottle={16}
                  contentContainerStyle={{ gap: tokens.spacing.md, paddingRight: tokens.spacing.xl }}
                />
              </View>

              {/* Dish card */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={tokens.colors.primary} size="large" />
                </View>
              ) : hasMoreDishes && currentDish ? (
                <>
                  <View style={styles.dishCard}>
                    <View style={styles.dishImageContainer}>
                      {currentDish.photo_url && !imageLoadError[currentDish.dish_id] ? (
                        <Image
                          source={{ uri: currentDish.photo_url }}
                          style={styles.dishImage}
                          resizeMode="cover"
                          onError={() => {
                            setImageLoadError(prev => ({
                              ...prev,
                              [currentDish.dish_id]: true
                            }));
                          }}
                        />
                      ) : null}
                      {!currentDish.photo_url || imageLoadError[currentDish.dish_id] ? (
                        <View style={[styles.dishImage, styles.dishImagePlaceholder]}>
                          <Text style={styles.dishImageEmoji}>🍽️</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.dishInfo}>
                      <Text style={styles.dishName}>{currentDish.name}</Text>
                      <Text style={styles.dishRestaurant}>{currentDish.restaurant_name}</Text>
                      <Text style={styles.dishPrice}>₱{currentDish.price.toFixed(0)}</Text>
                      {currentDish.description && (
                        <Text style={styles.dishDescription} numberOfLines={2}>
                          {currentDish.description}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Action buttons */}
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={handleSwipeLeft}
                    >
                      <Text style={styles.actionEmoji}>👎</Text>
                      <Text style={styles.actionText}>Pass</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.viewButton]}
                      onPress={handleViewRestaurant}
                    >
                      <Text style={styles.actionEmoji}>👀</Text>
                      <Text style={styles.actionText}>View</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.likeButton]}
                      onPress={handleSwipeRight}
                    >
                      <Text style={styles.actionEmoji}>❤️</Text>
                      <Text style={styles.actionText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : !loading ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🍽️</Text>
                  <Text style={styles.emptyText}>No more dishes!</Text>
                  <Text style={styles.emptySubtext}>Adjust your filters to discover more</Text>
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>

        {mode === 'search' && (
          <View style={styles.footer}>
            <CravrButton
              label={loading ? 'Finding...' : `Discover${filterCount > 0 ? ` (${filterCount})` : ''}`}
              onPress={handleSubmit}
              disabled={
                !text.trim() && selectedMoodTags.length === 0 && selectedCuisine === 'Any'
              }
              loading={loading}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background
  },
  header: {
    paddingHorizontal: tokens.spacing.xl,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.lg,
    backgroundColor: tokens.colors.background
  },
  title: {
    fontSize: tokens.typography.h2.fontSize,
    fontWeight: tokens.typography.h2.fontWeight,
    letterSpacing: tokens.typography.h2.letterSpacing,
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.md
  },
  modeToggle: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.xs,
    borderWidth: 1,
    borderColor: tokens.colors.border
  },
  modeButton: {
    flex: 1,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modeButtonActive: {
    backgroundColor: tokens.colors.primary
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.textSecondary
  },
  modeButtonTextActive: {
    color: tokens.colors.textInverse
  },
  scrollContent: {
    paddingHorizontal: tokens.spacing.xl,
    paddingTop: tokens.spacing.lg,
    paddingBottom: 200
  },
  swipeSection: {
    flex: 1
  },
  section: {
    marginBottom: tokens.spacing.xxxl
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md
  },
  sectionLabel: {
    ...tokens.typography.label,
    color: tokens.colors.textPrimary
  },
  clearLink: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.primary,
    textDecorationLine: 'underline'
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadows.sm,
    paddingLeft: tokens.spacing.md
  },
  searchEmoji: {
    fontSize: 16,
    marginRight: tokens.spacing.sm
  },
  input: {
    flex: 1,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    fontSize: tokens.typography.body.fontSize,
    color: tokens.colors.textPrimary
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.md
  },
  tag: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    ...tokens.shadows.sm
  },
  tagSelected: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary
  },
  tagEmoji: {
    fontSize: 14
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: tokens.colors.textPrimary
  },
  tagTextSelected: {
    color: tokens.colors.textInverse
  },
  cuisineChip: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadows.sm
  },
  cuisineChipSelected: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary
  },
  cuisineChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.textPrimary
  },
  cuisineChipTextSelected: {
    color: tokens.colors.textInverse
  },
  footer: {
    paddingHorizontal: tokens.spacing.xl,
    paddingBottom: tokens.spacing.xxl,
    backgroundColor: tokens.colors.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300
  },
  dishCard: {
    width: '100%',
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.xl,
    overflow: 'hidden',
    ...tokens.shadows.lg,
    marginVertical: tokens.spacing.xl
  },
  dishImageContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
    backgroundColor: tokens.colors.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  dishImage: {
    position: 'absolute',
    width: '100%',
    height: '100%'
  },
  dishImagePlaceholder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  dishImageEmoji: {
    fontSize: 64,
    opacity: 0.3
  },
  dishInfo: {
    padding: tokens.spacing.lg
  },
  dishName: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.sm
  },
  dishRestaurant: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.primary,
    marginBottom: tokens.spacing.xs
  },
  dishPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.md
  },
  dishDescription: {
    fontSize: 13,
    color: tokens.colors.textSecondary,
    lineHeight: 18
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: tokens.spacing.lg,
    justifyContent: 'center',
    width: '100%',
    marginBottom: tokens.spacing.xl
  },
  actionButton: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.lg,
    alignItems: 'center',
    gap: tokens.spacing.xs,
    ...tokens.shadows.sm
  },
  rejectButton: {
    backgroundColor: '#FFE0E0',
    borderWidth: 1,
    borderColor: '#FFB3B3'
  },
  viewButton: {
    backgroundColor: tokens.colors.backgroundLight,
    borderWidth: 1,
    borderColor: tokens.colors.border
  },
  likeButton: {
    backgroundColor: '#FFE0E0',
    borderWidth: 1,
    borderColor: '#FF6A6A'
  },
  actionEmoji: {
    fontSize: 20
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.textPrimary
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.xxxl
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: tokens.spacing.lg
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.sm
  },
  emptySubtext: {
    fontSize: 14,
    color: tokens.colors.textSecondary,
    textAlign: 'center'
  }
});
