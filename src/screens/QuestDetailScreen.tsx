import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../theme';
import { useQuests } from '../context/QuestContext';
import { RootStackParamList } from '../navigation/RootNavigator';

type Route = RouteProp<RootStackParamList, 'QuestDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const DIFFICULTY_LABELS = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный' };
const DIFFICULTY_COLORS = { easy: colors.success, medium: colors.warning, hard: colors.danger };

export default function QuestDetailScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const route = useRoute<Route>();
  const { quests, getRoomById } = useQuests();

  const quest = quests.find((q) => q.id === route.params.questId);
  if (!quest) {
    return (
      <View style={styles.center}>
        <Text>Квест не найден</Text>
      </View>
    );
  }

  const room = getRoomById(quest.room_id);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        {quest.image_url ? (
          <Image source={{ uri: quest.image_url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="game-controller" size={60} color={colors.primaryLight} />
          </View>
        )}
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + spacing.sm }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{quest.title}</Text>
          <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLORS[quest.difficulty] + '20' }]}>
            <Text style={[styles.diffText, { color: DIFFICULTY_COLORS[quest.difficulty] }]}>
              {DIFFICULTY_LABELS[quest.difficulty]}
            </Text>
          </View>
        </View>

        {room && (
          <TouchableOpacity
            style={styles.roomLink}
            onPress={() => navigation.navigate('RoomDetail', { roomId: room.id })}
          >
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={styles.roomName}>{room.name}</Text>
            <Text style={styles.roomAddress}>{room.address}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={20} color={colors.primary} />
            <Text style={styles.infoValue}>{quest.players_min}-{quest.players_max}</Text>
            <Text style={styles.infoLabel}>Игроков</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.infoValue}>{quest.duration_min} мин</Text>
            <Text style={styles.infoLabel}>Длительность</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.infoValue}>{quest.age_limit}+</Text>
            <Text style={styles.infoLabel}>Возраст</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="star-outline" size={20} color={colors.primary} />
            <Text style={styles.infoValue}>{quest.rating ?? '—'}</Text>
            <Text style={styles.infoLabel}>Рейтинг</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Описание</Text>
        <Text style={styles.description}>{quest.description || 'Описание отсутствует'}</Text>

        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Цена от</Text>
          <Text style={styles.priceValue}>{quest.price_from} ₽</Text>
        </View>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('Booking', { questId: quest.id })}
        >
          <Text style={styles.bookButtonText}>Забронировать</Text>
        </TouchableOpacity>

        {room && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => navigation.navigate('Chat', { roomId: room.id })}
          >
            <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
            <Text style={styles.chatButtonText}>Написать в локацию</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 260 },
  imagePlaceholder: {
    width: '100%',
    height: 260,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { padding: spacing.lg },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { ...typography.h1, flex: 1 },
  diffBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.round, marginLeft: spacing.sm },
  diffText: { fontSize: 13, fontWeight: '600' },
  roomLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: 6,
  },
  roomName: { ...typography.bodySmall, fontWeight: '600', color: colors.primary },
  roomAddress: { ...typography.caption, color: colors.textLight },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  infoItem: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.card,
  },
  infoValue: { ...typography.h3, marginTop: spacing.xs },
  infoLabel: { ...typography.caption, marginTop: 2 },
  sectionTitle: { ...typography.h3, marginTop: spacing.xl },
  description: { ...typography.body, marginTop: spacing.sm, color: colors.textLight, lineHeight: 24 },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  priceLabel: { ...typography.body, color: colors.textLight },
  priceValue: { ...typography.h1, color: colors.primary },
  bookButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  bookButtonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chatButtonText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
});