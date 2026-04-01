import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAppState } from '../state/AppStateContext';
import { useTheme } from '../theme/useTheme';
import {
  updateUserBio,
  getUserReviews,
  getBookmarkedRestaurants,
  type FoodReview,
  type BookmarkedRestaurant
} from '../services/firebaseClient';
import { tokens } from '../theme/tokens';

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { state, setState } = useAppState();
  const { theme } = useTheme();

  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState(state.userProfile?.bio || 'On a mission to find the best handmade pasta in the city. Sucker for a spicy kick and natural wines. 🍝');
  const [savingBio, setSavingBio] = useState(false);
  const [activeTab, setActiveTab] = useState<'reviews' | 'bookmarks'>('reviews');
  const [reviews, setReviews] = useState<(FoodReview & { id: string })[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkedRestaurant[]>([]);
  const [loading, setLoading] = useState(false);

  const name = state.userProfile?.name || 'Alex Chef-in-Training';
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const userId = state.authUser?.id;

  const loadFeed = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      if (activeTab === 'reviews') {
        const result = await getUserReviews(userId);
        setReviews(result?.reviews || []);
      } else {
        const result = await getBookmarkedRestaurants(userId);
        setBookmarks(Array.isArray(result) ? result : result?.bookmarks || []);
      }
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, activeTab]);

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed])
  );

  const handleSaveBio = async () => {
    if (!userId) return;
    try {
      setSavingBio(true);
      await updateUserBio(userId, bioText);
      setState((prev: any) => ({
        ...prev,
        userProfile: { ...prev.userProfile, bio: bioText, name: prev.userProfile?.name || '' }
      }));
      setEditingBio(false);
      Alert.alert('Success', 'Bio updated');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save bio');
    } finally {
      setSavingBio(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundLight, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>The Social Epicurean</Text>
        {navigation.canGoBack() ? (
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerIconSpacer} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Avatar */}
          <LinearGradient
            colors={[tokens.colors.primary, '#FF3D00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>

          {/* Name + PRO Badge */}
          <View style={styles.nameRow}>
            <Text style={[styles.profileName, { color: theme.colors.textPrimary }]}>{name}</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </View>

          {/* Bio */}
          {!editingBio ? (
            <TouchableOpacity onPress={() => setEditingBio(true)}>
              <Text style={[styles.bioText, { color: theme.colors.textSecondary }]}>{bioText}</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <TextInput
                style={[styles.bioInput, { backgroundColor: theme.colors.backgroundLight, color: theme.colors.textPrimary, borderColor: tokens.colors.primary }]}
                multiline
                value={bioText}
                onChangeText={setBioText}
                editable={!savingBio}
              />
              <View style={styles.bioBtnRow}>
                <TouchableOpacity style={[styles.bioBtn, { backgroundColor: tokens.colors.primary }]} onPress={handleSaveBio} disabled={savingBio}>
                  {savingBio ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.bioBtnText}>Save</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.bioBtn, styles.bioCancel]} onPress={() => setEditingBio(false)} disabled={savingBio}>
                  <Text style={[styles.bioBtnText, { color: theme.colors.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Stats */}
          <View style={[styles.statsRow, { borderColor: theme.colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>12</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>REVIEWS</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>45</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>BOOKMARKS</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>8</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>SOLO SESSIONS</Text>
            </View>
          </View>

          {/* Taste Buds */}
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.backgroundLight }]}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Taste Buds</Text>
              <TouchableOpacity>
                <Text style={styles.editLink}>EDIT</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tagsRow}>
              {['Spicy Ramen', 'Wood-fired Pizza', 'Artisan Coffee', 'Natural Wine'].map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: tokens.colors.primaryTint, borderColor: tokens.colors.border }]}>
                  <Text style={[styles.tagText, { color: tokens.colors.primary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Spice Meter */}
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.backgroundLight }]}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>SPICE LEVEL METER</Text>
              <Text style={{ color: tokens.colors.primary, fontSize: 12, fontWeight: '600' }}>Extra Hot</Text>
            </View>
            <View style={styles.meterTrack}>
              <View style={[styles.meterFill, { width: '75%' }]} />
            </View>
            <View style={styles.meterLabels}>
              <Text style={[styles.meterLabel, { color: theme.colors.textTertiary }]}>MILD</Text>
              <Text style={[styles.meterLabel, { color: theme.colors.textTertiary }]}>TINGLING</Text>
              <Text style={[styles.meterLabel, { color: theme.colors.textTertiary }]}>FIRE</Text>
            </View>
          </View>

          {/* Food Preferences from Swipe Likes */}
          {state.likedDishes && state.likedDishes.length > 0 && (
            <View style={[styles.sectionCard, { backgroundColor: theme.colors.backgroundLight }]}>
              <View style={styles.sectionTitleRow}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Your Food Preferences</Text>
                <Text style={{ color: tokens.colors.primary, fontSize: 12, fontWeight: '600' }}>
                  ❤️ {state.likedDishes.length}
                </Text>
              </View>
              <View style={styles.preferencesRow}>
                {state.likedDishes.slice(0, 4).map((dish, idx) => (
                  <View key={idx} style={[styles.preferenceTag, { backgroundColor: tokens.colors.primaryTint, borderColor: tokens.colors.border }]}>
                    <Text style={[styles.preferenceTagText, { color: tokens.colors.primary }]} numberOfLines={1}>
                      {dish.name.split(' ').slice(0, 2).join(' ')}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.preferencesHint, { color: theme.colors.textSecondary }]}>
                Your recently liked dishes from Swipe
              </Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && { color: tokens.colors.primary }]}>My Reviews</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'bookmarks' && styles.tabActive]}
            onPress={() => setActiveTab('bookmarks')}
          >
            <Text style={[styles.tabText, activeTab === 'bookmarks' && { color: tokens.colors.primary }]}>Saved Gems</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading && <ActivityIndicator size="large" color={tokens.colors.primary} style={styles.loader} />}

        {!loading && activeTab === 'bookmarks' && (
          <View>
            {bookmarks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🔖</Text>
                <Text style={[styles.emptyText, { color: theme.colors.textPrimary }]}>No saved restaurants yet</Text>
              </View>
            ) : (
              bookmarks.map((bookmark) => (
                <View key={bookmark.restaurant_id} style={[styles.itemCard, { backgroundColor: theme.colors.backgroundLight, borderColor: theme.colors.border }]}>
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemName, { color: theme.colors.textPrimary }]}>{bookmark.name}</Text>
                    <Text style={[styles.itemMeta, { color: theme.colors.textSecondary }]}>
                      {bookmark.rating?.toFixed(1) || '0'} ★ • {'$'.repeat(bookmark.price_level || 1)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {!loading && activeTab === 'reviews' && (
          <View>
            {reviews.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>⭐</Text>
                <Text style={[styles.emptyText, { color: theme.colors.textPrimary }]}>No reviews yet</Text>
              </View>
            ) : (
              reviews.map((review) => (
                <View key={review.id} style={[styles.itemCard, { backgroundColor: theme.colors.backgroundLight, borderColor: theme.colors.border }]}>
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemName, { color: theme.colors.textPrimary }]}>{review.restaurantName}</Text>
                    <View style={styles.starRow}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Text key={i} style={{ color: i < (review.rating || 0) ? tokens.colors.primary : theme.colors.border, fontSize: 12 }}>
                          ★
                        </Text>
                      ))}
                    </View>
                    <Text numberOfLines={2} style={[styles.reviewText, { color: theme.colors.textSecondary }]}>
                      {review.text}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
    borderBottomWidth: 1,
  },
  headerIconSpacer: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.xl,
    alignItems: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: tokens.colors.textInverse,
    letterSpacing: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: tokens.spacing.md,
  },
  proBadge: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.full,
  },
  proBadgeText: {
    color: tokens.colors.textInverse,
    fontWeight: '700',
    fontSize: 10,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: tokens.spacing.lg,
  },
  bioInput: {
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    minHeight: 80,
    marginBottom: tokens.spacing.md,
  },
  bioBtnRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  bioBtn: {
    flex: 1,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
  },
  bioCancel: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  bioBtnText: {
    color: tokens.colors.textInverse,
    fontWeight: '600',
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    marginBottom: tokens.spacing.xl,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: tokens.spacing.lg,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginTop: tokens.spacing.xs,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  sectionCard: {
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    ...tokens.shadows.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  editLink: {
    color: tokens.colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  tag: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  meterTrack: {
    height: 8,
    backgroundColor: tokens.colors.primaryTint,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: tokens.spacing.md,
  },
  meterFill: {
    height: '100%',
    backgroundColor: tokens.colors.primary,
  },
  meterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meterLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    marginBottom: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
  },
  tabActive: {
    borderBottomWidth: 2.5,
    borderBottomColor: tokens.colors.primary,
  },
  tabText: {
    fontWeight: '600',
    fontSize: 14,
  },
  loader: {
    marginVertical: tokens.spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: tokens.spacing.md,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
  },
  itemCard: {
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    marginHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    borderWidth: 1,
    ...tokens.shadows.sm,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: tokens.spacing.xs,
  },
  itemMeta: {
    fontSize: 12,
    marginBottom: tokens.spacing.sm,
  },
  reviewText: {
    fontSize: 12,
    lineHeight: 16,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: tokens.spacing.sm,
  },
  preferencesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  preferenceTag: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  preferenceTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  preferenceCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  preferencesHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: tokens.spacing.sm,
  },
});
