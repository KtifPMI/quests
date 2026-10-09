import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../theme';
import { useQuests } from '../context/QuestContext';
import { RootStackParamList } from '../navigation/RootNavigator';
import YandexMap from '../components/YandexMap';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const MOSCOW_CENTER = { latitude: 55.7558, longitude: 37.6173 };

export default function MapScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { rooms, loadingRooms } = useQuests();
  const [center, setCenter] = useState(MOSCOW_CENTER);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        setCenter({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    })();
  }, []);

  if (loadingRooms) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.headerTitle}>QuestsApp</Text>
        <Ionicons name="notifications-outline" size={24} color={colors.text} />
      </View>

      <YandexMap
        style={styles.map}
        rooms={rooms}
        center={center}
        userLocation={userLocation}
        onPressRoom={(roomId) => navigation.navigate('RoomDetail', { roomId })}
      />

      <FlatList
        data={rooms}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.roomsList}
        keyExtractor={(item) => item.id}
        renderItem={({ item: room }) => (
          <TouchableOpacity
            style={styles.roomCard}
            onPress={() => navigation.navigate('RoomDetail', { roomId: room.id })}
          >
            <View style={styles.roomCardIcon}>
              <Ionicons name="location" size={20} color={colors.primary} />
            </View>
            <Text style={styles.roomCardName} numberOfLines={1}>{room.name}</Text>
            <Text style={styles.roomCardCity} numberOfLines={1}>{room.city}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    ...shadows.header,
  },
  headerTitle: { ...typography.h2, color: colors.primary },
  map: { flex: 1 },
  roomsList: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    gap: spacing.sm,
  },
  roomCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    minWidth: 160,
    ...shadows.card,
  },
  roomCardIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  roomCardName: { ...typography.bodySmall, fontWeight: '600' },
  roomCardCity: { ...typography.caption, marginTop: 2 },
});