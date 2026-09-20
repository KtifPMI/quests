import { supabase } from './supabase';
import { mockDb } from './mockDb';
import { Booking } from '../types';
import { USE_MOCK } from '../config';

export async function createBooking(
  data: Omit<
    Partial<Booking>,
    'id' | 'created_at' | 'updated_at'
  > & { quest_id: string; client_id: string }
): Promise<Booking> {
  if (USE_MOCK) {
    return mockDb.createBooking(data);
  }
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      ...data,
      employee_id: data.employee_id ?? null,
      booking_date: data.booking_date ?? '',
      booking_time: data.booking_time ?? '',
      players_count: data.players_count ?? 1,
      price: data.price ?? 0,
      status: data.status ?? 'pending',
      note: data.note ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return booking;
}

export async function getUserBookings(clientId: string): Promise<Booking[]> {
  if (USE_MOCK) {
    return mockDb.getBookings();
  }
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateBookingStatus(
  id: string,
  status: Booking['status']
): Promise<void> {
  if (USE_MOCK) {
    return mockDb.updateBookingStatus(id, status);
  }
  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}