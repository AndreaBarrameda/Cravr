import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { CravrButton } from '../components/UI';
import { useAppState } from '../state/AppStateContext';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingPreferences'>;

const CUISINES = ['Italian', 'Mexican', 'Japanese', 'Thai', 'Indian', 'American'];
const DIETARY_TAGS = ['Vegetarian', 'Vegan', 'Halal', 'Gluten-free'];

export function OnboardingPreferencesScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const { setState } = useAppState();

  const toggleSelection = (item: string) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleContinue = () => {
    setState((prev) => ({
      ...prev,
      preferences: selected
    }));
    navigation.navigate('OnboardingProfile');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What do you love to eat?</Text>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuisines</Text>
          <View style={styles.tilesContainer}>
            {CUISINES.map((cuisine) => (
              <TouchableOpacity
                key={cuisine}
                style={[
                  styles.tile,
                  selected.includes(cuisine) && styles.tileSelected
                ]}
                onPress={() => toggleSelection(cuisine)}
              >
                <Text
                  style={[
                    styles.tileText,
                    selected.includes(cuisine) && styles.tileTextSelected
                  ]}
                >
                  {cuisine}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Preferences</Text>
          <View style={styles.tilesContainer}>
            {DIETARY_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tile,
                  selected.includes(tag) && styles.tileSelected
                ]}
                onPress={() => toggleSelection(tag)}
              >
                <Text
                  style={[
                    styles.tileText,
                    selected.includes(tag) && styles.tileTextSelected
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <CravrButton
        label="Continue"
        onPress={handleContinue}
        disabled={selected.length === 0}
      />
    </View>
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
    marginBottom: 32
  },
  scrollContainer: {
    flex: 1,
    marginBottom: 20
  },
  section: {
    marginBottom: 32
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161616',
    marginBottom: 12
  },
  tilesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  tile: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE0CF',
    marginBottom: 8
  },
  tileSelected: {
    backgroundColor: '#FFECDC',
    borderColor: '#FF6A2A'
  },
  tileText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B6B6B'
  },
  tileTextSelected: {
    color: '#FF6A2A'
  }
});
