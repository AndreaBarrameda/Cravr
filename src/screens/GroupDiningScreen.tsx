import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { tokens } from '../theme/tokens';
import { RootStackParamList } from '../../App';

interface PlanCard {
  id: string;
  type: 'reservation' | 'solo' | 'connect';
  status: 'confirming' | 'reserved';
  restaurantName: string;
  date: string;
  time: string;
  attendees: number;
  attendeePhotos: string[];
  subtitle: string;
  actionButtonText: string;
}

const MOCK_PLANS: PlanCard[] = [
  {
    id: '1',
    type: 'connect',
    status: 'confirming',
    restaurantName: 'The Smoked Apricot',
    date: 'Fri, Oct 24',
    time: '19:30',
    attendees: 3,
    attendeePhotos: ['👨', '👩', '👨'],
    subtitle: 'Cravr Connect meal forming',
    actionButtonText: 'Manage',
  },
  {
    id: '2',
    type: 'reservation',
    status: 'reserved',
    restaurantName: 'Umami Collective',
    date: 'Sun, Oct 26',
    time: '20:00',
    attendees: 4,
    attendeePhotos: ['👩', '👨', '👩', '👨'],
    subtitle: 'Reservation locked in',
    actionButtonText: 'View Booking',
  },
  {
    id: '3',
    type: 'solo',
    status: 'reserved',
    restaurantName: 'Burnt Bean',
    date: 'Tonight',
    time: '18:45',
    attendees: 1,
    attendeePhotos: ['🍽️'],
    subtitle: 'Solo dining plan',
    actionButtonText: 'Open Plan',
  },
];

