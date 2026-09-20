import { supabase } from './supabase';
import { mockDb } from './mockDb';
import { ChatMessage, UserRole } from '../types';
import { USE_MOCK } from '../config';

export async function getChatMessages(roomId: string): Promise<ChatMessage[]> {
  if (USE_MOCK) {
    return mockDb.getChatMessages(roomId);
  }
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function sendChatMessage(data: {
  room_id: string;
  booking_id?: string | null;
  sender_id: string;
  receiver_id?: string | null;
  sender_role: UserRole;
  text: string;
}): Promise<ChatMessage> {
  if (USE_MOCK) {
    return mockDb.sendMessage(data);
  }
  const { data: message, error } = await supabase
    .from('chat_messages')
    .insert({
      ...data,
      booking_id: data.booking_id ?? null,
      receiver_id: data.receiver_id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return message;
}