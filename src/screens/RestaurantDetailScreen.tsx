import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Linking
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { ScreenContainer, CravrButton } from '../components/UI';
import { useAppState } from '../state/AppStateContext';
import { api } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'RestaurantDetail'>;

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
  website?: string;
};

export function RestaurantDetailScreen({ route, navigation }: Props) {
  const { restaurantId, cravingId, cuisine } = route.params;
  const { state } = useAppState();
  const [loading, setLoading] = useState(true);
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Extract place_id from restaurant_id (format: rst_<place_id>)
        const placeId = restaurantId.replace(/^rst_/, '');

        // Fetch restaurant details from Google Maps
        const detailsData = await api.getRestaurantDetails(placeId);
        if (detailsData) {
          setRestaurantData(detailsData);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch restaurant data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId]);

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
        {restaurantData ? (
          <>
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
                <Text style={styles.infoLabel}>📞 Phone</Text>
                <Text style={styles.infoValue}>{restaurantData.phone}</Text>
              </View>
              {restaurantData.hours && restaurantData.hours.length > 0 && (
                <View style={[styles.infoRow, { marginTop: 12 }]}>
                  <Text style={styles.infoLabel}>🕐 Hours</Text>
                  <Text style={styles.infoValue}>
                    {restaurantData.hours[new Date().getDay()] || 'See website for hours'}
                  </Text>
                </View>
              )}
            </View>

            {/* Real Menu Links */}
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>View Real Menu</Text>
              <Text style={styles.menuSubtitle}>Check out the actual menu and prices</Text>

              {restaurantData.website && (
                <TouchableOpacity
                  style={styles.menuLink}
                  onPress={() => Linking.openURL(restaurantData.website!)}
                >
                  <Text style={styles.menuLinkIcon}>🌐</Text>
                  <View style={styles.menuLinkContent}>
                    <Text style={styles.menuLinkTitle}>Restaurant Website</Text>
                    <Text style={styles.menuLinkDesc}>View full menu & details</Text>
                  </View>
                  <Text style={styles.menuLinkArrow}>→</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.menuLink}
                onPress={() => {
                  const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(restaurantData.name)}`;
                  Linking.openURL(searchUrl);
                }}
              >
                <Text style={styles.menuLinkIcon}>📍</Text>
                <View style={styles.menuLinkContent}>
                  <Text style={styles.menuLinkTitle}>Google Maps</Text>
                  <Text style={styles.menuLinkDesc}>See menu, reviews & hours</Text>
                </View>
                <Text style={styles.menuLinkArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuLink}
                onPress={() => {
                  const searchUrl = `https://www.grabfood.com/ph/search?q=${encodeURIComponent(restaurantData.name)}`;
                  Linking.openURL(searchUrl);
                }}
              >
                <Text style={styles.menuLinkIcon}>🍽️</Text>
                <View style={styles.menuLinkContent}>
                  <Text style={styles.menuLinkTitle}>GrabFood</Text>
                  <Text style={styles.menuLinkDesc}>Real menu with prices</Text>
                </View>
                <Text style={styles.menuLinkArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuLink}
                onPress={() => {
                  const searchUrl = `https://www.foodpanda.ph/search?q=${encodeURIComponent(restaurantData.name)}`;
                  Linking.openURL(searchUrl);
                }}
              >
                <Text style={styles.menuLinkIcon}>🎯</Text>
                <View style={styles.menuLinkContent}>
                  <Text style={styles.menuLinkTitle}>Foodpanda</Text>
                  <Text style={styles.menuLinkDesc}>Check available items</Text>
                </View>
                <Text style={styles.menuLinkArrow}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Continue Button */}
            <View style={styles.footer}>
              <CravrButton
                label="Back to Restaurants"
                onPress={() => navigation.goBack()}
              />
            </View>
          </>
        ) : (
          <View style={styles.loadingPlaceholder}>
            <ActivityIndicator color="#FF6A2A" />
            <Text style={styles.loadingText}>Loading restaurant info...</Text>
          </View>
        )}
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
  loadingPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B6B6B'
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
  menuSubtitle: {
    fontSize: 13,
    color: '#6B6B6B',
    marginBottom: 16
  },
  menuLink: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  menuLinkIcon: {
    fontSize: 28,
    marginRight: 12
  },
  menuLinkContent: {
    flex: 1
  },
  menuLinkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#161616',
    marginBottom: 4
  },
  menuLinkDesc: {
    fontSize: 13,
    color: '#6B6B6B'
  },
  menuLinkArrow: {
    fontSize: 16,
    color: '#FF6A2A',
    fontWeight: '600'
  },
  footer: {
    marginTop: 20,
    marginBottom: 40
  }
});
