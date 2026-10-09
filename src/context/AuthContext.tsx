import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { mockDb } from '../services/mockDb';
import { Profile, UserRole, Employee, EmployeeLevel } from '../types';
import { USE_MOCK, MOCK_ACCOUNTS } from '../config';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isClient: boolean;
  isEmployee: boolean;
  isOwner: boolean;
  employment: Employee[];
  maxAccessLevel: EmployeeLevel | null;
  refreshEmployment: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Занятость текущего пользователя: записи сотрудника по его профилям.
  const [employment, setEmployment] = useState<Employee[]>([]);

  // Храним вход в памяти для mock-режима
  const [mockLoggedIn, setMockLoggedIn] = useState(false);

  useEffect(() => {
    if (USE_MOCK) {
      // mock: без бэкенда, просто снимаем загрузку
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setEmployment([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    if (USE_MOCK) {
      const p = await mockDb.getProfile(userId);
      if (p) setProfile(p);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) setProfile(data as Profile);
  }

  const refreshEmployment = useCallback(
    async (profileId?: string) => {
      const id = profileId ?? profile?.id;
      if (!id) {
        setEmployment([]);
        return;
      }
      const records = await mockDb.getEmployeesByProfile(id);
      setEmployment(records.filter((e) => e.is_active));
    },
    [profile?.id]
  );

  useEffect(() => {
    if (USE_MOCK && profile?.id && role !== 'client') {
      refreshEmployment();
    }
  }, [profile?.id, role, refreshEmployment]);

  function mockUserFromProfile(profile: Profile): User {
    return {
      id: profile.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: profile.email ?? '',
      created_at: profile.created_at,
      updated_at: profile.updated_at ?? profile.created_at,
      app_metadata: {},
      user_metadata: {},
      identities: [],
    };
  }

  async function signIn(email: string, password: string) {
    if (USE_MOCK) {
      const account = MOCK_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === email.toLowerCase()
      );
      if (!account || password !== account.password) {
        throw new Error(
          'Неверный email или пароль. Демо: demo@quests.ru (владелец) или worker@quests.ru (сотрудник), пароль demo12345'
        );
      }
      const mockProfile: Profile = {
        id: account.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email: account.email,
        full_name: account.fullName,
        phone: null,
        avatar_url: null,
      };
      await mockDb.upsertProfile(mockProfile);
      setProfile(mockProfile);
      setUser(mockUserFromProfile(mockProfile));
      setRole(account.role);
      setMockLoggedIn(true);
      await refreshEmployment(mockProfile.id);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string, fullName: string) {
    if (USE_MOCK) {
      // в mock-режиме регистрация сразу заходит под клиентским профилем
      const mockProfile: Profile = {
        id: `mock-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email: email || 'demo@quests.ru',
        full_name: fullName || 'Новый пользователь',
        phone: null,
        avatar_url: null,
      };
      await mockDb.upsertProfile(mockProfile);
      setProfile(mockProfile);
      setUser(mockUserFromProfile(mockProfile));
      setRole('client');
      setEmployment([]);
      setMockLoggedIn(true);
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    if (USE_MOCK) {
      setMockLoggedIn(false);
      setProfile(null);
      setUser(null);
      setRole(null);
      setEmployment([]);
      return;
    }
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
    setEmployment([]);
  }

  const isAuthenticated = USE_MOCK ? mockLoggedIn : !!session;

  const isClient = role === 'client';
  const isEmployee = role === 'owner' || role === 'employee';
  const isOwner = role === 'owner';

  const maxAccessLevel: EmployeeLevel | null = isOwner
    ? 3
    : employment.length > 0
      ? (Math.max(...employment.map((e) => e.access_level)) as EmployeeLevel)
      : null;

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        role,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated,
        isClient,
        isEmployee,
        isOwner,
        employment,
        maxAccessLevel,
        refreshEmployment,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}