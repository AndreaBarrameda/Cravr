import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
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
  description?: string;
  onPress?: () => void;
}

export function RestaurantCard({
  restaurantName,
  matchScore,
  matchReason,
  rating,
  price,
  cuisine = 'Mixed',
  description = '',
  onPress
}: RestaurantCardProps) {
  const priceLevel = '$ ' .repeat(Math.min(Math.ceil(price / 200), 3));
  const isOpen = true; // You can pass this as a prop if available
  const distance = '0.8 km'; // You can calculate this if you have coords

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Image Section - Gradient Placeholder */}
      <LinearGradient
        colors={['#FF8555', '#FF6A2A', '#FF5E4D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.imageContainer}
      >
        {/* Could add actual image here */}
      </LinearGradient>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Restaurant Name */}
        <Text style={styles.restaurantName}>{restaurantName}</Text>

        {/* Description/Tagline */}
        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}

        {/* Meta Info Row - Single Line */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {rating.toFixed(1)} <Text style={styles.metaIcon}>⭐</Text>
          </Text>
          <Text style={styles.metaSeparator}>•</Text>
          <Text style={styles.metaText}>{priceLevel}</Text>
          <Text style={styles.metaSeparator}>•</Text>
          <Text style={styles.metaText}>{distance}</Text>
          {isOpen && (
            <>
              <Text style={styles.metaSeparator}>•</Text>
              <Text style={styles.metaOpen}>
                <Text style={styles.metaIcon}>✓</Text> Open now
              </Text>
            </>
          )}
        </View>

        {/* Tags/Chips */}
        <View style={styles.tagsContainer}>
          {cuisine && cuisine !== 'Mixed' && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{cuisine}</Text>
            </View>
          )}
          {matchReason && (
            <View style={styles.tag}>
              <Text style={styles.tagText} numberOfLines={1}>
                {/* Extract meaningful keywords from match reason */}
                {matchReason.includes('rated') ? 'Highly Rated' :
                 matchReason.includes('favorite') ? 'Favorite' :
                 matchReason.includes('gem') ? 'Hidden Gem' :
                 'Popular'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.xl,
    overflow: 'hidden',
    ...tokens.shadows.md,
    borderWidth: 1,
    borderColor: tokens.colors.border
  },
  imageContainer: {
    width: '100%',
    height: 240,
    backgroundColor: tokens.colors.primary
  },
  content: {
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: tokens.colors.textPrimary
  },
  description: {
    fontSize: 13,
    fontWeight: '400',
    color: tokens.colors.textSecondary,
    lineHeight: 18
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    flexWrap: 'wrap'
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.textPrimary
  },
  metaIcon: {
    fontSize: 12
  },
  metaSeparator: {
    fontSize: 12,
    color: tokens.colors.textTertiary,
    fontWeight: '400'
  },
  metaOpen: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.accentGreen
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    flexWrap: 'wrap',
    marginTop: tokens.spacing.sm
  },
  tag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.textSecondary
  }
});
