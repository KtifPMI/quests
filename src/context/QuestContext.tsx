import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { supabase } from '../services/supabase';
import { mockDb } from '../services/mockDb';
import { QuestRoom, Quest } from '../types';
import { USE_MOCK } from '../config';

interface QuestContextType {
  rooms: QuestRoom[];
  quests: Quest[];
  loadingRooms: boolean;
  loadingQuests: boolean;
  refreshRooms: () => Promise<void>;
  refreshQuests: () => Promise<void>;
  getRoomById: (id: string) => QuestRoom | undefined;
  getQuestsByRoom: (roomId: string) => Quest[];
}

const QuestContext = createContext<QuestContextType | undefined>(undefined);

export function QuestProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState<QuestRoom[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingQuests, setLoadingQuests] = useState(true);

  const refreshRooms = useCallback(async () => {
    setLoadingRooms(true);
    if (USE_MOCK) {
      const data = await mockDb.getRooms();
      setRooms(data);
    } else {
      const { data, error } = await supabase
        .from('quest_rooms')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setRooms(data as QuestRoom[]);
    }
    setLoadingRooms(false);
  }, []);

  const refreshQuests = useCallback(async () => {
    setLoadingQuests(true);
    if (USE_MOCK) {
      const data = await mockDb.getQuests();
      setQuests(data);
    } else {
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('is_active', true);
      if (!error && data) setQuests(data as Quest[]);
    }
    setLoadingQuests(false);
  }, []);

  useEffect(() => {
    refreshRooms();
    refreshQuests();
  }, [refreshRooms, refreshQuests]);

  const getRoomById = useCallback(
    (id: string) => rooms.find((r) => r.id === id),
    [rooms]
  );
  const getQuestsByRoom = useCallback(
    (roomId: string) => quests.filter((q) => q.room_id === roomId),
    [quests]
  );

  return (
    <QuestContext.Provider
      value={{
        rooms,
        quests,
        loadingRooms,
        loadingQuests,
        refreshRooms,
        refreshQuests,
        getRoomById,
        getQuestsByRoom,
      }}
    >
      {children}
    </QuestContext.Provider>
  );
}

export function useQuests() {
  const context = useContext(QuestContext);
  if (!context) {
    throw new Error('useQuests must be used within a QuestProvider');
  }
  return context;
}