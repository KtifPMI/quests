import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getUserBookings, updateBookingStatus } from '../services/bookingService';
import { Booking } from '../types';
import { RootStackParamList } from '../navigation/RootNavigator';

type Route = RouteProp<RootStackParamList, 'Employee'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function EmployeeScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<Booking['status'] | 'all'>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    const data = await getUserBookings(user?.id ?? '');
    setBookings(data);
  }

  async function updateStatus(id: string, status: Booking['status']) {
    await updateBookingStatus(id, status);
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    );
  }

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  const STATUS_LABELS: Record<Booking['status'], string> = {
    pending: 'Ожидает',
    confirmed: 'Подтверждена',
    completed: 'Завершена',
    cancelled: 'Отменена',
  };
  const STATUS_COLORS: Record<Booking['status'], string> = {
    pending: colors.warning,
    confirmed: colors.primary,
    completed: colors.success,
    cancelled: colors.danger,
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Сотрудник</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Chat', { roomId: '' })}>
          <Ionicons name="chatbubble-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={['all', 'pending', 'confirmed', 'completed', 'cancelled']}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
            onPress={() => setFilter(item as typeof filter)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
              {item === 'all' ? 'Все' : STATUS_LABELS[item as Booking['status']]}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtered}
        contentContainerStyle={styles.bookingsList}
        keyExtractor={(item) => item.id}
        renderItem={({ item: booking }) => (
          <View style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <Text style={styles.bookingDate}>{booking.booking_date} в {booking.booking_time}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[booking.status] + '20' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[booking.status] }]}>
                  {STATUS_LABELS[booking.status]}
                </Text>
              </View>
            </View>
            <Text style={styles.bookingPlayers}>{booking.players_count} игрок(ов) · {booking.price} ₽</Text>

            {booking.status === 'pending' && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.success }]}
                  onPress={() => updateStatus(booking.id, 'confirmed')}
                >
                  <Text style={styles.actionBtnText}>Подтвердить</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.danger }]}
                  onPress={() => updateStatus(booking.id, 'cancelled')}
                >
                  <Text style={styles.actionBtnText}>Отклонить</Text>
                </TouchableOpacity>
              </View>
            )}

            {booking.status === 'confirmed' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => updateStatus(booking.id, 'completed')}
              >
                <Text style={styles.actionBtnText}>Завершить</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Нет бронирований</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    paddingTop: spacing.lg + 20,
    ...shadows.header,
  },
  headerTitle: { ...typography.h3 },
  filterList: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 13, color: colors.textLight, fontWeight: '500' },
  filterTextActive: { color: colors.white },
  bookingsList: { padding: spacing.md, gap: spacing.md },
  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingDate: { ...typography.body, fontWeight: '600' },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.round },
  statusText: { fontSize: 12, fontWeight: '600' },
  bookingPlayers: { ...typography.bodySmall, marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  actionBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  emptyText: { ...typography.body, textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
});