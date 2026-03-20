import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { tokens } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { CravrButton } from './UI';

type CreatePostSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  userId?: string;
  onCreatePost: (data: any) => Promise<any>;
  onCreateReview: (data: any) => Promise<any>;
};

export function CreatePostSheet({
  visible,
  onClose,
  onPostCreated,
  userId,
  onCreatePost,
  onCreateReview
}: CreatePostSheetProps) {
  const { theme } = useTheme();
  const [step, setStep] = useState<'choose' | 'post' | 'review'>('choose');
  const [loading, setLoading] = useState(false);

  // Post form state
  const [postText, setPostText] = useState('');
  const [postEmoji, setPostEmoji] = useState('🍜');
  const [postRestaurant, setPostRestaurant] = useState('');

  // Review form state
  const [reviewRestaurant, setReviewRestaurant] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const FOOD_EMOJIS = ['🍜', '🍔', '🍕', '🍣', '🌮', '🥗'];

  const handleClose = () => {
    setStep('choose');
    setPostText('');
    setPostEmoji('🍜');
    setPostRestaurant('');
    setReviewRestaurant('');
    setReviewRating(5);
    setReviewText('');
    onClose();
  };

  const handleCreatePost = async () => {
    if (!postText.trim()) {
      Alert.alert('Error', 'Please enter some text');
      return;
    }
    if (!userId) {
      Alert.alert('Error', 'Not authenticated');
      return;
    }

    try {
      setLoading(true);
      await onCreatePost({
        text: postText,
        emoji: postEmoji,
        restaurantName: postRestaurant || undefined,
        restaurantId: undefined
      });
      Alert.alert('Success', 'Post created!');
      handleClose();
      onPostCreated();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReview = async () => {
    if (!reviewRestaurant.trim()) {
      Alert.alert('Error', 'Please enter a restaurant name');
      return;
    }
    if (!reviewText.trim()) {
      Alert.alert('Error', 'Please enter a review');
      return;
    }
    if (!userId) {
      Alert.alert('Error', 'Not authenticated');
      return;
    }

    try {
      setLoading(true);
      await onCreateReview({
        restaurantName: reviewRestaurant,
        restaurantId: undefined,
        rating: reviewRating,
        text: reviewText
      });
      Alert.alert('Success', 'Review created!');
      handleClose();
      onPostCreated();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          {step === 'choose' && (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>What would you like to share?</Text>
              </View>

              <TouchableOpacity
                style={[styles.choiceCard, { backgroundColor: theme.colors.backgroundLight }]}
                onPress={() => setStep('post')}
              >
                <Text style={styles.choiceEmoji}>📸</Text>
                <Text style={[styles.choiceTitle, { color: theme.colors.textPrimary }]}>Food Post</Text>
                <Text style={[styles.choiceDesc, { color: theme.colors.textSecondary }]}>Share a quick thought about food</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.choiceCard, { backgroundColor: theme.colors.backgroundLight }]}
                onPress={() => setStep('review')}
              >
                <Text style={styles.choiceEmoji}>⭐</Text>
                <Text style={[styles.choiceTitle, { color: theme.colors.textPrimary }]}>Write a Review</Text>
                <Text style={[styles.choiceDesc, { color: theme.colors.textSecondary }]}>Rate and review a restaurant</Text>
              </TouchableOpacity>

              <CravrButton
                label="Cancel"
                onPress={handleClose}
                variant="secondary"
              />
            </ScrollView>
          )}

          {step === 'post' && (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => setStep('choose')}>
                  <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Food Post</Text>
              </View>

              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Choose an emoji</Text>
              <View style={styles.emojiRow}>
                {FOOD_EMOJIS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiButton,
                      { backgroundColor: theme.colors.backgroundLight, borderColor: theme.colors.border },
                      postEmoji === emoji && { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.primaryTint }
                    ]}
                    onPress={() => setPostEmoji(emoji)}
                  >
                    <Text style={styles.emojiButtonText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>What's on your mind?</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.colors.backgroundLight, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                placeholder="Share your food thought..."
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                value={postText}
                onChangeText={setPostText}
              />

              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Restaurant (optional)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.colors.backgroundLight, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                placeholder="Restaurant name..."
                placeholderTextColor={theme.colors.textTertiary}
                value={postRestaurant}
                onChangeText={setPostRestaurant}
              />

              <CravrButton
                label={loading ? 'Creating...' : 'Create Post'}
                onPress={handleCreatePost}
                loading={loading}
              />
              <CravrButton
                label="Cancel"
                onPress={() => setStep('choose')}
                variant="secondary"
              />
            </ScrollView>
          )}

          {step === 'review' && (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => setStep('choose')}>
                  <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Write a Review</Text>
              </View>

              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Restaurant</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.colors.backgroundLight, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                placeholder="Restaurant name..."
                placeholderTextColor={theme.colors.textTertiary}
                value={reviewRestaurant}
                onChangeText={setReviewRestaurant}
              />

              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Rating</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setReviewRating(star)}
                  >
                    <Text style={styles.starButton}>
                      {star <= reviewRating ? '★' : '☆'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Your Review</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.colors.backgroundLight, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                placeholder="What did you think?"
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                value={reviewText}
                onChangeText={setReviewText}
              />

              <CravrButton
                label={loading ? 'Creating...' : 'Create Review'}
                onPress={handleCreateReview}
                loading={loading}
              />
              <CravrButton
                label="Cancel"
                onPress={() => setStep('choose')}
                variant="secondary"
              />
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background
  },
  scrollContent: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxxl
  },
  header: {
    marginBottom: tokens.spacing.xl
  },
  backButton: {
    fontSize: 16,
    color: tokens.colors.primary,
    fontWeight: '600',
    marginBottom: tokens.spacing.md
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: tokens.colors.textPrimary
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.md,
    marginTop: tokens.spacing.lg
  },
  emojiRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.lg
  },
  emojiButton: {
    width: 50,
    height: 50,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: tokens.colors.border
  },
  emojiButtonActive: {
    borderColor: tokens.colors.primary,
    backgroundColor: tokens.colors.primaryTint
  },
  emojiButtonText: {
    fontSize: 28
  },
  textInput: {
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    fontSize: 14,
    color: tokens.colors.textPrimary,
    minHeight: 100,
    marginBottom: tokens.spacing.lg
  },
  ratingRow: {
    flexDirection: 'row',
    gap: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg
  },
  starButton: {
    fontSize: 40,
    color: tokens.colors.primary
  },
  choiceCard: {
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.xl,
    marginBottom: tokens.spacing.lg,
    alignItems: 'center',
    ...tokens.shadows.sm
  },
  choiceEmoji: {
    fontSize: 48,
    marginBottom: tokens.spacing.md
  },
  choiceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.sm
  },
  choiceDesc: {
    fontSize: 14,
    color: tokens.colors.textSecondary,
    textAlign: 'center'
  }
});
