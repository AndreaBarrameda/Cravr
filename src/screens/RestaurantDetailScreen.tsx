import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { ScreenContainer, CravrButton } from '../components/UI';
import { useAppState } from '../state/AppStateContext';

type Props = NativeStackScreenProps<RootStackParamList, 'RestaurantDetail'>;

export function RestaurantDetailScreen({ route, navigation }: Props) {
  const { restaurantId, cravingId, cuisine } = route.params;
  const { setState } = useAppState();

  const onContinue = () => {
    setState((prev) => ({ ...prev, selectedDishId: undefined }));
    navigation.navigate('SoloCheck', {
      restaurantId,
      dishId: undefined,
      cravingId,
      cuisine
    });
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Restaurant</Text>
      <Text style={styles.subtitle}>Prototype detail for {restaurantId}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dish selection TBD</Text>
        <Text style={styles.cardText}>
          For now, continue without choosing a specific dish. In a fuller build this screen would
          show menu items and matched dishes.
        </Text>
      </View>

      <View style={styles.footer}>
        <CravrButton label="Continue" onPress={onContinue} />
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
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8
  },
  cardText: {
    fontSize: 14,
    color: '#6B6B6B'
  },
  footer: {
    marginTop: 'auto'
  }
});

