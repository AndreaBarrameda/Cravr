import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { tokens } from '../theme/tokens';
import { useAppState } from '../state/AppStateContext';
import { RootStackParamList } from '../../App';
import {
  getBookmarkedRestaurants,
  removeBookmarkedRestaurant,
} from '../services/firebaseClient';

interface BookmarkedRestaurant {
  restaurant_id: string;
  name: string;
  rating: number;
  price_level: number;
  distance_meters: number;
}

export function BookmarksScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state } = useAppState();
  const [bookmarks, setBookmarks] = useState<BookmarkedRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, [state.authUser?.id]);

  const loadBookmarks = async () => {
    if (!state.authUser?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await getBookmarkedRestaurants(state.authUser.id);
      // Handle both array and object responses
      const bookmarksList = Array.isArray(result) ? result : (result?.bookmarks || []);
      setBookmarks(bookmarksList || []);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (restaurantId: string) => {
    if (!state.authUser?.id) return;

    try {
      await removeBookmarkedRestaurant(state.authUser.id, restaurantId);
      setBookmarks(bookmarks.filter((b) => b.restaurant_id !== restaurantId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const renderBookmarkCard = ({ item }: { item: BookmarkedRestaurant }) => (
    <View style={styles.bookmarkCard}>
      <View style={styles.cardContent}>
        <Text style={styles.restaurantName}>{item.name}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.rating}>
              {item.rating.toFixed(1)} <Text style={styles.star}>★</Text>
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.priceLevel}>
              {'$'.repeat(item.price_level)}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.distance}>
              {formatDistance(item.distance_meters)}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveBookmark(item.restaurant_id)}
      >
        <Ionicons
          name="close-circle-outline"
          size={24}
          color={tokens.colors.textTertiary}
        />
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="bookmark-outline"
        size={48}
        color={tokens.colors.textTertiary}
      />
      <Text style={styles.emptyTitle}>No Bookmarks Yet</Text>
      <Text style={styles.emptySubtitle}>
        Save your favorite restaurants to find them easily later.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookmarks</Text>
        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
          <Ionicons
            name="person-circle"
            size={32}
            color={tokens.colors.primary}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          renderItem={renderBookmarkCard}
          keyExtractor={(item) => item.restaurant_id}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
  },
  headerTitle: {
    fontSize: tokens.typography.h2.fontSize,
    fontWeight: tokens.typography.h2.fontWeight,
    color: tokens.colors.textHeading,
  },
  profileButton: {
    padding: tokens.spacing.sm,
  },
  listContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxl,
    flexGrow: 1,
  },
  bookmarkCard: {
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...tokens.shadows.sm,
  },
  cardContent: {
    flex: 1,
  },
  restaurantName: {
    fontSize: tokens.typography.bodyBold.fontSize,
    fontWeight: tokens.typography.bodyBold.fontWeight,
    color: tokens.colors.textHeading,
    marginBottom: tokens.spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: tokens.spacing.lg,
  },
  metaItem: {
    justifyContent: 'center',
  },
  rating: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: '600',
    color: tokens.colors.primary,
  },
  star: {
    color: tokens.colors.primary,
  },
  priceLevel: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  distance: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: '500',
    color: tokens.colors.textSecondary,
  },
  removeButton: {
    padding: tokens.spacing.sm,
    marginLeft: tokens.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
  },
  emptyTitle: {
    fontSize: tokens.typography.h4.fontSize,
    fontWeight: tokens.typography.h4.fontWeight,
    color: tokens.colors.textHeading,
    marginTop: tokens.spacing.lg,
  },
  emptySubtitle: {
    fontSize: tokens.typography.body.fontSize,
    fontWeight: '400',
    color: tokens.colors.textSecondary,
    marginTop: tokens.spacing.md,
    textAlign: 'center',
    lineHeight: 22,
  },
});
