import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { ScreenContainer } from '../components/UI';
import { useAppState } from '../state/AppStateContext';

type Props = NativeStackScreenProps<RootStackParamList, 'CuisineSelection'>;

const FALLBACK_CUISINES = [
  { slug: 'oriental', name: 'Oriental' },
  { slug: 'italian', name: 'Italian' },
  { slug: 'japanese', name: 'Japanese' },
  { slug: 'korean', name: 'Korean' },
  { slug: 'filipino', name: 'Filipino' },
  { slug: 'american', name: 'American' }
];

export function CuisineSelectionScreen({ navigation, route }: Props) {
  const { state, setState } = useAppState();
  const suggested = state.craving?.suggested_cuisines ?? [];
  const cravingText = route.params?.cravingText || state.craving?.normalized || '';

  const cuisines =
    suggested.length > 0
      ? suggested.map((c) => ({ slug: c.slug, name: c.name }))
      : FALLBACK_CUISINES;

  const onSelect = (slug: string) => {
    setState((prev) => ({ ...prev, selectedCuisine: slug }));
    navigation.navigate('RestaurantDiscovery', {
      cravingId: state.craving!.craving_id,
      cravingText: cravingText, // Pass craving text forward
      cuisine: slug
    });
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>What cuisine fits your craving?</Text>
      <Text style={styles.subtitle}>{state.craving?.normalized}</Text>

      <FlatList
        data={cuisines}
        numColumns={2}
        keyExtractor={(item) => item.slug}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.tile} onPress={() => onSelect(item.slug)}>
            <Text style={styles.tileText}>{item.name}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 24
  },
  listContent: {
    gap: 16
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16
  },
  tile: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  tileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161616'
  }
});

