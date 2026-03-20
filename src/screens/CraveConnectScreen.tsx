import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DiscoverStackParamList } from '../../App';
import { ScreenContainer } from '../components/UI';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';

type Props = NativeStackScreenProps<DiscoverStackParamList, 'CraveConnect'>;

type Card = {
  candidate_user_id: string;
  profile: { first_name: string; age: number; photo_url: string; verified: boolean };
  craving_summary: string;
  restaurant: { restaurant_id: string; name: string; overlap: string };
  preferred_time: string;
  vibe_tags: string[];
  dining_intent: string;
  distance_meters: number;
};

export function CraveConnectScreen({ route, navigation }: Props) {
  const { soloSessionId } = route.params;
  const { setState } = useAppState();
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getCraveConnectCards(soloSessionId);
        setCards(data.cards);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [soloSessionId]);

  const current = cards[index];

  const swipe = async (direction: 'left' | 'right') => {
    if (!current) return;
    try {
      const res = await api.swipeCraveConnect({
        solo_session_id: soloSessionId,
        candidate_user_id: current.candidate_user_id,
        direction
      });

      if (res.matched && res.match_id) {
        setState((prev) => ({ ...prev, matchId: res.match_id }));
        navigation.navigate('MatchSuccess', { matchId: res.match_id });
        return;
      }
      setIndex((i) => i + 1);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <ActivityIndicator color="#FF6A2A" />
      </ScreenContainer>
    );
  }

  if (!current) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>No solo diners nearby</Text>
        <Text style={styles.subtitle}>
          Try widening your time window or continue with a solo booking.
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Crave Connect</Text>
      <Text style={styles.subtitle}>Food-first matches for your craving.</Text>

      <View style={styles.card}>
        <Text style={styles.name}>
          {current.profile.first_name}, {current.profile.age}
        </Text>
        <Text style={styles.meta}>{current.craving_summary}</Text>
        <Text style={styles.meta}>
          {current.restaurant.name} • {current.preferred_time}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.swipeButton, styles.pass]} onPress={() => swipe('left')}>
          <Text style={styles.swipeTextPass}>Pass</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeButton, styles.like]}
          onPress={() => swipe('right')}
        >
          <Text style={styles.swipeTextLike}>Crave</Text>
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
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 24
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8
  },
  meta: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 4
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto'
  },
  swipeButton: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pass: {
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3C7B0'
  },
  like: {
    marginLeft: 8,
    backgroundColor: '#FF6A2A'
  },
  swipeTextPass: {
    color: '#FF6A2A',
    fontSize: 16,
    fontWeight: '600'
  },
  swipeTextLike: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  }
});

