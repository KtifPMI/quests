import { supabase } from './supabase';
import { mockDb } from './mockDb';
import { QuestRoom, Employee, Booking, EmployeeLevel } from '../types';
import { USE_MOCK } from '../config';

export interface OwnerData {
  rooms: QuestRoom[];
  employees: Employee[];
  bookings: Booking[];
}

export async function getOwnerData(ownerId: string): Promise<OwnerData> {
  if (USE_MOCK) {
    const [rooms, employees, bookings] = await Promise.all([
      mockDb.getRooms(),
      mockDb.getEmployees(),
      mockDb.getBookings(),
    ]);
    return { rooms, employees, bookings };
  }

  const { data: roomsData, error: roomsError } = await supabase
    .from('quest_rooms')
    .select('*')
    .eq('owner_id', ownerId);
  if (roomsError) throw roomsError;
  const rooms = roomsData as QuestRoom[];

  const roomIds = rooms.map((r) => r.id);

  if (roomIds.length === 0) {
    return { rooms, employees: [], bookings: [] };
  }

  const [{ data: empData }, { data: bookData }] = await Promise.all([
    supabase.from('employees').select('*').in('room_id', roomIds),
    supabase.from('bookings').select('*').in('quest_id', roomIds),
  ]);

  return {
    rooms,
    employees: (empData as Employee[]) ?? [],
    bookings: (bookData as Booking[]) ?? [],
  };
}

export interface CreateEmployeeInput {
  room_id: string;
  profile_id: string;
  role: string;
  access_level: EmployeeLevel;
  quest_ids: string[];
  can_manage_bookings: boolean;
  can_manage_quests: boolean;
  can_chat_with_clients: boolean;
  can_view_analytics: boolean;
}

export async function createEmployee(
  input: CreateEmployeeInput
): Promise<Employee> {
  if (USE_MOCK) {
    return mockDb.addEmployee(input);
  }
  const { data, error } = await supabase
    .from('employees')
    .insert({
      room_id: input.room_id,
      profile_id: input.profile_id,
      role: input.role,
      access_level: input.access_level,
      quest_ids: input.quest_ids,
      can_manage_bookings: input.can_manage_bookings,
      can_manage_quests: input.can_manage_quests,
      can_chat_with_clients: input.can_chat_with_clients,
      can_view_analytics: input.can_view_analytics,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Employee;
}

export async function updateEmployee(
  id: string,
  patch: Partial<Employee>
): Promise<void> {
  if (USE_MOCK) {
    return mockDb.updateEmployee(id, patch);
  }
  const { error } = await supabase.from('employees').update(patch).eq('id', id);
  if (error) throw error;
}