import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DiscoverStackParamList } from '../../App';
import { ScreenContainer } from '../components/UI';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';

type Props = NativeStackScreenProps<DiscoverStackParamList, 'SoloCheck'>;

export function SoloCheckScreen({ route, navigation }: Props) {
  const { restaurantId, dishId, cravingId, cuisine } = route.params;
  const { setState } = useAppState();

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
      <Text style={styles.title}>Are you dining solo tonight?</Text>

      <View style={styles.card}>
        <TouchableOpacity style={styles.option} onPress={() => goReservation('group')}>
          <Text style={styles.optionTitle}>No, booking for me/us</Text>
          <Text style={styles.optionText}>Skip Crave Connect and go straight to booking.</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.option} onPress={goCraveConnect}>
          <Text style={styles.optionTitle}>Yes, Crave Connect</Text>
          <Text style={styles.optionText}>
            See solo diners with similar cravings near you. Food-first, not dating.
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 24
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  option: {
    paddingVertical: 4
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  optionText: {
    fontSize: 14,
    color: '#6B6B6B'
  },
  divider: {
    height: 1,
    backgroundColor: '#F3E4DA',
    marginVertical: 16
  }
});

