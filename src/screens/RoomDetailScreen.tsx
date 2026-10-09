import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Linking,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../theme';
import { useQuests } from '../context/QuestContext';
import { RootStackParamList } from '../navigation/RootNavigator';

type Route = RouteProp<RootStackParamList, 'RoomDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function RoomDetailScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const route = useRoute<Route>();
  const { getRoomById, getQuestsByRoom } = useQuests();

  const room = getRoomById(route.params.roomId);
  const quests = room ? getQuestsByRoom(room.id) : [];

  if (!room) {
    return (
      <View style={styles.center}>
        <Text>Локация не найдена</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{room.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.roomName}>{room.name}</Text>

        <TouchableOpacity style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color={colors.primary} />
          <Text style={styles.infoText}>{room.address}, {room.city}</Text>
        </TouchableOpacity>

        {room.description && (
          <Text style={styles.description}>{room.description}</Text>
        )}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            if (room.latitude && room.longitude) {
              const url = `https://yandex.ru/maps/?rtext=~${room.latitude},${room.longitude}`;
              Linking.openURL(url);
            }
          }}
        >
          <Ionicons name="navigate-outline" size={20} color={colors.primary} />
          <Text style={styles.actionText}>Маршрут</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Chat', { roomId: room.id })}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
          <Text style={styles.actionText}>Написать</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Квесты в локации ({quests.length})</Text>

      {quests.length === 0 ? (
        <Text style={styles.emptyText}>Нет доступных квестов</Text>
      ) : (
        <FlatList
          data={quests}
          scrollEnabled={false}
          contentContainerStyle={styles.questsList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.questCard}
              onPress={() => navigation.navigate('QuestDetail', { questId: item.id })}
            >
              <View style={styles.questInfo}>
                <Text style={styles.questTitle}>{item.title}</Text>
                <Text style={styles.questGenre}>{item.genre}</Text>
                <View style={styles.questMeta}>
                  <Text style={styles.questMetaText}>{item.duration_min} мин</Text>
                  <Text style={styles.questMetaDot}>·</Text>
                  <Text style={styles.questMetaText}>{item.players_min}-{item.players_max} чел.</Text>
                </View>
              </View>
              <Text style={styles.questPrice}>от {item.price_from} ₽</Text>
            </TouchableOpacity>
          )}
        />
      )}
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
  headerTitle: { ...typography.h3, flex: 1, textAlign: 'center' },
  infoCard: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  roomName: { ...typography.h1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  infoText: { ...typography.body, color: colors.textLight, flex: 1 },
  description: { ...typography.body, color: colors.textLight, marginTop: spacing.md, lineHeight: 24 },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionText: { color: colors.primary, fontWeight: '600' },
  sectionTitle: { ...typography.h3, paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.md },
  questsList: { paddingHorizontal: spacing.md, gap: spacing.sm },
  questCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    ...shadows.card,
  },
  questInfo: { flex: 1 },
  questTitle: { ...typography.body, fontWeight: '600' },
  questGenre: { ...typography.bodySmall, color: colors.primary, marginTop: 4 },
  questMeta: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  questMetaText: { ...typography.caption },
  questMetaDot: { marginHorizontal: 4, color: colors.textMuted },
  questPrice: { ...typography.body, fontWeight: '700', color: colors.primary },
  emptyText: { ...typography.body, textAlign: 'center', color: colors.textMuted, padding: spacing.xl },
});