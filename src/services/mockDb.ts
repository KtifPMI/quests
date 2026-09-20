import {
  QuestRoom,
  Quest,
  Booking,
  Employee,
  ChatMessage,
  Profile,
} from '../types';
import {
  mockRooms,
  mockQuests,
  mockBookings,
  mockEmployees,
  mockChatMessages,
} from '../data/mockData';

// Хранилище mock-данных. Имитирует базу данных в памяти,
// чтобы приложение работало без бэкенда. Сброс при перезапуске.

let rooms: QuestRoom[] = [...mockRooms];
let quests: Quest[] = [...mockQuests];
let bookings: Booking[] = [...mockBookings];
let employees: Employee[] = [...mockEmployees];
let chatMessages: ChatMessage[] = [...mockChatMessages];
let profiles: Profile[] = [];

function sleep(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockDb = {
  async getRooms(): Promise<QuestRoom[]> {
    await sleep();
    return [...rooms];
  },

  async getQuests(): Promise<Quest[]> {
    await sleep();
    return [...quests];
  },

  async getBookings(): Promise<Booking[]> {
    await sleep();
    return [...bookings];
  },

  async getEmployees(): Promise<Employee[]> {
    await sleep();
    return [...employees];
  },

  async getEmployeesByProfile(profileId: string): Promise<Employee[]> {
    await sleep(50);
    return employees.filter((e) => e.profile_id === profileId);
  },

  async addEmployee(
    data: Omit<
      Partial<Employee>,
      'id' | 'created_at' | 'updated_at'
    > & { room_id: string; profile_id: string }
  ): Promise<Employee> {
    await sleep();
    const level = data.access_level ?? 1;
    const employee: Employee = {
      id: `emp-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      room_id: data.room_id,
      profile_id: data.profile_id,
      role: data.role ?? (level === 3 ? 'Владелец' : level === 2 ? 'Администратор' : 'Сотрудник'),
      access_level: level,
      quest_ids: data.quest_ids ?? [],
      can_manage_bookings: data.can_manage_bookings ?? false,
      can_manage_quests: data.can_manage_quests ?? false,
      can_chat_with_clients: data.can_chat_with_clients ?? false,
      can_view_analytics: data.can_view_analytics ?? false,
      is_active: data.is_active ?? true,
    };
    employees = [...employees, employee];
    return employee;
  },

  async updateEmployee(id: string, patch: Partial<Employee>): Promise<void> {
    await sleep();
    employees = employees.map((e) =>
      e.id === id ? { ...e, ...patch, updated_at: new Date().toISOString() } : e
    );
  },

  async getChatMessages(roomId: string): Promise<ChatMessage[]> {
    await sleep();
    return chatMessages.filter((m) => m.room_id === roomId);
  },

  async createBooking(
    data: Omit<
      Partial<Booking>,
      'id' | 'created_at' | 'updated_at'
    > & { quest_id: string; client_id: string }
  ): Promise<Booking> {
    await sleep();
    const booking: Booking = {
      id: `booking-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      quest_id: data.quest_id,
      client_id: data.client_id,
      employee_id: data.employee_id ?? null,
      booking_date: data.booking_date ?? '',
      booking_time: data.booking_time ?? '',
      players_count: data.players_count ?? 1,
      price: data.price ?? 0,
      status: data.status ?? 'pending',
      note: data.note ?? null,
    };
    bookings = [booking, ...bookings];
    return booking;
  },

  async updateBookingStatus(
    id: string,
    status: Booking['status']
  ): Promise<void> {
    await sleep();
    bookings = bookings.map((b) =>
      b.id === id ? { ...b, status, updated_at: new Date().toISOString() } : b
    );
  },

  async sendMessage(
    data: Omit<
      Partial<ChatMessage>,
      'id' | 'created_at'
    > & { room_id: string; sender_id: string; text: string }
  ): Promise<ChatMessage> {
    await sleep();
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      created_at: new Date().toISOString(),
      room_id: data.room_id,
      booking_id: data.booking_id ?? null,
      sender_id: data.sender_id,
      receiver_id: data.receiver_id ?? null,
      sender_role: data.sender_role ?? 'client',
      text: data.text,
    };
    chatMessages = [...chatMessages, message];
    return message;
  },

  async upsertProfile(profile: Profile): Promise<void> {
    await sleep();
    const idx = profiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) profiles[idx] = profile;
    else profiles = [...profiles, profile];
  },

  async getProfile(id: string): Promise<Profile | undefined> {
    await sleep(50);
    return profiles.find((p) => p.id === id);
  },
};
