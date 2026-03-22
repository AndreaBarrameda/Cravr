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
  FlatList
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
  const [text, setText] = useState('');
  const [selectedMoodTags, setSelectedMoodTags] = useState<string[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<string>('Any');
  const [loading, setLoading] = useState(false);
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

  const toggleMoodTag = (tagValue: string) => {
    setSelectedMoodTags((prev) =>
      prev.includes(tagValue)
        ? prev.filter((t) => t !== tagValue)
        : [...prev, tagValue]
    );
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Discover</Text>
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
        </ScrollView>

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
      </KeyboardAvoidingView>
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
    paddingBottom: 200
  },
  title: {
    fontSize: tokens.typography.h2.fontSize,
    fontWeight: tokens.typography.h2.fontWeight,
    letterSpacing: tokens.typography.h2.letterSpacing,
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.xxxl
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
  }
});
