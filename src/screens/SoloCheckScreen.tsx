import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DiscoverStackParamList } from '../../App';
import { ScreenContainer } from '../components/UI';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';
import { useTheme } from '../theme/useTheme';
import { tokens } from '../theme/tokens';

type Props = NativeStackScreenProps<DiscoverStackParamList, 'SoloCheck'>;

export function SoloCheckScreen({ route, navigation }: Props) {
  const { restaurantId, dishId, cravingId, cuisine } = route.params;
  const { setState } = useAppState();
  const { theme } = useTheme();

  const goReservation = (diningMode: 'solo' | 'group') => {
    navigation.navigate('Reservation', {
      restaurantId,
      dishId,
      diningMode
    });
  };

  const goCraveConnect = async () => {
    try {
      const body = {
        craving_id: cravingId,
        cuisine,
        restaurant_id: restaurantId,
        dish_id: dishId,
        location: { lat: 34.0522, lng: -118.2437 },
        time_window: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        },
        vibe_tags: [],
        dining_intent: 'friendly_chat'
      };
      const result = await api.createSoloSession(body);
      setState((prev) => ({ ...prev, soloSessionId: result.solo_session_id }));
      navigation.navigate('CraveConnect', { soloSessionId: result.solo_session_id });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Are you dining solo tonight?</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Choose how you'd like to dine</Text>

      {/* Booking Solo */}
      <TouchableOpacity
        style={[styles.optionCard, { backgroundColor: theme.colors.backgroundLight, borderColor: theme.colors.border }]}
        onPress={() => goReservation('group')}
        activeOpacity={0.7}
      >
        <View style={styles.optionIconContainer}>
          <Text style={styles.optionIcon}>🍽️</Text>
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, { color: theme.colors.textPrimary }]}>Just booking</Text>
          <Text style={[styles.optionText, { color: theme.colors.textSecondary }]}>
            Skip straight to making a reservation
          </Text>
        </View>
        <Text style={styles.optionArrow}>→</Text>
      </TouchableOpacity>

      {/* Crave Connect */}
      <TouchableOpacity
        style={[styles.optionCardPrimary, { backgroundColor: tokens.colors.primary }]}
        onPress={goCraveConnect}
        activeOpacity={0.85}
      >
        <View style={styles.optionIconContainerPrimary}>
          <Text style={styles.optionIcon}>👥</Text>
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, { color: tokens.colors.textInverse }]}>Connect with others</Text>
          <Text style={[styles.optionText, { color: 'rgba(255,255,255,0.85)' }]}>
            Meet solo diners with your cravings nearby
          </Text>
        </View>
        <Text style={[styles.optionArrow, { color: tokens.colors.textInverse }]}>→</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: tokens.spacing.sm,
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: tokens.spacing.xxxl,
    opacity: 0.7
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    borderWidth: 1,
    ...tokens.shadows.sm
  },
  optionCardPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    ...tokens.shadows.md
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 106, 42, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing.lg
  },
  optionIconContainerPrimary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing.lg
  },
  optionIcon: {
    fontSize: 28
  },
  optionContent: {
    flex: 1
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: tokens.spacing.xs,
    lineHeight: 22
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18
  },
  optionArrow: {
    fontSize: 20,
    color: tokens.colors.primary,
    marginLeft: tokens.spacing.md
  }
});

