import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';

import MapScreen from '../screens/MapScreen';
import QuestListScreen from '../screens/QuestListScreen';
import WorkScreen from '../screens/WorkScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type MainTabParamList = {
  Map: undefined;
  Quests: undefined;
  Work: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { isEmployee } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'map';
          if (route.name === 'Map') iconName = 'map-outline';
          else if (route.name === 'Quests') iconName = 'search-outline';
          else if (route.name === 'Work') iconName = 'briefcase-outline';
          else if (route.name === 'Profile') iconName = 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 4,
          paddingTop: 4,
        },
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Карта' }} />
      <Tab.Screen name="Quests" component={QuestListScreen} options={{ title: 'Квесты' }} />
      {isEmployee && (
        <Tab.Screen name="Work" component={WorkScreen} options={{ title: 'Работа' }} />
      )}
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профиль' }} />
    </Tab.Navigator>
  );
}