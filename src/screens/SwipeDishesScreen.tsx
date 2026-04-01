import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Animated,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../theme/tokens';
import { useAppState, extractFoodPreferences } from '../state/AppStateContext';
import { api } from '../api/client';

interface Dish {
  dish_id: string;
  name: string;
  description?: string;
  photo_url: string | null;
  restaurant_photo_url?: string | null;
  photo_source?: 'dish' | 'restaurant' | 'none';
  price: number;
  match_score: number;
  restaurant_name: string;
  restaurant_id: string;
  cuisine?: string;
}

export function SwipeDishesScreen() {
  const navigation = useNavigation<any>();
  const { state, setState } = useAppState();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [likedDishes, setLikedDishes] = useState<string[]>([]);
  const [imageLoadError, setImageLoadError] = useState<Record<string, boolean>>({});

  const pan = React.useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    loadDishes();
  }, [state.location, state.searchLocation]);

  const buildSwipeQuery = () => {
    const preferenceText = state.foodPreferences?.slice(0, 3).map((item) => item.name).join(', ');
    const likedDishText = state.likedDishes?.slice(-3).map((dish) => dish.name).join(', ');

    return preferenceText || likedDishText || 'popular dishes';
  };

  const loadDishes = async () => {
    try {
      setLoading(true);
      const searchLoc = state.searchLocation || state.location;
      const lat = searchLoc?.latitude ?? 10.3157;
      const lng = searchLoc?.longitude ?? 123.8854;
      const result = await api.discoverDishesByAttributes({
        craving_text: buildSwipeQuery(),
        cuisine: '',
        real_only: false,
        attributes: {
          temperature: null,
          flavor: null,
          texture: null,
          intensity: null,
          occasion: null,
          budget: null,
        },
        location: { lat, lng },
      });

      const swipeDishes = Array.isArray(result?.results)
        ? [...(result.results as Dish[])].sort((a, b) => {
            const scoreDish = (dish: Dish) => {
              let score = 0;
              if (dish.photo_source === 'dish' && dish.photo_url) score += 4;
              if ((dish as Dish & { data_source?: string }).data_source === 'real_menu') score += 3;
              if (dish.photo_source === 'restaurant' && dish.restaurant_photo_url) score += 1;
              return score;
            };

            return scoreDish(b) - scoreDish(a);
          })
        : [];
      setDishes(swipeDishes);
      setCurrentIndex(0);
      setImageLoadError({});
    } catch (error) {
      console.error('Error loading dishes:', error);
    } finally {
      setLoading(false);
    }
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x }]),
      onPanResponderRelease: (e, { dx, vx }) => {
        const swipeThreshold = 50;

        if (dx > swipeThreshold || vx > 0.5) {
          // Swipe right - like
          handleLike();
        } else if (dx < -swipeThreshold || vx < -0.5) {
          // Swipe left - pass
          handlePass();
        } else {
          // Reset
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const handleLike = () => {
    if (currentIndex < dishes.length) {
      const likedDish = dishes[currentIndex];
      setLikedDishes([...likedDishes, likedDish.dish_id]);

      // Save to app context for preference tracking
      setState((prev: any) => {
        const existingLikes = prev.likedDishes || [];
        const newLikedDish = {
          dish_id: likedDish.dish_id,
          name: likedDish.name,
          restaurant_name: likedDish.restaurant_name,
          cuisine: likedDish.cuisine,
          tags: [likedDish.restaurant_name],
          timestamp: Date.now(),
        };

        const updatedLikes = [...existingLikes, newLikedDish];
        const updated = {
          ...prev,
          likedDishes: updatedLikes,
          foodPreferences: extractFoodPreferences(updatedLikes),
        };

        return updated;
      });
    }
    handlePass();
  };

  const handlePass = () => {
    Animated.timing(pan, {
      toValue: { x: 500, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      pan.setValue({ x: 0, y: 0 });
      setCurrentIndex(currentIndex + 1);
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (currentIndex >= dishes.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>🍽️ SWIPE DISHES</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle" size={32} color={tokens.colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>No More Dishes!</Text>
          <Text style={styles.emptySubtitle}>
            You've swiped through all nearby dishes.
          </Text>
          <Text style={styles.emptySubtitle}>
            Liked {likedDishes.length} dishes!
          </Text>
          <TouchableOpacity
            style={styles.reloadButton}
            onPress={loadDishes}
          >
            <Text style={styles.reloadButtonText}>Load More Dishes</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentDish = dishes[currentIndex];
  const imageFailed = imageLoadError[currentDish.dish_id];
  const dishPhotoUrl = !imageFailed ? currentDish.photo_url : null;
  const cardImageUrl = dishPhotoUrl || currentDish.restaurant_photo_url || null;
  const isRestaurantFallback = !dishPhotoUrl && !!currentDish.restaurant_photo_url;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🍽️ SWIPE DISHES</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-circle" size={32} color={tokens.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Counter */}
      <View style={styles.counter}>
        <Text style={styles.counterText}>
          {currentIndex + 1} / {dishes.length}
        </Text>
      </View>

      {/* Visual Feedback */}
      <View style={styles.feedbackRow}>
        <Animated.Text
          style={[
            styles.feedbackText,
            {
              opacity: pan.x.interpolate({
                inputRange: [-100, 0],
                outputRange: [1, 0],
              }),
            },
          ]}
        >
          ← PASS
        </Animated.Text>
        <Animated.Text
          style={[
            styles.feedbackText,
            styles.feedbackLike,
            {
              opacity: pan.x.interpolate({
                inputRange: [0, 100],
                outputRange: [0, 1],
              }),
            },
          ]}
        >
          LIKE →
        </Animated.Text>
      </View>

      {/* Card */}
      <View style={styles.cardContainer}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { translateX: pan.x },
                {
                  rotate: pan.x.interpolate({
                    inputRange: [-200, 0, 200],
                    outputRange: ['-25deg', '0deg', '25deg'],
                  }),
                },
              ],
              opacity: pan.x.interpolate({
                inputRange: [-300, 0, 300],
                outputRange: [0.5, 1, 0.5],
              }),
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Image */}
          {cardImageUrl ? (
            <Image
              source={{ uri: cardImageUrl }}
              style={styles.cardImage}
              onError={() => {
                if (!imageLoadError[currentDish.dish_id]) {
                  setImageLoadError((prev) => ({
                    ...prev,
                    [currentDish.dish_id]: true,
                  }));
                }
              }}
            />
          ) : (
            <View style={[styles.cardImage, styles.imagePlaceholder]}>
              <Ionicons name="restaurant-outline" size={60} color={tokens.colors.primary} />
              <Text style={styles.placeholderText}>Photo unavailable</Text>
            </View>
          )}

          {isRestaurantFallback && (
            <View style={styles.photoSourceBadge}>
              <Text style={styles.photoSourceBadgeText}>Restaurant photo</Text>
            </View>
          )}

          {/* Match Badge */}
          <View style={styles.matchBadge}>
            <Text style={styles.matchText}>
              {Math.round(currentDish.match_score * 100)}% MATCH
            </Text>
          </View>

          {/* Content Overlay */}
          <View style={styles.cardOverlay}>
            <Text style={styles.restaurantName}>{currentDish.restaurant_name}</Text>
            <Text style={styles.dishName}>
              {isRestaurantFallback ? `Suggested dish: ${currentDish.name}` : currentDish.name}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={handlePass}
        >
          <Ionicons name="close" size={32} color={tokens.colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={handleLike}
        >
          <Ionicons name="heart" size={32} color="white" />
        </TouchableOpacity>
      </View>

      {/* Liked Count */}
      <View style={styles.likedCountContainer}>
        <Text style={styles.likedCountText}>
          ❤️ {likedDishes.length} Liked
        </Text>
      </View>
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
  logo: {
    fontSize: 20,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  counter: {
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  feedbackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    height: 30,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.textTertiary,
    letterSpacing: 1,
  },
  feedbackLike: {
    color: tokens.colors.primary,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.xxl,
  },
  card: {
    width: '100%',
    height: 500,
    borderRadius: tokens.radius.xl,
    overflow: 'hidden',
    backgroundColor: tokens.colors.backgroundLight,
    ...tokens.shadows.lg,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.backgroundLight,
  },
  placeholderText: {
    marginTop: tokens.spacing.md,
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  matchBadge: {
    position: 'absolute',
    top: tokens.spacing.lg,
    right: tokens.spacing.lg,
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
  },
  matchText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
  photoSourceBadge: {
    position: 'absolute',
    top: tokens.spacing.lg,
    left: tokens.spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.58)',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.full,
  },
  photoSourceBadgeText: {
    color: tokens.colors.textInverse,
    fontSize: 11,
    fontWeight: '600',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
  },
  restaurantName: {
    color: tokens.colors.textInverse,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: tokens.spacing.xs,
  },
  dishName: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: tokens.spacing.xl,
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...tokens.shadows.md,
  },
  passButton: {
    backgroundColor: tokens.colors.backgroundLight,
    borderWidth: 2,
    borderColor: tokens.colors.border,
  },
  likeButton: {
    backgroundColor: tokens.colors.primary,
  },
  likedCountContainer: {
    alignItems: 'center',
    paddingBottom: tokens.spacing.lg,
  },
  likedCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: tokens.spacing.lg,
  },
  emptyTitle: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: tokens.typography.h3.fontWeight,
    color: tokens.colors.textHeading,
    marginBottom: tokens.spacing.sm,
  },
  emptySubtitle: {
    fontSize: tokens.typography.body.fontSize,
    color: tokens.colors.textSecondary,
    textAlign: 'center',
    marginBottom: tokens.spacing.md,
  },
  reloadButton: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.lg,
    borderRadius: tokens.radius.full,
    marginTop: tokens.spacing.lg,
  },
  reloadButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
