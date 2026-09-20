import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getChatMessages, sendChatMessage } from '../services/chatService';
import { ChatMessage } from '../types';
import { USE_MOCK } from '../config';
import { supabase } from '../services/supabase';
import { RootStackParamList } from '../navigation/RootNavigator';

type Route = RouteProp<RootStackParamList, 'Chat'>;

export default function ChatScreen() {
  const route = useRoute<Route>();
  const { user, role } = useAuth();
  const { roomId } = route.params;
  const receiverId = route.params?.receiverId;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();
    if (USE_MOCK) return;

    const subscription = supabase
      .channel(`chat:${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [roomId]);

  async function fetchMessages() {
    try {
      const data = await getChatMessages(roomId);
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function sendMessage() {
    if (!text.trim() || !user) return;
    const msg = text.trim();
    setText('');

    const message = await sendChatMessage({
      room_id: roomId,
      sender_id: user.id,
      receiver_id: receiverId ?? null,
      sender_role: role === 'client' ? 'client' : 'employee',
      text: msg,
    });
    if (USE_MOCK) setMessages((prev) => [...prev, message]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        contentContainerStyle={styles.messagesList}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => {
          const isMine = item.sender_id === user?.id;
          return (
            <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
              <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                {item.text}
              </Text>
              <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
                {new Date(item.created_at).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Начните диалог</Text>
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Сообщение..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!text.trim()}
        >
          <Ionicons name="send" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  messagesList: { padding: spacing.md, paddingBottom: spacing.sm },
  emptyText: { ...typography.body, textAlign: 'center', color: colors.textMuted, marginTop: 60 },
  bubble: {
    maxWidth: '75%',
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    ...shadows.card,
  },
  bubbleText: { ...typography.body, color: colors.text },
  bubbleTextMine: { color: colors.white },
  bubbleTime: { ...typography.caption, marginTop: spacing.xs, color: colors.textLight },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});