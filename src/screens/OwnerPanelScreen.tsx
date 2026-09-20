import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useQuests } from '../context/QuestContext';
import { getOwnerData, createEmployee, updateEmployee } from '../services/ownerService';
import { EMPLOYEE_LEVELS, getLevelMeta, employeeRightsForLevel } from '../constants/employeeLevels';
import { QuestRoom, Employee, Booking, EmployeeLevel } from '../types';
import { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Rights = Pick<
  Employee,
  'can_manage_bookings' | 'can_manage_quests' | 'can_chat_with_clients' | 'can_view_analytics'
>;

const RIGHTS_LIST: {
  key: keyof Rights;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}[] = [
  { key: 'can_manage_bookings', icon: 'calendar-outline', label: 'Брони' },
  { key: 'can_manage_quests', icon: 'game-controller-outline', label: 'Квесты' },
  { key: 'can_chat_with_clients', icon: 'chatbubble-outline', label: 'Чат' },
  { key: 'can_view_analytics', icon: 'stats-chart-outline', label: 'Аналитика' },
];

export default function OwnerPanelScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { getQuestsByRoom } = useQuests();

  const [rooms, setRooms] = useState<QuestRoom[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'rooms' | 'employees' | 'bookings'>('rooms');
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  const [employeeEmail, setEmployeeEmail] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<EmployeeLevel>(1);
  const [selectedQuestIds, setSelectedQuestIds] = useState<string[]>([]);
  const [rights, setRights] = useState<Rights>(employeeRightsForLevel(1));

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;
    const data = await getOwnerData(user.id);
    setRooms(data.rooms);
    setEmployees(data.employees);
    setBookings(data.bookings);
  }

  function resetAddEmployee() {
    setEmployeeEmail('');
    setSelectedRoomId('');
    setSelectedLevel(1);
    setSelectedQuestIds([]);
    setRights(employeeRightsForLevel(1));
  }

  function selectRoom(roomId: string) {
    setSelectedRoomId(roomId);
    setSelectedQuestIds([]);
  }

  function selectLevel(level: EmployeeLevel) {
    setSelectedLevel(level);
    setRights(employeeRightsForLevel(level));
  }

  function toggleQuest(questId: string) {
    setSelectedQuestIds((prev) =>
      prev.includes(questId) ? prev.filter((id) => id !== questId) : [...prev, questId]
    );
  }

  function toggleRight(key: keyof Rights) {
    setRights((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const handleAddEmployee = async () => {
    if (!employeeEmail.trim()) {
      Alert.alert('Ошибка', 'Введите email сотрудника');
      return;
    }
    if (!selectedRoomId) {
      Alert.alert('Ошибка', 'Выберите локацию');
      return;
    }
    const meta = getLevelMeta(selectedLevel);
    await createEmployee({
      room_id: selectedRoomId,
      profile_id: employeeEmail.trim(),
      role: meta.label,
      access_level: selectedLevel,
      quest_ids: selectedQuestIds,
      ...rights,
    });
    Alert.alert(
      'Готово',
      `Сотрудник ${employeeEmail.trim()} добавлен как «${meta.label}» на ${selectedQuestIds.length} квестов.`,
      [{ text: 'OK' }]
    );
    resetAddEmployee();
    setShowAddEmployee(false);
    fetchData();
  };

  const toggleActive = async (emp: Employee) => {
    await updateEmployee(emp.id, { is_active: !emp.is_active });
    fetchData();
  };

  const roomQuests = selectedRoomId ? getQuestsByRoom(selectedRoomId) : [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Панель владельца</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        {(['rooms', 'employees', 'bookings'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'rooms' ? 'Локации' : tab === 'employees' ? 'Сотрудники' : 'Брони'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'rooms' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ваши локации ({rooms.length})</Text>
          {rooms.map((room) => (
            <TouchableOpacity
              key={room.id}
              style={styles.itemCard}
              onPress={() => navigation.navigate('RoomDetail', { roomId: room.id })}
            >
              <View style={styles.itemIcon}>
                <Ionicons name="location" size={20} color={colors.primary} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{room.name}</Text>
                <Text style={styles.itemSubtitle}>{room.city}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {activeTab === 'employees' && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              resetAddEmployee();
              setShowAddEmployee(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.white} />
            <Text style={styles.addButtonText}>Добавить сотрудника</Text>
          </TouchableOpacity>

          {showAddEmployee && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Новый сотрудник</Text>

                <Text style={styles.label}>
                  Email сотрудника <Text style={styles.subLabel}>(или id профиля)</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="worker@quests.ru"
                  placeholderTextColor={colors.textMuted}
                  value={employeeEmail}
                  onChangeText={setEmployeeEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Локация</Text>
                {rooms.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[
                      styles.roomOption,
                      selectedRoomId === r.id && styles.roomOptionActive,
                    ]}
                    onPress={() => selectRoom(r.id)}
                  >
                    <Text
                      style={[
                        styles.roomOptionText,
                        selectedRoomId === r.id && styles.roomOptionTextActive,
                      ]}
                    >
                      {r.name}
                    </Text>
                  </TouchableOpacity>
                ))}

                <Text style={styles.label}>Уровень доступа</Text>
                <View style={styles.levelRow}>
                  {EMPLOYEE_LEVELS.map((meta) => {
                    const active = selectedLevel === meta.level;
                    return (
                      <TouchableOpacity
                        key={meta.level}
                        style={[
                          styles.levelOption,
                          active && { borderColor: meta.color, backgroundColor: meta.color + '12' },
                        ]}
                        onPress={() => selectLevel(meta.level)}
                      >
                        <Text
                          style={[
                            styles.levelOptionLabel,
                            active && { color: meta.color, fontWeight: '700' },
                          ]}
                        >
                          {meta.label}
                        </Text>
                        <Text style={[styles.levelOptionShort, active && { color: meta.color }]}>
                          {meta.short}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.label}>Интеграция в квесты локации</Text>
                {roomQuests.length === 0 ? (
                  <Text style={styles.noQuests}>
                    Сначала выберите локацию, чтобы увидеть её квесты
                  </Text>
                ) : (
                  roomQuests.map((q) => {
                    const checked = selectedQuestIds.includes(q.id);
                    return (
                      <TouchableOpacity
                        key={q.id}
                        style={[styles.questOption, checked && styles.roomOptionActive]}
                        onPress={() => toggleQuest(q.id)}
                      >
                        <Ionicons
                          name={checked ? 'checkbox' : 'square-outline'}
                          size={18}
                          color={checked ? colors.primary : colors.textMuted}
                        />
                        <Text style={[styles.questOptionText, checked && styles.roomOptionTextActive]}>
                          {q.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}

                <Text style={styles.label}>Права</Text>
                <View style={styles.rightsGrid}>
                  {RIGHTS_LIST.map((r) => {
                    const checked = rights[r.key];
                    return (
                      <TouchableOpacity
                        key={r.key}
                        style={[styles.rightChip, checked && styles.rightChipActive]}
                        onPress={() => toggleRight(r.key)}
                      >
                        <Ionicons
                          name={r.icon}
                          size={14}
                          color={checked ? colors.primary : colors.textMuted}
                        />
                        <Text style={[styles.rightChipText, checked && styles.rightChipTextActive]}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.subLabel}>
                  Уровень 3 (владелец) задаёт все права автоматически; вы всегда можете
                  ограничить их вручную.
                </Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      setShowAddEmployee(false);
                      resetAddEmployee();
                    }}
                  >
                    <Text style={styles.cancelBtnText}>Отмена</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmBtn} onPress={handleAddEmployee}>
                    <Text style={styles.confirmBtnText}>Добавить</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {employees.length === 0 ? (
            <Text style={styles.emptyText}>Пока нет сотрудников</Text>
          ) : (
            employees.map((emp) => {
              const room = rooms.find((r) => r.id === emp.room_id);
              const meta = getLevelMeta(emp.access_level);
              const empQuests = emp.quest_ids;
              return (
                <View key={emp.id} style={styles.itemCard}>
                  <View style={[styles.itemIcon, !emp.is_active && { opacity: 0.45 }]}>
                    <Ionicons name="person" size={20} color={colors.secondary} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>
                      {emp.profile_id}
                    </Text>
                    <Text style={styles.itemSubtitle}>
                      {room?.name ?? 'Неизвестная локация'} · {emp.role}
                    </Text>
                    <View style={styles.empMeta}>
                      <View style={[styles.empLevel, { borderColor: meta.color + '55' }]}>
                        <Text style={{ color: meta.color, fontSize: 11, fontWeight: '700' }}>
                          {meta.short}
                        </Text>
                      </View>
                      <Text style={styles.empQuestsText}>
                        {empQuests.length} квестов
                      </Text>
                    </View>
                    <View style={styles.rightsRow}>
                      {RIGHTS_LIST.map((r) => {
                        const on = emp[r.key];
                        return (
                          <View key={r.key} style={styles.rightDot}>
                            <Ionicons
                              name={r.icon}
                              size={12}
                              color={on ? colors.success : colors.textMuted}
                            />
                            <Text style={{ fontSize: 11, color: on ? colors.textLight : colors.textMuted }}>
                              {r.label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                  <View style={styles.switchCol}>
                    <Switch
                      value={emp.is_active}
                      onValueChange={() => toggleActive(emp)}
                      trackColor={{ true: colors.primary, false: colors.border }}
                      thumbColor={emp.is_active ? colors.white : colors.textMuted}
                    />
                    <Text style={styles.switchLabel}>{emp.is_active ? 'Активен' : 'Заблокирован'}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {activeTab === 'bookings' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Все бронирования ({bookings.length})</Text>
          {bookings.length === 0 ? (
            <Text style={styles.emptyText}>Пока нет бронирований</Text>
          ) : (
            bookings.map((book) => (
              <View key={book.id} style={styles.itemCard}>
                <View style={styles.itemIcon}>
                  <Ionicons name="calendar" size={20} color={colors.success} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{book.booking_date} в {book.booking_time}</Text>
                  <Text style={styles.itemSubtitle}>
                    {book.players_count} игрок · {book.price} ₽ · {book.status}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { ...typography.bodySmall, color: colors.textMuted },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  section: { padding: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  addButtonText: { color: colors.white, fontWeight: '700' },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: { flex: 1, marginLeft: spacing.md },
  itemTitle: { ...typography.body, fontWeight: '600' },
  itemSubtitle: { ...typography.caption, marginTop: 2 },
  empMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  empLevel: {
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.round,
  },
  empQuestsText: { ...typography.caption, marginTop: 2 },
  rightsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  rightDot: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  switchCol: { alignItems: 'center', gap: 4 },
  switchLabel: { ...typography.caption },
  emptyText: { ...typography.body, textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg },
  modalTitle: { ...typography.h3, marginBottom: spacing.md },
  label: { ...typography.bodySmall, fontWeight: '600', marginBottom: spacing.sm },
  subLabel: { ...typography.caption, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  roomOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  roomOptionActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  roomOptionText: { ...typography.bodySmall, flex: 1 },
  roomOptionTextActive: { color: colors.primary, fontWeight: '600' },
  levelRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  levelOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    alignItems: 'center',
  },
  levelOptionLabel: { ...typography.bodySmall, color: colors.textLight },
  levelOptionShort: { ...typography.caption, marginTop: 2 },
  noQuests: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md },
  questOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  questOptionText: { ...typography.bodySmall, flex: 1 },
  rightsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs },
  rightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rightChipActive: { borderColor: colors.primary + '66', backgroundColor: colors.primary + '12' },
  rightChipText: { fontSize: 13, color: colors.textMuted },
  rightChipTextActive: { color: colors.primary, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  cancelBtn: { flex: 1, padding: spacing.md, alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  cancelBtnText: { color: colors.textLight, fontWeight: '600' },
  confirmBtn: { flex: 1, padding: spacing.md, alignItems: 'center', borderRadius: radius.md, backgroundColor: colors.primary },
  confirmBtnText: { color: colors.white, fontWeight: '700' },
});