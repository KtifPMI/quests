-- ============================================
-- QuestsApp — PostgreSQL schema for Supabase
-- ============================================

-- Профили пользователей (создаётся автоматически при регистрации через триггер)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT
);

-- Триггер: автосоздание профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Локации/комнаты квестов
CREATE TABLE quest_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  owner_id UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  city TEXT NOT NULL,
  cover_url TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Квесты
CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  room_id UUID NOT NULL REFERENCES quest_rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  players_min INT DEFAULT 2,
  players_max INT DEFAULT 8,
  duration_min INT DEFAULT 60,
  price_from INT NOT NULL,
  age_limit INT DEFAULT 12,
  rating DOUBLE PRECISION,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Сотрудники локаций
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  room_id UUID NOT NULL REFERENCES quest_rooms(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT DEFAULT 'staff',
  can_manage_bookings BOOLEAN DEFAULT true,
  can_manage_quests BOOLEAN DEFAULT false,
  can_chat_with_clients BOOLEAN DEFAULT true,
  can_view_analytics BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(room_id, profile_id)
);

-- Бронирования
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  quest_id UUID NOT NULL REFERENCES quests(id),
  client_id UUID NOT NULL REFERENCES profiles(id),
  employee_id UUID REFERENCES profiles(id),
  booking_date TEXT NOT NULL,
  booking_time TEXT NOT NULL,
  players_count INT DEFAULT 1,
  price INT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  note TEXT
);

-- Чат
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  room_id UUID NOT NULL,
  booking_id UUID,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  receiver_id UUID REFERENCES profiles(id),
  sender_role TEXT CHECK (sender_role IN ('owner', 'employee', 'client')) DEFAULT 'client',
  text TEXT NOT NULL
);

-- Уведомления
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  type TEXT DEFAULT 'general',
  data JSONB
);

-- Отзывы
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  quest_id UUID NOT NULL REFERENCES quests(id),
  client_id UUID NOT NULL REFERENCES profiles(id),
  rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  is_approved BOOLEAN DEFAULT false
);

-- ============================================
-- Row Level Security (RLS) policies
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles:Anyone can read, user can update own
CREATE POLICY "Profiles: select all" ON profiles FOR SELECT USING (true);
CREATE POLICY "Profiles: update own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Quest Rooms:Anyone can read, owner can update
CREATE POLICY "Rooms: select active" ON quest_rooms FOR SELECT USING (is_active = true OR owner_id = auth.uid());
CREATE POLICY "Rooms: owner manages" ON quest_rooms FOR ALL USING (owner_id = auth.uid());

-- Quests:Anyone can read, room owner can manage
CREATE POLICY "Quests: select active" ON quests FOR SELECT USING (is_active = true);
CREATE POLICY "Quests: room owner manages" ON quests FOR ALL
  USING (room_id IN (SELECT id FROM quest_rooms WHERE owner_id = auth.uid()));

-- Employees:room owner can manage
CREATE POLICY "Employees: owner manages" ON employees FOR ALL
  USING (room_id IN (SELECT id FROM quest_rooms WHERE owner_id = auth.uid()));

-- Bookings:client can manage own, room owner/employee can view
CREATE POLICY "Bookings: client manages own" ON bookings FOR ALL USING (client_id = auth.uid());
CREATE POLICY "Bookings: room staff can view" ON bookings FOR SELECT
  USING (
    quest_id IN (
      SELECT q.id FROM quests q
      JOIN quest_rooms qr ON q.room_id = qr.id
      WHERE qr.owner_id = auth.uid()
      OR qr.id IN (SELECT room_id FROM employees WHERE profile_id = auth.uid())
    )
  );

-- Chat:participants can read/write
CREATE POLICY "Chat: sender writes" ON chat_messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Chat: participants read" ON chat_messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Notifications:user manages own
CREATE POLICY "Notifications: user manages" ON notifications FOR ALL USING (user_id = auth.uid());

-- Reviews:anyone can read approved, client manages own
CREATE POLICY "Reviews: read approved" ON reviews FOR SELECT USING (is_approved = true OR client_id = auth.uid());
CREATE POLICY "Reviews: client manages" ON reviews FOR ALL USING (client_id = auth.uid());

-- ============================================
-- Realtime:enable for chat_messages
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;