import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../theme';
import { useQuests } from '../context/QuestContext';
import { Quest } from '../types';
import { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const GENRES = ['Все', 'Ужасы', 'Детектив', 'Фантастика', 'Приключения', 'Исторический', 'Комедия'];

const DIFFICULTY_LABELS: Record<Quest['difficulty'], string> = {
  easy: 'Лёгкий',
  medium: 'Средний',
  hard: 'Сложный',
};

const DIFFICULTY_COLORS: Record<Quest['difficulty'], string> = {
  easy: colors.success,
  medium: colors.warning,
  hard: colors.danger,
};

export default function QuestListScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { quests, loadingQuests } = useQuests();
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Все');

  const filteredQuests = quests.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = selectedGenre === 'Все' || q.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const renderQuest = ({ item }: { item: Quest }) => (
    <TouchableOpacity
      style={styles.questCard}
      onPress={() => navigation.navigate('QuestDetail', { questId: item.id })}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.questImage} />
      ) : (
        <View style={styles.questImagePlaceholder}>
          <Ionicons name="game-controller" size={32} color={colors.primaryLight} />
        </View>
      )}
      <View style={styles.questInfo}>
        <View style={styles.questHeader}>
          <Text style={styles.questTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLORS[item.difficulty] + '20' }]}>
            <Text style={[styles.diffText, { color: DIFFICULTY_COLORS[item.difficulty] }]}>
              {DIFFICULTY_LABELS[item.difficulty]}
            </Text>
          </View>
        </View>
        <Text style={styles.questGenre}>{item.genre}</Text>
        <View style={styles.questMeta}>
          <Ionicons name="people-outline" size={14} color={colors.textLight} />
          <Text style={styles.questMetaText}>{item.players_min}-{item.players_max}</Text>
          <Ionicons name="time-outline" size={14} color={colors.textLight} style={{ marginLeft: spacing.sm }} />
          <Text style={styles.questMetaText}>{item.duration_min} мин</Text>
        </View>
        <Text style={styles.questPrice}>от {item.price_from} ₽</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.headerTitle}>Квесты</Text>
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск квеста..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={GENRES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.genresList}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.genreChip,
              selectedGenre === item && styles.genreChipActive,
            ]}
            onPress={() => setSelectedGenre(item)}
          >
            <Text
              style={[
                styles.genreText,
                selectedGenre === item && styles.genreTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loadingQuests ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredQuests}
          contentContainerStyle={styles.questsList}
          keyExtractor={(item) => item.id}
          renderItem={renderQuest}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Квесты не найдены</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerBar: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    ...shadows.header,
  },
  headerTitle: { ...typography.h2, color: colors.text },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, padding: spacing.sm + 4, fontSize: 15, color: colors.text },
  genresList: { paddingHorizontal: spacing.md, gap: spacing.sm },
  genreChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genreChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  genreText: { fontSize: 13, color: colors.textLight, fontWeight: '500' },
  genreTextActive: { color: colors.white },
  questsList: { padding: spacing.md, gap: spacing.md },
  questCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  questImage: { width: '100%', height: 140 },
  questImagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questInfo: { padding: spacing.md },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questTitle: { ...typography.h3, flex: 1, marginRight: spacing.sm },
  diffBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.round },
  diffText: { fontSize: 12, fontWeight: '600' },
  questGenre: { ...typography.bodySmall, marginTop: spacing.xs, color: colors.primary },
  questMeta: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  questMetaText: { fontSize: 13, color: colors.textLight, marginLeft: 4 },
  questPrice: { ...typography.h3, color: colors.primary, marginTop: spacing.sm },
  emptyText: { ...typography.body, textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});