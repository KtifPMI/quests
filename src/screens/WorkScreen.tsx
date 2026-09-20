import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useQuests } from '../context/QuestContext';
import { getUserBookings } from '../services/bookingService';
import { EMPLOYEE_LEVELS, getLevelMeta } from '../constants/employeeLevels';
import { Booking } from '../types';
import { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function WorkScreen() {
  const navigation = useNavigation<Nav>();
  const { profile, user, isOwner, employment, maxAccessLevel } = useAuth();
  const { rooms, quests } = useQuests();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    getUserBookings(user?.id ?? '').then(setBookings);
  }, [user?.id]);

  const myQuestIds = new Set(employment.flatMap((e) => e.quest_ids));
  const activeBookingsCount = bookings.filter(
    (b) =>
      myQuestIds.has(b.quest_id) &&
      (b.status === 'pending' || b.status === 'confirmed')
  ).length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Работа</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="briefcase" size={30} color={colors.primary} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{profile?.full_name || 'Сотрудник'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        {maxAccessLevel && (
          <View
            style={[
              styles.levelBadge,
              { backgroundColor: getLevelMeta(maxAccessLevel).color + '22' },
            ]}
          >
            <Text style={[styles.levelBadgeText, { color: getLevelMeta(maxAccessLevel).color }]}>
              {getLevelMeta(maxAccessLevel).label}
            </Text>
          </View>
        )}
      </View>

      {isOwner && (
        <TouchableOpacity
          style={styles.ownerButton}
          onPress={() => navigation.navigate('OwnerPanel')}
        >
          <Ionicons name="business" size={20} color={colors.white} />
          <Text style={styles.ownerButtonText}>Панель владельца</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.white} />
        </TouchableOpacity>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{activeBookingsCount}</Text>
          <Text style={styles.statLabel}>Активных броней</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{employment.length}</Text>
          <Text style={styles.statLabel}>Ваших локаций</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Уровни доступа</Text>
        {EMPLOYEE_LEVELS.map((meta) => {
          const active = maxAccessLevel === meta.level;
          return (
            <View
              key={meta.level}
              style={[
                styles.levelCard,
                active && {
                  borderColor: meta.color,
                  backgroundColor: meta.color + '0D',
                },
              ]}
            >
              <View style={styles.levelRow}>
                <Text style={[styles.levelLabel, { color: meta.color }]}>
                  {meta.short}
                </Text>
                <View style={styles.levelTitleRow}>
                  <Text style={styles.levelTitle}>{meta.label}</Text>
                  {active && <Text style={styles.levelYou}>ваш</Text>}
                </View>
              </View>
              <Text style={styles.levelDesc}>{meta.description}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Мои локации и квесты</Text>
        {employment.length === 0 ? (
          <Text style={styles.emptyText}>
            Вы пока не привязаны к локациям. Владелец выдаст вам уровень доступа и
            интегрирует в квесты.
          </Text>
        ) : (
          employment.map((emp) => {
            const room = rooms.find((r) => r.id === emp.room_id);
            if (!room) return null;
            const meta = getLevelMeta(emp.access_level);
            const empQuests = emp.quest_ids
              .map((id) => quests.find((q) => q.id === id)?.title)
              .filter((t): t is string => Boolean(t));
            return (
              <View key={emp.id} style={styles.roomCard}>
                <View style={styles.roomHeader}>
                  <View style={styles.roomIcon}>
                    <Ionicons name="location" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.roomInfo}>
                    <Text style={styles.roomName}>{room.name}</Text>
                    <Text style={styles.roomCity}>{room.city}</Text>
                  </View>
                  <View style={[styles.roomLevel, { borderColor: meta.color + '55' }]}>
                    <Text style={{ color: meta.color, fontSize: 11, fontWeight: '700' }}>
                      {meta.short}
                    </Text>
                  </View>
                </View>

                <Text style={styles.questsLabel}>Квесты</Text>
                {empQuests.length === 0 ? (
                  <Text style={styles.noQuests}>Сотрудник пока не интегрирован в квесты</Text>
                ) : (
                  <View style={styles.chips}>
                    {empQuests.map((title) => (
                      <View key={title} style={styles.chip}>
                        <Ionicons name="game-controller" size={12} color={colors.secondary} />
                        <Text style={styles.chipText}>{title}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.actions}>
                  {emp.can_manage_bookings && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => navigation.navigate('Employee', { roomId: room.id })}
                    >
                      <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                      <Text style={styles.actionText}>Смена</Text>
                    </TouchableOpacity>
                  )}
                  {emp.can_chat_with_clients && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => navigation.navigate('Chat', { roomId: room.id })}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                      <Text style={styles.actionText}>Чат с клиентами</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerBar: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    paddingTop: spacing.lg + 20,
    ...shadows.header,
  },
  headerTitle: { ...typography.h2, color: colors.text },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: { flex: 1, marginLeft: spacing.md },
  name: { ...typography.h3, color: colors.text },
  email: { ...typography.caption, marginTop: 2 },
  levelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.round,
  },
  levelBadgeText: { fontSize: 12, fontWeight: '700' },
  ownerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  ownerButtonText: { color: colors.white, fontWeight: '700', flex: 1 },
  statsRow: {
    flexDirection: 'row',
    margin: spacing.md,
    marginBottom: 0,
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: { ...typography.h2, color: colors.primary },
  statLabel: { ...typography.caption, marginTop: 2 },
  section: { padding: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  levelCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelLabel: { fontSize: 12, fontWeight: '700' },
  levelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  levelTitle: { ...typography.body, color: colors.text, fontWeight: '600' },
  levelYou: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    backgroundColor: colors.primary + '1A',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.round,
  },
  levelDesc: { ...typography.bodySmall, marginTop: spacing.xs },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  roomCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  roomHeader: { flexDirection: 'row', alignItems: 'center' },
  roomIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomInfo: { flex: 1, marginLeft: spacing.md },
  roomName: { ...typography.body, color: colors.text, fontWeight: '600' },
  roomCity: { ...typography.caption, marginTop: 2 },
  roomLevel: {
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.round,
  },
  questsLabel: { ...typography.caption, marginTop: spacing.md, marginBottom: spacing.xs },
  noQuests: { ...typography.bodySmall, color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  chipText: { fontSize: 12, color: colors.textLight },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary + '55',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
});