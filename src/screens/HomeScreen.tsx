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
  SafeAreaView
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from '../../App';
import { CravrButton } from '../components/UI';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';

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
      navigation.navigate('CuisineSelection', { cravingId: result.craving_id });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const moodShortcuts = [
    { emoji: '🌶️', label: 'Something Spicy', tags: 'spicy' },
    { emoji: '🥣', label: 'Comfort Food', tags: 'comfort food' },
    { emoji: '🥗', label: 'Light & Fresh', tags: 'light fresh' },
    { emoji: '🍰', label: 'Sweet Treats', tags: 'sweet' }
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
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hi, {state.userProfile?.name || 'Friend'}
          </Text>
          {state.location?.address && (
            <View style={styles.locationBadge}>
              <Text style={styles.locationText}>📍 {state.location.address}</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>What are you craving?</Text>
          <TextInput
            style={styles.input}
            placeholder="Type something like 'spicy ramen'"
            placeholderTextColor="#C2B6AF"
            value={text}
            onChangeText={setText}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />
        </View>

        <View style={styles.moods}>
          <Text style={styles.moodyLabel}>Try a mood</Text>
          <View style={styles.moodGrid}>
            {moodShortcuts.map((mood, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.moodCard}
                onPress={() => handleMoodTap(mood.tags)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodText}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <CravrButton
          label="Find food"
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
    backgroundColor: '#FFF8F3'
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40
  },
  header: {
    marginBottom: 32
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 12
  },
  locationBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFE0CF'
  },
  locationText: {
    fontSize: 13,
    color: '#6B6B6B',
    fontWeight: '500'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    marginBottom: 32
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
    backgroundColor: '#FFF8F3',
    color: '#161616'
  },
  moods: {
    marginBottom: 24
  },
  moodyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161616',
    marginBottom: 12
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  moodCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 8
  },
  moodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#161616',
    textAlign: 'center'
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: '#FFF8F3'
  }
});
