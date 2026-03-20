import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { tokens } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

export type PostCardProps = {
  emoji: string;
  text: string;
  restaurantName?: string;
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

export function PostCard({ emoji, text, restaurantName, createdAt }: PostCardProps) {
  const { theme } = useTheme();
  const timeAgo = formatTimeAgo(createdAt);

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.backgroundLight }]}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{emoji}</Text>
        <View style={styles.headerText}>
          <Text style={[styles.text, { color: theme.colors.textPrimary }]} numberOfLines={3}>
            {text}
          </Text>
        </View>
      </View>

      {restaurantName && (
        <Text style={[styles.restaurant, { color: theme.colors.textSecondary }]}>📍 {restaurantName}</Text>
      )}

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
  header: {
    flexDirection: 'row'
  },
  emoji: {
    fontSize: 24,
    marginRight: tokens.spacing.md,
    marginTop: 2
  },
  headerText: {
    flex: 1
  },
  text: {
    fontSize: 15,
    color: tokens.colors.textPrimary,
    lineHeight: 22
  },
  restaurant: {
    fontSize: 13,
    color: tokens.colors.textSecondary,
    marginBottom: tokens.spacing.sm
  },
  timestamp: {
    fontSize: 12,
    color: tokens.colors.textTertiary
  }
});
