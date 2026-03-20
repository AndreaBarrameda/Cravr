import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '../theme/tokens';

interface RestaurantCardProps {
  restaurantName: string;
  matchScore: number;
  matchReason: string;
  rating: number;
  price: number;
  cuisine?: string;
  onSwipeYes?: () => void;
  onSwipeNo?: () => void;
}

export function RestaurantCard({
  restaurantName,
  matchScore,
  matchReason,
  rating,
  price,
  cuisine = 'Mixed',
  onSwipeYes,
  onSwipeNo
}: RestaurantCardProps) {
  const [swipeIntent, setSwipeIntent] = useState<'yes' | 'no' | null>(null);
  const panX = new Animated.Value(0);

  const screenWidth = Dimensions.get('window').width;
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, { dx }) => {
      panX.setValue(dx);
      // Show swipe intent based on direction
      if (dx > 50) {
        setSwipeIntent('yes');
      } else if (dx < -50) {
        setSwipeIntent('no');
      } else {
        setSwipeIntent(null);
      }
    },
    onPanResponderRelease: (evt, { dx }) => {
      if (dx > 100 && onSwipeYes) {
        onSwipeYes();
      } else if (dx < -100 && onSwipeNo) {
        onSwipeNo();
      } else {
        Animated.spring(panX, {
          toValue: 0,
          useNativeDriver: true
        }).start();
        setSwipeIntent(null);
      }
    }
  });

  const isHighMatch = matchScore >= 0.8;
  const matchPercent = Math.round(matchScore * 100);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          transform: [{ translateX: panX }],
          opacity: Animated.add(1, Animated.divide(panX, screenWidth * 2))
        }
      ]}
    >
      {/* Hero background with gradient overlay */}
      <LinearGradient
        colors={[
          'rgba(26, 26, 26, 0)',
          'rgba(26, 26, 26, 0.4)',
          'rgba(26, 26, 26, 0.72)'
        ]}
        locations={[0, 0.3, 1]}
        style={styles.heroContainer}
      >
        {/* Top info: Cuisine chip + Match badge */}
        <View style={styles.topRow}>
          <View style={styles.cuisineChip}>
            <Text style={styles.cuisineText}>{cuisine}</Text>
          </View>
          {isHighMatch && (
            <View style={styles.matchBadge}>
              <Text style={styles.matchBadgeText}>✨ {matchPercent}%</Text>
            </View>
          )}
        </View>

        {/* Main content - centered vertically in gradient zone */}
        <View style={styles.contentZone}>
          <Text style={styles.restaurantName}>{restaurantName}</Text>

          {/* Stats row - pill badges */}
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statIcon}>⭐</Text>
              <Text style={styles.statText}>{rating.toFixed(1)}</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statText}>₱{price.toFixed(0)}</Text>
            </View>
          </View>

          {/* Match reason with accent bar */}
          <View style={styles.reasonContainer}>
            <View style={styles.accentBar} />
            <Text style={styles.reasonText}>{matchReason}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Swipe intent overlays */}
      {swipeIntent === 'yes' && (
        <View style={[styles.swipeOverlay, styles.swipeYesOverlay]}>
          <Text style={styles.swipeText}>YUM! 💚</Text>
        </View>
      )}
      {swipeIntent === 'no' && (
        <View style={[styles.swipeOverlay, styles.swipeNoOverlay]}>
          <Text style={styles.swipeText}>PASS ✕</Text>
        </View>
      )}

      {/* Bottom action hint */}
      <View style={styles.bottomHint}>
        <Text style={styles.hintText}>← Swipe to decide →</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.lg,
    borderRadius: tokens.radius.xl,
    overflow: 'hidden',
    backgroundColor: tokens.colors.backgroundLight,
    ...tokens.shadows.xl
  },
  heroContainer: {
    minHeight: 420,
    padding: tokens.spacing.xl,
    justifyContent: 'space-between',
    paddingBottom: tokens.spacing.xxxl
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  cuisineChip: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  cuisineText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.textInverse
  },
  matchBadge: {
    backgroundColor: tokens.colors.accentGreen,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md
  },
  matchBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.backgroundLight
  },
  contentZone: {
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: tokens.colors.textInverse,
    marginBottom: tokens.spacing.lg
  },
  statsRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.lg
  },
  statPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  statIcon: {
    fontSize: 14
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.textInverse
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    borderLeftWidth: 3,
    borderLeftColor: tokens.colors.primary
  },
  accentBar: {
    width: 3,
    height: '100%',
    backgroundColor: tokens.colors.primary
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: tokens.colors.textInverse,
    fontStyle: 'italic'
  },
  swipeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: tokens.radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  swipeYesOverlay: {
    backgroundColor: 'rgba(34, 197, 94, 0.85)'
  },
  swipeNoOverlay: {
    backgroundColor: 'rgba(239, 68, 68, 0.85)'
  },
  swipeText: {
    fontSize: 32,
    fontWeight: '700',
    color: tokens.colors.textInverse
  },
  bottomHint: {
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.md,
    backgroundColor: tokens.colors.backgroundLight,
    alignItems: 'center'
  },
  hintText: {
    fontSize: 12,
    color: tokens.colors.textTertiary,
    fontWeight: '500'
  }
});
