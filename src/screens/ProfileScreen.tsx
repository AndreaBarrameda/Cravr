import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from '../../App';
import { CravrButton } from '../components/UI';
import { PostCard } from '../components/PostCard';
import { ReviewCard } from '../components/ReviewCard';
import { CreatePostSheet } from '../components/CreatePostSheet';
import { SettingsMenu } from '../components/SettingsMenu';
import { useAppState } from '../state/AppStateContext';
import { useTheme } from '../theme/useTheme';
import { getLocationWithUserConsent } from '../services/locationService';
import {
  logout,
  updateUserBio,
  getUserPosts,
  getUserReviews,
  createPost,
  createReview,
  type FoodPost,
  type FoodReview
} from '../services/firebaseClient';
import { tokens } from '../theme/tokens';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function ProfileScreen({ navigation }: Props) {
  const { state, setState } = useAppState();
  const { theme, isDark } = useTheme();

  // Bio editing
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState(state.userProfile?.bio || '');
  const [savingBio, setSavingBio] = useState(false);

  // Feed
  const [activeTab, setActiveTab] = useState<'posts' | 'reviews'>('posts');
  const [posts, setPosts] = useState<(FoodPost & { id: string })[]>([]);
  const [reviews, setReviews] = useState<(FoodReview & { id: string })[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  // Create post sheet
  const [sheetVisible, setSheetVisible] = useState(false);

  // Settings menu
  const [menuVisible, setMenuVisible] = useState(false);

  const name = state.userProfile?.name || 'User';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const userId = state.authUser?.id;

  // Load feed when tab changes or screen is focused
  const loadFeed = useCallback(async () => {
    if (!userId) return;
    try {
      setLoadingFeed(true);
      if (activeTab === 'posts') {
        const { posts: loadedPosts } = await getUserPosts(userId);
        setPosts(loadedPosts);
      } else {
        const { reviews: loadedReviews } = await getUserReviews(userId);
        setReviews(loadedReviews);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load feed:', error);
    } finally {
      setLoadingFeed(false);
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
      setState((prev) => ({
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

  const handleCancelBio = () => {
    setBioText(state.userProfile?.bio || '');
    setEditingBio(false);
  };

  const handleCreatePost = async (data: any) => {
    if (!userId) return;
    const result = await createPost(userId, data);
    if (result.error) throw new Error(result.error);
  };

  const handleCreateReview = async (data: any) => {
    if (!userId) return;
    const result = await createReview(userId, data);
    if (result.error) throw new Error(result.error);
  };

  const handleNavigateOnboarding = () => {
    setState((prev) => ({
      ...prev,
      onboardingComplete: false
    }));
    navigation.navigate('OnboardingWelcome');
  };

  const handleLogoutNav = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Hamburger Menu Header */}
      <View style={[styles.topBar, { backgroundColor: theme.colors.backgroundLight, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.topBarTitle, { color: theme.colors.textPrimary }]}>Profile</Text>
        <TouchableOpacity
          style={styles.hamburgerButton}
          onPress={() => setMenuVisible(true)}
        >
          <Text style={styles.hamburgerIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ListHeaderComponent={
          <>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <LinearGradient
                colors={[tokens.colors.primary, '#FF8555']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
              <Text style={[styles.name, { color: theme.colors.textPrimary }]}>{name}</Text>

              {/* Preferences Section */}
              {(state.userProfile?.favoriteCuisine || state.userProfile?.favoriteFood) && (
                <View style={styles.preferencesSection}>
                  <View style={styles.preferencesRow}>
                    {state.userProfile?.favoriteCuisine && (
                      <View style={[styles.preferenceChip, { backgroundColor: tokens.colors.primaryTint, borderColor: tokens.colors.border }]}>
                        <Text style={styles.preferenceEmoji}>🍳</Text>
                        <Text style={[styles.preferenceText, { color: tokens.colors.primary }]}>
                          {state.userProfile.favoriteCuisine}
                        </Text>
                      </View>
                    )}
                    {state.userProfile?.favoriteFood && (
                      <View style={[styles.preferenceChip, { backgroundColor: tokens.colors.primaryTint, borderColor: tokens.colors.border }]}>
                        <Text style={styles.preferenceEmoji}>🍽️</Text>
                        <Text style={[styles.preferenceText, { color: tokens.colors.primary }]}>
                          {state.userProfile.favoriteFood}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Bio Section */}
              <View style={styles.bioSection}>
                {!editingBio ? (
                  <TouchableOpacity
                    style={[styles.bioContainer, { backgroundColor: theme.colors.backgroundLight, borderColor: theme.colors.border }]}
                    onPress={() => setEditingBio(true)}
                  >
                    <Text style={[styles.bioText, { color: theme.colors.textSecondary }]}>
                      {bioText || 'Add a bio... ✏️'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.bioEditContainer}>
                    <TextInput
                      style={[styles.bioInput, { backgroundColor: theme.colors.backgroundLight, color: theme.colors.textPrimary, borderColor: tokens.colors.primary }]}
                      placeholder="Tell us about yourself..."
                      placeholderTextColor={theme.colors.textTertiary}
                      multiline
                      value={bioText}
                      onChangeText={setBioText}
                      editable={!savingBio}
                    />
                    <View style={styles.bioBtnRow}>
                      <TouchableOpacity
                        style={styles.bioBtn}
                        onPress={handleSaveBio}
                        disabled={savingBio}
                      >
                        {savingBio ? (
                          <ActivityIndicator size="small" color={tokens.colors.primary} />
                        ) : (
                          <Text style={styles.bioBtnText}>Save</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.bioBtn, styles.bioBtnCancel, { backgroundColor: theme.colors.backgroundLight, borderColor: theme.colors.border }]}
                        onPress={handleCancelBio}
                        disabled={savingBio}
                      >
                        <Text style={[styles.bioBtnTextCancel, { color: theme.colors.textPrimary }]}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>{posts.length}</Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>Posts</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>{reviews.length}</Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>Reviews</Text>
                </View>
              </View>
            </View>

            {/* Tabs */}
            <View style={[styles.tabsContainer, { borderBottomColor: theme.colors.border }]}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
                onPress={() => setActiveTab('posts')}
              >
                <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive, { color: activeTab === 'posts' ? tokens.colors.primary : theme.colors.textTertiary }]}>
                  Posts
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
                onPress={() => setActiveTab('reviews')}
              >
                <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive, { color: activeTab === 'reviews' ? tokens.colors.primary : theme.colors.textTertiary }]}>
                  Reviews
                </Text>
              </TouchableOpacity>
            </View>

            {/* Feed Header */}
            <View style={styles.feedContainer}>
              {loadingFeed && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={tokens.colors.primary} />
                </View>
              )}

              {!loadingFeed && activeTab === 'posts' && posts.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>🍴</Text>
                  <Text style={[styles.emptyText, { color: theme.colors.textPrimary }]}>No posts yet</Text>
                  <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Share your food thoughts to get started!</Text>
                </View>
              )}

              {!loadingFeed && activeTab === 'reviews' && reviews.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>⭐</Text>
                  <Text style={[styles.emptyText, { color: theme.colors.textPrimary }]}>No reviews yet</Text>
                  <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Write a review to share your experience!</Text>
                </View>
              )}
            </View>
          </>
        }
        data={activeTab === 'posts' ? posts : reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (activeTab === 'posts') {
            const post = item as FoodPost & { id: string };
            return (
              <View style={styles.feedItem}>
                <PostCard
                  emoji={post.emoji}
                  text={post.text}
                  restaurantName={post.restaurantName}
                  createdAt={post.createdAt}
                />
              </View>
            );
          } else {
            const review = item as FoodReview & { id: string };
            return (
              <View style={styles.feedItem}>
                <ReviewCard
                  restaurantName={review.restaurantName}
                  rating={review.rating}
                  text={review.text}
                  createdAt={review.createdAt}
                />
              </View>
            );
          }
        }}
        scrollEnabled
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<View style={styles.footerSpacer} />}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setSheetVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Create Post Sheet */}
      <CreatePostSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onPostCreated={loadFeed}
        userId={userId}
        onCreatePost={handleCreatePost}
        onCreateReview={handleCreateReview}
      />

      {/* Settings Menu */}
      <SettingsMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onLogout={handleLogoutNav}
        onNavigateOnboarding={handleNavigateOnboarding}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderBottomWidth: 1
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  hamburgerButton: {
    padding: tokens.spacing.sm
  },
  hamburgerIcon: {
    fontSize: 24,
    color: tokens.colors.primary
  },
  listContent: {
    paddingBottom: tokens.spacing.xxxl
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.xl,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.lg
  },
  preferencesSection: {
    width: '100%',
    marginBottom: tokens.spacing.lg
  },
  preferencesRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  preferenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    ...tokens.shadows.sm
  },
  preferenceEmoji: {
    fontSize: 16
  },
  preferenceText: {
    fontSize: 14,
    fontWeight: '600'
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
    ...tokens.shadows.lg
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: tokens.colors.textInverse
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.md
  },
  bioSection: {
    width: '100%',
    marginBottom: tokens.spacing.lg
  },
  bioContainer: {
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadows.sm
  },
  bioText: {
    fontSize: 14,
    color: tokens.colors.textSecondary,
    lineHeight: 20
  },
  bioEditContainer: {
    gap: tokens.spacing.md
  },
  bioInput: {
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.primary,
    padding: tokens.spacing.lg,
    fontSize: 14,
    color: tokens.colors.textPrimary,
    minHeight: 80
  },
  bioBtnRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md
  },
  bioBtn: {
    flex: 1,
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.spacing.md,
    alignItems: 'center'
  },
  bioBtnCancel: {
    backgroundColor: tokens.colors.backgroundLight,
    borderWidth: 1,
    borderColor: tokens.colors.border
  },
  bioBtnText: {
    color: tokens.colors.textInverse,
    fontWeight: '600',
    fontSize: 14
  },
  bioBtnTextCancel: {
    color: tokens.colors.textPrimary,
    fontWeight: '600',
    fontSize: 14
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacing.xxl,
    paddingVertical: tokens.spacing.lg
  },
  statItem: {
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: tokens.colors.textPrimary
  },
  statLabel: {
    fontSize: 12,
    color: tokens.colors.textTertiary,
    marginTop: tokens.spacing.xs
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: tokens.colors.border
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: tokens.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
    marginBottom: tokens.spacing.lg
  },
  tab: {
    flex: 1,
    paddingVertical: tokens.spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent'
  },
  tabActive: {
    borderBottomColor: tokens.colors.primary
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.colors.textTertiary
  },
  tabTextActive: {
    color: tokens.colors.primary
  },
  feedContainer: {
    paddingHorizontal: tokens.spacing.xl
  },
  feedItem: {
    paddingHorizontal: tokens.spacing.xl
  },
  loadingContainer: {
    paddingVertical: tokens.spacing.xxxl,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.xxxl
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: tokens.spacing.lg
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.sm
  },
  emptySubtext: {
    fontSize: 14,
    color: tokens.colors.textSecondary
  },
  footerSpacer: {
    height: tokens.spacing.xxxl
  },
  fab: {
    position: 'absolute',
    bottom: tokens.spacing.xxl,
    right: tokens.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: tokens.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...tokens.shadows.lg
  },
  fabText: {
    fontSize: 32,
    color: tokens.colors.textInverse,
    fontWeight: '600',
    lineHeight: 36
  }
});
