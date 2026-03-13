import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { ScreenContainer, CravrButton } from '../components/UI';
import { useAppState } from '../state/AppStateContext';
import { api } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'RestaurantDetail'>;

type Dish = {
  dish_id: string;
  name: string;
  description: string;
  photo_url: string | null;
  price: number;
  match_score: number;
};

type RestaurantData = {
  restaurant_id: string;
  name: string;
  hero_photo_url: string | null;
  rating: number;
  price_level: number;
  address: string;
  phone: string;
  hours: string;
  distance_meters: number;
  vibe_tags: string[];
};

export function RestaurantDetailScreen({ route, navigation }: Props) {
  const { restaurantId, cravingId, cuisine } = route.params;
  const { state, setState } = useAppState();
  const [loading, setLoading] = useState(true);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);

  // Mock restaurant data - in a real app, this would come from the API
  const restaurantData: RestaurantData = {
    restaurant_id: restaurantId,
    name: 'Phát Phố',
    hero_photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561f1f?w=500&h=500&fit=crop',
    rating: 4.4,
    price_level: 1,
    address: '123 Main St, Los Angeles, CA 90001',
    phone: '(213) 555-1234',
    hours: '11:00 AM - 11:00 PM',
    distance_meters: 2500,
    vibe_tags: ['Authentic', 'Casual']
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const lat = state.location?.latitude ?? 34.0522;
        const lng = state.location?.longitude ?? -118.2437;

        const data = await api.discoverDishes({
          restaurant_id: restaurantId,
          craving_id: cravingId,
          lat,
          lng
        });

        if (data.results && Array.isArray(data.results)) {
          setDishes(data.results);
          if (data.results.length > 0) {
            setSelectedDish(data.results[0]);
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch dishes:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId, cravingId, state.location]);

  const onContinue = () => {
    if (selectedDish) {
      setState((prev) => ({ ...prev, selectedDishId: selectedDish.dish_id }));
      navigation.navigate('SoloCheck', {
        restaurantId,
        dishId: selectedDish.dish_id,
        cravingId,
        cuisine
      });
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator color="#FF6A2A" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ScreenContainer>
        {/* Restaurant Header */}
        {restaurantData.hero_photo_url && (
          <Image
            source={{ uri: restaurantData.hero_photo_url }}
            style={styles.heroImage}
          />
        )}

        <View style={styles.header}>
          <Text style={styles.restaurantName}>{restaurantData.name}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>
              {restaurantData.rating} ★ • {'$'.repeat(restaurantData.price_level)}
            </Text>
          </View>
        </View>

        {/* Location & Hours */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍 Location</Text>
            <Text style={styles.infoValue}>{restaurantData.address}</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: 12 }]}>
            <Text style={styles.infoLabel}>🕐 Hours</Text>
            <Text style={styles.infoValue}>{restaurantData.hours}</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: 12 }]}>
            <Text style={styles.infoLabel}>📞 Phone</Text>
            <Text style={styles.infoValue}>{restaurantData.phone}</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: 12 }]}>
            <Text style={styles.infoLabel}>📏 Distance</Text>
            <Text style={styles.infoValue}>
              {(restaurantData.distance_meters / 1000).toFixed(1)} km away
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Recommended Dishes</Text>

          {dishes.length > 0 ? (
            dishes.map((dish) => (
              <TouchableOpacity
                key={dish.dish_id}
                style={[
                  styles.dishCard,
                  selectedDish?.dish_id === dish.dish_id && styles.dishCardSelected
                ]}
                onPress={() => setSelectedDish(dish)}
              >
                {dish.photo_url && (
                  <Image
                    source={{ uri: dish.photo_url }}
                    style={styles.dishImage}
                  />
                )}
                <View style={styles.dishInfo}>
                  <View style={styles.dishHeader}>
                    <Text style={styles.dishName}>{dish.name}</Text>
                    <Text style={styles.dishPrice}>
                      ${dish.price.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.dishDescription} numberOfLines={2}>
                    {dish.description}
                  </Text>
                  <View style={styles.matchScore}>
                    <Text style={styles.matchScoreText}>
                      ✨ {Math.round(dish.match_score * 100)}% match
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No recommended dishes available
              </Text>
            </View>
          )}
        </View>

        {/* Continue Button */}
        <View style={styles.footer}>
          <CravrButton
            label={selectedDish ? 'Continue' : 'Skip Dish Selection'}
            onPress={onContinue}
          />
        </View>
      </ScreenContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9'
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  heroImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#E8E8E8',
    borderRadius: 12,
    marginBottom: 16
  },
  header: {
    marginBottom: 20
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 8
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rating: {
    fontSize: 14,
    color: '#6B6B6B'
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6A2A',
    width: '25%'
  },
  infoValue: {
    fontSize: 14,
    color: '#161616',
    flex: 1,
    marginLeft: 12,
    lineHeight: 20
  },
  menuSection: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 12
  },
  dishCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  dishCardSelected: {
    borderColor: '#FF6A2A',
    backgroundColor: '#FFF8F3'
  },
  dishImage: {
    width: 100,
    height: 100,
    backgroundColor: '#E8E8E8'
  },
  dishInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between'
  },
  dishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4
  },
  dishName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#161616',
    flex: 1,
    marginRight: 8
  },
  dishPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6A2A'
  },
  dishDescription: {
    fontSize: 13,
    color: '#6B6B6B',
    marginBottom: 8,
    lineHeight: 18
  },
  matchScore: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  matchScoreText: {
    fontSize: 12,
    color: '#FF6A2A',
    fontWeight: '600'
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  emptyText: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center'
  },
  footer: {
    marginTop: 20,
    marginBottom: 40
  }
});
