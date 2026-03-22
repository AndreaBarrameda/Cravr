import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { tokens } from '../theme/tokens';
import { geocodeLocation, GeocodeResult } from '../services/geocoding';

interface LocationSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: GeocodeResult) => void;
}

export function LocationSearchModal({
  visible,
  onClose,
  onSelectLocation
}: LocationSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const locations = await geocodeLocation(query);
      setResults(locations);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (location: GeocodeResult) => {
    onSelectLocation(location);
    setSearchQuery('');
    setResults([]);
    onClose();
  };

  const renderLocationItem = ({ item }: { item: GeocodeResult }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => handleSelectLocation(item)}
    >
      <View style={styles.locationContent}>
        <Text style={styles.locationName}>{item.name}</Text>
        <Text style={styles.locationSubtext}>{item.address}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Search Location</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search city or location..."
            placeholderTextColor={tokens.colors.textTertiary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={tokens.colors.primary} size="large" />
          </View>
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            renderItem={renderLocationItem}
            keyExtractor={(item) => `${item.latitude}-${item.longitude}`}
            contentContainerStyle={styles.listContent}
          />
        ) : searchQuery.length >= 2 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No locations found</Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Start typing to search</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.textPrimary
  },
  closeButton: {
    fontSize: 24,
    color: tokens.colors.textTertiary,
    padding: tokens.spacing.sm
  },
  placeholder: {
    width: 40
  },
  searchContainer: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md
  },
  searchInput: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    fontSize: 16,
    color: tokens.colors.textPrimary,
    backgroundColor: tokens.colors.backgroundLight
  },
  listContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md
  },
  locationItem: {
    paddingVertical: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border
  },
  locationContent: {
    gap: tokens.spacing.xs
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.colors.textPrimary
  },
  locationSubtext: {
    fontSize: 13,
    color: tokens.colors.textSecondary
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: tokens.colors.textSecondary
  }
});
