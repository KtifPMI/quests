export type UserRole = 'owner' | 'employee' | 'client';

export type EmployeeLevel = 1 | 2 | 3;

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export interface QuestRoom {
  id: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  name: string;
  description: string | null;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  cover_url: string | null;
  is_active: boolean;
}

export interface Quest {
  id: string;
  created_at: string;
  updated_at: string;
  room_id: string;
  title: string;
  description: string | null;
  genre: string;
  difficulty: 'easy' | 'medium' | 'hard';
  players_min: number;
  players_max: number;
  duration_min: number;
  price_from: number;
  age_limit: number;
  rating: number | null;
  image_url: string | null;
  is_active: boolean;
}

export interface Employee {
  id: string;
  created_at: string;
  updated_at: string;
  room_id: string;
  profile_id: string;
  role: string;
  access_level: EmployeeLevel;
  quest_ids: string[];
  can_manage_bookings: boolean;
  can_manage_quests: boolean;
  can_chat_with_clients: boolean;
  can_view_analytics: boolean;
  is_active: boolean;
}

export interface Booking {
  id: string;
  created_at: string;
  updated_at: string;
  quest_id: string;
  client_id: string;
  employee_id: string | null;
  booking_date: string;
  booking_time: string;
  players_count: number;
  price: number;
  status: BookingStatus;
  note: string | null;
}

export interface ChatMessage {
  id: string;
  created_at: string;
  room_id: string;
  booking_id: string | null;
  sender_id: string;
  receiver_id: string | null;
  sender_role: UserRole;
  text: string;
}

export interface Notification {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  body: string;
  is_read: boolean;
  type: string;
  data: Record<string, unknown> | null;
}

export interface Review {
  id: string;
  created_at: string;
  quest_id: string;
  client_id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
}