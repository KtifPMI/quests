import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { QuestProvider } from './src/context/QuestContext';
import RootNavigator from './src/navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <AuthProvider>
      <QuestProvider>
        <RootNavigator />
        <StatusBar style="light" />
      </QuestProvider>
    </AuthProvider>
  );
}