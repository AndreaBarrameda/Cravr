import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { tokens } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

export type ReviewCardProps = {
  restaurantName: string;
  rating: number;
  text: string;
  createdAt?: Timestamp;
};

function formatTimeAgo(timestamp?: Timestamp): string {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function renderStars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

export function ReviewCard({ restaurantName, rating, text, createdAt }: ReviewCardProps) {
  const { theme } = useTheme();
  const timeAgo = formatTimeAgo(createdAt);

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.backgroundLight }]}>
      <Text style={[styles.restaurantName, { color: theme.colors.textPrimary }]}>{restaurantName}</Text>

      <View style={styles.ratingContainer}>
        <Text style={styles.rating}>{renderStars(rating)}</Text>
      </View>

      <Text style={[styles.text, { color: theme.colors.textSecondary }]} numberOfLines={5}>
        {text}
      </Text>

      {timeAgo && <Text style={[styles.timestamp, { color: theme.colors.textTertiary }]}>{timeAgo}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    ...tokens.shadows.sm
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.md
  },
  ratingContainer: {
    marginBottom: tokens.spacing.md
  },
  rating: {
    fontSize: 16,
    color: tokens.colors.primary
  },
  text: {
    fontSize: 14,
    color: tokens.colors.textSecondary,
    lineHeight: 20,
    marginBottom: tokens.spacing.sm
  },
  timestamp: {
    fontSize: 12,
    color: tokens.colors.textTertiary
  }
});