export function GroupDiningScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const plans = useMemo(() => MOCK_PLANS, []);

  const handleCreateGroupMeal = () => {
    alert('Open a restaurant first, then choose Reserve, Go Solo, or Cravr Connect.');
  };

  const getStatusLabel = (plan: PlanCard) => {
    if (plan.type === 'solo') return 'SOLO PLAN';
    return plan.status === 'confirming' ? 'CONFIRMING ATTENDANCE' : 'TABLE RESERVED';
  };

  const reservationPlans = plans.filter((plan) => plan.type === 'reservation');
  const soloPlans = plans.filter((plan) => plan.type === 'solo');
  const connectPlans = plans.filter((plan) => plan.type === 'connect');

  const renderPlanCard = (plan: PlanCard) => (
    <View key={plan.id} style={styles.mealCard}>
      <View style={styles.mealCardHeader}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{getStatusLabel(plan)}</Text>
        </View>
        {plan.type !== 'solo' ? (
          <TouchableOpacity style={styles.chatIcon}>
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color={tokens.colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.restaurantName}>{plan.restaurantName}</Text>
      <Text style={styles.planSubtitle}>{plan.subtitle}</Text>

      <View style={styles.mealMeta}>
        <View style={styles.metaItem}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={tokens.colors.textSecondary}
          />
          <Text style={styles.metaText}>{plan.date}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons
            name="time-outline"
            size={16}
            color={tokens.colors.textSecondary}
          />
          <Text style={styles.metaText}>{plan.time}</Text>
        </View>
      </View>

      <View style={styles.attendeesRow}>
        <View style={styles.avatarStack}>
          {plan.attendeePhotos.map((emoji, index) => (
            <View
              key={`${plan.id}-${index}`}
              style={[
                styles.avatar,
                { marginLeft: index > 0 ? -8 : 0 },
              ]}
            >
              <Text style={styles.avatarEmoji}>{emoji}</Text>
            </View>
          ))}
        </View>
        {plan.attendees > 3 ? (
          <Text style={styles.overflowText}>+{plan.attendees - 3}</Text>
        ) : null}
      </View>

      <TouchableOpacity
        style={[
          styles.actionButton,
          plan.type === 'reservation' ? styles.viewButton : styles.manageButton,
        ]}
      >
        <Text
          style={[
            styles.actionButtonText,
            plan.type === 'reservation' ? styles.viewButtonText : styles.manageButtonText,
          ]}
        >
          {plan.actionButtonText}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plans</Text>
        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
          <Ionicons
            name="person-circle"
            size={32}
            color={tokens.colors.primary}
          />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <LinearGradient
          colors={[tokens.colors.primary, '#FF8C42']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Choose How You Dine</Text>
            <Text style={styles.heroSubtitle}>
              Restaurant first, then reserve, go solo, or open a Cravr Connect plan.
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateGroupMeal}
            >
              <Ionicons name="add" size={20} color={tokens.colors.primary} />
              <Text style={styles.createButtonText}>Start from a Restaurant</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            <Text style={styles.upcomingCount}>
              {plans.length} TOTAL
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryValue}>{reservationPlans.length}</Text>
              <Text style={styles.summaryLabel}>Reservations</Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryValue}>{soloPlans.length}</Text>
              <Text style={styles.summaryLabel}>Solo</Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryValue}>{connectPlans.length}</Text>
              <Text style={styles.summaryLabel}>Connect</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reservations</Text>
          {reservationPlans.map(renderPlanCard)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Solo Plans</Text>
          {soloPlans.map(renderPlanCard)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cravr Connect</Text>
          {connectPlans.map(renderPlanCard)}
        </View>

        <View style={styles.featureGrid}>
          <TouchableOpacity style={styles.featureCard}>
            <Text style={styles.featureEmoji}>📍</Text>
            <Text style={styles.featureText}>Pick the place first, then choose the plan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard}>
            <Text style={styles.featureEmoji}>👥</Text>
            <Text style={styles.featureText}>Use Connect only when you want company</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: tokens.spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
  },
  headerTitle: {
    fontSize: tokens.typography.h2.fontSize,
    fontWeight: tokens.typography.h2.fontWeight,
    color: tokens.colors.textHeading,
  },
  profileButton: {
    padding: tokens.spacing.sm,
  },
  heroBanner: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.xxl,
    borderRadius: tokens.radius.lg,
    marginHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: tokens.typography.h2.fontSize,
    fontWeight: tokens.typography.h2.fontWeight,
    color: tokens.colors.textInverse,
    marginBottom: tokens.spacing.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: tokens.typography.body.fontSize,
    fontWeight: '400',
    color: tokens.colors.textInverse,
    marginBottom: tokens.spacing.lg,
    textAlign: 'center',
    lineHeight: 22,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.textInverse,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.full,
    gap: tokens.spacing.sm,
  },
  createButtonText: {
    fontSize: tokens.typography.bodyBold.fontSize,
    fontWeight: tokens.typography.bodyBold.fontWeight,
    color: tokens.colors.primary,
  },
  section: {
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  sectionTitle: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: tokens.typography.h3.fontWeight,
    color: tokens.colors.textHeading,
  },
  upcomingCount: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: tokens.typography.label.fontWeight,
    color: tokens.colors.textTertiary,
    letterSpacing: 0.8,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  summaryChip: {
    flex: 1,
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.spacing.md,
    alignItems: 'center',
    ...tokens.shadows.sm,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: tokens.colors.textHeading,
  },
  summaryLabel: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
    marginTop: 4,
  },
  mealCard: {
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    ...tokens.shadows.md,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  statusBadge: {
    backgroundColor: `${tokens.colors.primary}15`,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.full,
  },
  statusText: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: tokens.typography.label.fontWeight,
    color: tokens.colors.primary,
    letterSpacing: 0.5,
  },
  chatIcon: {
    padding: tokens.spacing.sm,
  },
  restaurantName: {
    fontSize: tokens.typography.h4.fontSize,
    fontWeight: tokens.typography.h4.fontWeight,
    color: tokens.colors.textHeading,
    marginBottom: tokens.spacing.xs,
  },
  planSubtitle: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: '500',
    color: tokens.colors.textSecondary,
    marginBottom: tokens.spacing.md,
  },
  mealMeta: {
    flexDirection: 'row',
    gap: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  metaText: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: '500',
    color: tokens.colors.textSecondary,
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: tokens.colors.backgroundLight,
  },
  avatarEmoji: {
    fontSize: 16,
  },
  overflowText: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  actionButton: {
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: tokens.typography.bodyBold.fontSize,
    fontWeight: tokens.typography.bodyBold.fontWeight,
  },
  manageButton: {
    borderWidth: 1.5,
    borderColor: tokens.colors.primary,
  },
  viewButton: {
    backgroundColor: tokens.colors.primary,
  },
  manageButtonText: {
    fontSize: tokens.typography.bodyBold.fontSize,
    fontWeight: tokens.typography.bodyBold.fontWeight,
    color: tokens.colors.primary,
  },
  viewButtonText: {
    fontSize: tokens.typography.bodyBold.fontSize,
    fontWeight: tokens.typography.bodyBold.fontWeight,
    color: tokens.colors.textInverse,
  },
  featureGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.xxl,
  },
  featureCard: {
    flex: 1,
    backgroundColor: tokens.colors.backgroundLight,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadows.sm,
  },
  featureEmoji: {
    fontSize: 32,
    marginBottom: tokens.spacing.md,
  },
  featureText: {
    fontSize: tokens.typography.small.fontSize,
    fontWeight: '600',
    color: tokens.colors.textHeading,
    textAlign: 'center',
    lineHeight: 18,
  },
});
