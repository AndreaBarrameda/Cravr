import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DiscoverStackParamList } from '../../App';
import { ScreenContainer } from '../components/UI';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';
import { tokens } from '../theme/tokens';

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

type OpenTable = {
  id: string;
  restaurantName: string;
  cuisine: string;
  timeLabel: string;
  attendees: number;
  spotsLeft: number;
  photoUrl: string;
};

export function CraveConnectScreen({ route, navigation }: Props) {
  const { soloSessionId } = route.params;
  const { setState } = useAppState();
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const openTables = useMemo<OpenTable[]>(() => ([
    {
      id: 'ot_1',
      restaurantName: 'Tartufo Ristorante - BGC',
      cuisine: 'Italian',
      timeLabel: 'Today, 7:30 PM',
      attendees: 4,
      spotsLeft: 1,
      photoUrl: 'https://images.unsplash.com/photo-1611270634834-f8d0d8c84714?w=900&h=600&fit=crop&q=80'
    },
    {
      id: 'ot_2',
      restaurantName: 'Bolero | BGC Restaurant',
      cuisine: 'Bar',
      timeLabel: 'Tomorrow, 8:00 PM',
      attendees: 3,
      spotsLeft: 2,
      photoUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=900&h=600&fit=crop&q=80'
    },
    {
      id: 'ot_3',
      restaurantName: 'Kanto Freestyle Breakfast',
      cuisine: 'Filipino',
      timeLabel: 'Fri, 8:30 PM',
      attendees: 2,
      spotsLeft: 2,
      photoUrl: 'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=900&h=600&fit=crop&q=80'
    }
  ]), []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getCraveConnectCards(soloSessionId);
        setCards(data.cards);
      } catch (e) {
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
      console.error(e);
    }
  };

  const joinOpenTable = (table: OpenTable) => {
    navigation.navigate('RestaurantDetail', {
      restaurantId: table.id,
      cravingId: 'crave_connect',
      cuisine: table.cuisine.toLowerCase(),
    });
  };

  if (loading) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={tokens.colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Crave Connect</Text>
        <Text style={styles.subtitle}>Join open tables or meet diners with similar cravings.</Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Open Tables</Text>
          <Text style={styles.sectionSubtitle}>Join a meal happening nearby.</Text>
        </View>

        {openTables.map((table) => (
          <View key={table.id} style={styles.tableCard}>
            <View style={styles.tableImageWrap}>
              <Image source={{ uri: table.photoUrl }} style={styles.tableImage} />
              <Text style={styles.tableName}>{table.restaurantName}</Text>
            </View>

            <View style={styles.tableBody}>
              <View style={styles.tableTags}>
                <Text style={styles.tableCuisine}>{table.cuisine.toUpperCase()}</Text>
                <Text style={styles.tableDot}>•</Text>
                <Text style={styles.tableTrend}>OPEN TABLE</Text>
              </View>

              <View style={styles.tableMetaRow}>
                <Text style={styles.tableMetaText}>{table.timeLabel}</Text>
                <Text style={styles.tableMetaText}>
                  {'👤'.repeat(Math.min(table.attendees, 3))}{table.attendees > 3 ? ` +${table.attendees - 3}` : ''}
                </Text>
              </View>

              {table.spotsLeft === 1 ? (
                <Text style={styles.spotsWarning}>Only 1 spot left</Text>
              ) : null}

              <TouchableOpacity style={styles.joinButton} onPress={() => joinOpenTable(table)}>
                <Text style={styles.joinButtonText}>Join Table</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>People You Might Dine With</Text>
          <Text style={styles.sectionSubtitle}>Food-first matches for your craving.</Text>
        </View>

        {current ? (
          <>
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
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No diner matches yet</Text>
            <Text style={styles.emptyCopy}>
              Open tables can still help you find company while the network grows.
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: tokens.colors.textHeading,
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: tokens.colors.textSecondary,
    marginBottom: 24
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: tokens.colors.textHeading,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: tokens.colors.textSecondary,
    marginBottom: 8,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5
  },
  tableImageWrap: {
    height: 148,
    position: 'relative',
  },
  tableImage: {
    width: '100%',
    height: '100%',
    backgroundColor: tokens.colors.primaryTint,
  },
  tableName: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tableBody: {
    padding: 20,
  },
  tableTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tableCuisine: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  tableDot: {
    color: tokens.colors.textTertiary,
  },
  tableTrend: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  tableMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tableMetaText: {
    fontSize: 14,
    color: tokens.colors.textSecondary,
    fontWeight: '500',
  },
  spotsWarning: {
    fontSize: 12,
    color: tokens.colors.primary,
    fontWeight: '700',
    marginBottom: 12,
  },
  joinButton: {
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.primary,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
    color: tokens.colors.textSecondary,
    marginBottom: 4
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 24,
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
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.textHeading,
    marginBottom: 8,
  },
  emptyCopy: {
    fontSize: 14,
    color: tokens.colors.textSecondary,
    lineHeight: 20,
  },
});
