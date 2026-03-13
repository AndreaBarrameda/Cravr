import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { ScreenContainer, CravrButton } from '../components/UI';

type Props = NativeStackScreenProps<RootStackParamList, 'MatchSuccess'>;

export function MatchSuccessScreen({ route, navigation }: Props) {
  const { matchId } = route.params;

  return (
    <ScreenContainer>
      <View style={styles.center}>
        <Text style={styles.title}>It&apos;s a Crave Match</Text>
        <Text style={styles.subtitle}>
          You&apos;ve both said yes. Chat to coordinate and then lock your booking.
        </Text>
      </View>

      <View style={styles.footer}>
        <CravrButton label="Message" onPress={() => navigation.navigate('Chat', { matchId })} />
        <View style={{ height: 12 }} />
        <CravrButton
          label="Book together"
          variant="secondary"
          onPress={() =>
            navigation.navigate('Reservation', {
              restaurantId: 'rst_mock_1',
              dishId: undefined,
              diningMode: 'crave_connect',
              matchId
            })
          }
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
    marginBottom: 12
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

