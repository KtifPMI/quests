import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const ROLE_LABELS: Record<UserRole, string> = {
  client: 'Клиент',
  employee: 'Сотрудник',
  owner: 'Владелец',
};

export default function ProfileScreen() {
  const { profile, user, signOut, isEmployee, role } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Выход', 'Выйти из аккаунта?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Профиль</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={colors.primary} />
        </View>
        <Text style={styles.name}>{profile?.full_name || 'Пользователь'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {role && <Text style={styles.roleBadge}>{ROLE_LABELS[role]}</Text>}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="time-outline" size={22} color={colors.primary} />
          <Text style={styles.menuText}>Мои бронирования</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="chatbubble-outline" size={22} color={colors.primary} />
          <Text style={styles.menuText}>Мои чаты</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="star-outline" size={22} color={colors.primary} />
          <Text style={styles.menuText}>Мои отзывы</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {isEmployee && (
        <View style={styles.workHint}>
          <Ionicons name="briefcase-outline" size={20} color={colors.secondary} />
          <Text style={styles.workHintText}>
            Рабочие инструменты — во вкладке «Работа» в нижнем меню.
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="settings-outline" size={22} color={colors.textLight} />
        <Text style={styles.menuText}>Настройки</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={22} color={colors.danger} />
        <Text style={[styles.menuText, { color: colors.danger }]}>Выйти</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
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
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: { ...typography.h2, marginTop: spacing.md },
  email: { ...typography.bodySmall, marginTop: spacing.xs },
  roleBadge: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.round,
    backgroundColor: colors.primary + '1A',
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
    overflow: 'hidden',
  },
  section: { backgroundColor: colors.surface, marginBottom: spacing.md },
  workHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.secondary + '14',
    borderWidth: 1,
    borderColor: colors.secondary + '40',
  },
  workHintText: { ...typography.bodySmall, flex: 1, color: colors.textLight },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  menuText: { ...typography.body, flex: 1, marginLeft: spacing.md },
});