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
  ActivityIndicator
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from '../../App';
import { CravrButton } from '../components/UI';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Discover'>,
  NativeStackScreenProps<RootStackParamList>
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

  const moodTags = [
    'Spicy',
    'Salty',
    'Sweet',
    'Hot',
    'Cold',
    'Noodles',
    'Chicken',
    'Vegetarian',
    'Creamy',
    'Crunchy',
    'Comfort Food',
    'Light'
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

  const toggleMoodTag = (tag: string) => {
    setSelectedMoodTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
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
          <Text style={styles.title}>What are you in the mood for?</Text>

          {/* Freeform text input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Search (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Type a craving..."
              placeholderTextColor="#C2B6AF"
              value={text}
              onChangeText={setText}
            />
          </View>

          {/* Mood tags */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Mood</Text>
            <View style={styles.tagGrid}>
              {moodTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tag,
                    selectedMoodTags.includes(tag) && styles.tagSelected
                  ]}
                  onPress={() => toggleMoodTag(tag)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      selectedMoodTags.includes(tag) && styles.tagTextSelected
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cuisine selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Cuisine</Text>
            <View style={styles.tagGrid}>
              {cuisines.map((cuisine) => (
                <TouchableOpacity
                  key={cuisine}
                  style={[
                    styles.tag,
                    selectedCuisine === cuisine && styles.tagSelected
                  ]}
                  onPress={() => setSelectedCuisine(cuisine)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      selectedCuisine === cuisine && styles.tagTextSelected
                    ]}
                  >
                    {cuisine}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <CravrButton
            label={loading ? 'Finding dishes...' : 'Discover'}
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
    backgroundColor: '#FFF8F3'
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 28
  },
  section: {
    marginBottom: 28
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161616',
    marginBottom: 12
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
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8E8E8'
  },
  tagSelected: {
    backgroundColor: '#FF6A2A',
    borderColor: '#FF6A2A'
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333'
  },
  tagTextSelected: {
    color: '#FFFFFF'
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: '#FFF8F3'
  }
});
