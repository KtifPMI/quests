import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../theme';
import { useQuests } from '../context/QuestContext';
import { useAuth } from '../context/AuthContext';
import { createBooking } from '../services/bookingService';
import { RootStackParamList } from '../navigation/RootNavigator';

type Route = RouteProp<RootStackParamList, 'Booking'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function BookingScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const route = useRoute<Route>();
  const { quests } = useQuests();
  const { user } = useAuth();

  const quest = quests.find((q) => q.id === route.params.questId);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [playersCount, setPlayersCount] = useState(String(quest?.players_min ?? 1));
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!quest) {
    return (
      <View style={styles.center}>
        <Text>Квест не найден</Text>
      </View>
    );
  }

  const price = quest.price_from * Number(playersCount || 1);

  const formatDate = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatTime = (d: Date) => {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const handleBooking = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await createBooking({
        quest_id: quest.id,
        client_id: user.id,
        booking_date: formatDate(date),
        booking_time: formatTime(date),
        players_count: Number(playersCount),
        price,
        note: note || null,
        status: 'pending',
      });
      Alert.alert('Успешно', 'Бронирование создано!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Бронирование</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.questCard}>
        <Text style={styles.questTitle}>{quest.title}</Text>
        <Text style={styles.questGenre}>{quest.genre} · {quest.difficulty}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Дата</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={styles.pickerText}>{formatDate(date)}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            minimumDate={new Date()}
            onChange={(_, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Время</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowTimePicker(true)}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
          <Text style={styles.pickerText}>{formatTime(date)}</Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            onChange={(_, selectedDate) => {
              setShowTimePicker(false);
              if (selectedDate) {
                const newDate = new Date(date);
                newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
                setDate(newDate);
              }
            }}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Количество игроков</Text>
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={styles.counterBtn}
            onPress={() => {
              const val = Math.max(quest.players_min, Number(playersCount) - 1);
              setPlayersCount(String(val));
            }}
          >
            <Ionicons name="remove" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.counterValue}
            value={playersCount}
            onChangeText={setPlayersCount}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={styles.counterBtn}
            onPress={() => {
              const val = Math.min(quest.players_max, Number(playersCount) + 1);
              setPlayersCount(String(val));
            }}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Комментарий (необязательно)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Пожелания, особенности..."
          placeholderTextColor={colors.textMuted}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>Итого:</Text>
        <Text style={styles.totalPrice}>{price} ₽</Text>
      </View>

      <TouchableOpacity
        style={[styles.bookButton, loading && { opacity: 0.6 }]}
        onPress={handleBooking}
        disabled={loading}
      >
        <Text style={styles.bookButtonText}>
          {loading ? 'Бронирование...' : 'Подтвердить бронирование'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    ...shadows.header,
  },
  headerTitle: { ...typography.h2 },
  questCard: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    ...shadows.card,
  },
  questTitle: { ...typography.h3 },
  questGenre: { ...typography.bodySmall, marginTop: spacing.xs, color: colors.primary },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { ...typography.bodySmall, fontWeight: '600', marginBottom: spacing.sm },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pickerText: { ...typography.body, color: colors.text },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    ...typography.h2,
    width: 60,
    textAlign: 'center',
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: spacing.lg,
  },
  totalLabel: { ...typography.body, color: colors.textLight },
  totalPrice: { ...typography.h1, color: colors.primary },
  bookButton: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  bookButtonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});