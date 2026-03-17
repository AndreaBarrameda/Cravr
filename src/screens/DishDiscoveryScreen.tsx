import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  SafeAreaView,
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { ScreenContainer, CravrButton } from '../components/UI';
import { api } from '../api/client';
import { useAppState } from '../state/AppStateContext';

type Props = NativeStackScreenProps<RootStackParamList, 'DishDiscovery'>;

type DishCard = {
  dish_id: string;
  name: string;
  description: string;
  photo_url: string | null;
  price: number;
  restaurant_name: string;
  restaurant_id: string;
  rating: number;
  match_score: number;
  match_reason: string;
};

type Attributes = {
  temperature: string | null;
  flavor: string | null;
  texture: string | null;
  intensity: string | null;
  occasion: string | null;
  budget: string | null;
};

export function DishDiscoveryScreen({ route, navigation }: Props) {
  const { cravingId, cuisine, attributes, craving_text } = route.params;
  const { state } = useAppState();
  const [loading, setLoading] = useState(true);
  const [dishes, setDishes] = useState<DishCard[]>([]);
  const [selectedDishIndex, setSelectedDishIndex] = useState(0);

  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false
      }),
      onPanResponderRelease: (e, { dx }) => {
        const threshold = 50;
        if (Math.abs(dx) > threshold) {
          if (dx > 0) {
            // Swipe right = select dish
            handleSelectDish(dishes[selectedDishIndex]);
          } else {
            // Swipe left = pass
            handleSwipeNext();
          }
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      }
    })
  ).current;

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        const lat = state.location?.latitude ?? 34.0522;
        const lng = state.location?.longitude ?? -118.2437;

        // Call API to discover dishes matching attributes
        const data = await api.discoverDishesByAttributes({
          craving_text: craving_text || cravingId || '',
          cuisine,
          attributes: attributes as Attributes,
          location: { lat, lng }
        });

        if (data.results && Array.isArray(data.results)) {
          setDishes(data.results);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch dishes:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchDishes();
  }, [cravingId, cuisine, attributes, state.location]);

  const handleSelectDish = (dish: DishCard) => {
    navigation.navigate('RestaurantDetail', {
      restaurantId: dish.restaurant_id,
      cravingId,
      cuisine,
      dishId: dish.dish_id
    });
  };

  const handleSwipeNext = () => {
    if (selectedDishIndex < dishes.length - 1) {
      setSelectedDishIndex(selectedDishIndex + 1);
    }
  };

  const handlePass = () => {
    handleSwipeNext();
  };

  const handleLike = () => {
    handleSelectDish(dishes[selectedDishIndex]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#FF6A2A" size="large" />
          <Text style={styles.loadingText}>Finding perfect dishes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (dishes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenContainer>
          <Text style={styles.emptyTitle}>No dishes found</Text>
          <Text style={styles.emptyText}>
            Try adjusting your preferences to find more options
          </Text>
          <CravrButton label="Go Back" onPress={() => navigation.goBack()} />
        </ScreenContainer>
      </SafeAreaView>
    );
  }

  const currentDish = dishes[selectedDishIndex];

  // Interpolate rotation based on swipe distance
  const rotate = pan.x.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: ['-15deg', '0deg', '15deg']
  });

  // Interpolate opacity for badge overlays
  const rightOpacity = pan.x.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const leftOpacity = pan.x.interpolate({
    inputRange: [-100, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfect Dishes for You</Text>
        <Text style={styles.counter}>
          {selectedDishIndex + 1} of {dishes.length}
        </Text>
      </View>

      {/* Swipeable Card */}
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { rotate }
            ]
          }
        ]}
        {...panResponder.panHandlers}
      >
        {currentDish.photo_url && (
          <Image
            source={{ uri: currentDish.photo_url }}
            style={styles.dishImage}
          />
        )}
        <View style={styles.dishInfo}>
          <Text style={styles.dishName}>{currentDish.name}</Text>
          <Text style={styles.restaurantName}>{currentDish.restaurant_name}</Text>
          <Text style={styles.description}>{currentDish.description}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>⭐ Rating</Text>
              <Text style={styles.statValue}>{currentDish.rating.toFixed(1)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>💰 Price</Text>
              <Text style={styles.statValue}>₱{currentDish.price.toFixed(0)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>✨ Match</Text>
              <Text style={styles.statValue}>{Math.round(currentDish.match_score * 100)}%</Text>
            </View>
          </View>

          <View style={styles.reasonBadge}>
            <Text style={styles.reasonText}>💡 {currentDish.match_reason}</Text>
          </View>
        </View>

        {/* Right swipe overlay (YUM!) */}
        <Animated.View style={[styles.badgeOverlay, styles.badgeRight, { opacity: rightOpacity }]}>
          <Text style={styles.badgeText}>YUM! 💚</Text>
        </Animated.View>

        {/* Left swipe overlay (PASS) */}
        <Animated.View style={[styles.badgeOverlay, styles.badgeLeft, { opacity: leftOpacity }]}>
          <Text style={styles.badgeText}>PASS ❌</Text>
        </Animated.View>
      </Animated.View>

      {/* Action Buttons */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.actionButton} onPress={handlePass}>
          <Text style={styles.actionButtonText}>PASS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.actionButtonLike]} onPress={handleLike}>
          <Text style={[styles.actionButtonText, styles.actionButtonTextLike]}>YUM!</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F3'
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#161616'
  },
  counter: {
    fontSize: 13,
    color: '#FF6A2A',
    fontWeight: '500',
    marginTop: 4
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B6B6B'
  },
  cardContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  dishImage: {
    width: '100%',
    height: 280,
    backgroundColor: '#E8E8E8'
  },
  dishInfo: {
    padding: 20
  },
  dishName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 4
  },
  restaurantName: {
    fontSize: 14,
    color: '#FF6A2A',
    fontWeight: '600',
    marginBottom: 12
  },
  description: {
    fontSize: 13,
    color: '#6B6B6B',
    lineHeight: 18,
    marginBottom: 16
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0'
  },
  stat: {
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#161616'
  },
  reasonBadge: {
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6A2A'
  },
  reasonText: {
    fontSize: 12,
    color: '#FF6A2A',
    fontWeight: '500'
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0'
  },
  actionButtonLike: {
    backgroundColor: '#FFE6D6',
    borderColor: '#FF6A2A'
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#161616'
  },
  actionButtonTextLike: {
    color: '#FF6A2A'
  },
  badgeOverlay: {
    position: 'absolute',
    top: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    width: '40%',
    height: '40%',
    borderRadius: 12,
    transform: [{ translateY: -50 }]
  },
  badgeRight: {
    right: 20,
    backgroundColor: '#D4F8D4',
    borderWidth: 2,
    borderColor: '#2ECC71'
  },
  badgeLeft: {
    left: 20,
    backgroundColor: '#FFD4D4',
    borderWidth: 2,
    borderColor: '#FF6B6B'
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#161616'
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 24
  }
});
