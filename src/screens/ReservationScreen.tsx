import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { ScreenContainer, CravrButton } from '../components/UI';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Reservation'>;

export function ReservationScreen({ route, navigation }: Props) {
  const { restaurantId, dishId, diningMode, matchId } = route.params;
  const { setState } = useAppState();
  const [time, setTime] = useState('2026-03-12T19:30:00-08:00');
  const [partySize, setPartySize] = useState(
    diningMode === 'crave_connect' ? 2 : 1
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    try {
      setLoading(true);
      const result = await api.createReservation({
        restaurant_id: restaurantId,
        dish_id: dishId,
        time,
        party_size: partySize,
        dining_mode: diningMode,
        match_id: matchId,
        notes
      });
      setState((prev) => ({ ...prev, reservationId: result.reservation_id }));
      navigation.navigate('Confirmation', {
        reservationId: result.reservation_id
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Reservation</Text>
      <Text style={styles.subtitle}>Restaurant: {restaurantId}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Time (ISO for now)</Text>
        <TextInput
          style={styles.input}
          value={time}
          onChangeText={setTime}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Party size</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={String(partySize)}
          onChangeText={(t) =>
            setPartySize(Number.parseInt(t || '1', 10) || 1)
          }
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Allergies, seating, etc."
        />
      </View>

      <View style={styles.footer}>
        <CravrButton
          label="Confirm booking"
          onPress={onConfirm}
          loading={loading}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 24
  },
  field: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4
  },
  input: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F3D9C7'
  },
  footer: {
    marginTop: 'auto'
  }
});

