import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DiscoverStackParamList } from '../../App';
import { ScreenContainer, CravrButton } from '../components/UI';
import { api } from '../api/client';

type Props = NativeStackScreenProps<DiscoverStackParamList, 'Confirmation'>;

export function ConfirmationScreen({ route, navigation }: Props) {
  const { reservationId } = route.params;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getReservation(reservationId);
        setData(res);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reservationId]);

  if (loading) {
    return (
      <ScreenContainer>
        <ActivityIndicator color="#FF6A2A" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.center}>
        <Text style={styles.title}>You&apos;re booked</Text>
        <Text style={styles.subtitle}>
          Reservation {data?.id} {data?.time ? `at ${data.time}` : ''}
        </Text>
      </View>

      <View style={styles.footer}>
        <CravrButton
          label="Back to start"
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'SplashCraving' }] })}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#161616',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center'
  },
  footer: {
    marginTop: 'auto'
  }
});

