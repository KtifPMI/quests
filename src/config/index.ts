import { UserRole } from '../types';

// Переключатель между локальными данными (mock) и живым бэкендом (Supabase).
//
// Чтобы тестировать без бэкенда — USE_MOCK = true (нет интернета/сервера).
// Когда подключишь Supabase (URL + Anon Key в .env) — поставь USE_MOCK = false.
export const USE_MOCK = true;

export interface MockAccount {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

// Демо-аккаунты для локального входа. Владельца назначает администратор
// приложения («я»), а владелец уже интегрирует сотрудников в свои квесты.
export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    id: 'mock-user-id',
    email: 'demo@quests.ru',
    password: 'demo12345',
    fullName: 'Демо Пользователь',
    role: 'owner',
  },
  {
    id: 'mock-worker-id',
    email: 'worker@quests.ru',
    password: 'demo12345',
    fullName: 'Анна Сидорова',
    role: 'employee',
  },
];

// Привязанная почта mock-пользователя, чтобы авторизация "работала" локально.
export const MOCK_USER = {
  email: 'demo@quests.ru',
  password: 'demo12345',
  fullName: 'Демо Пользователь',
  role: 'owner',
} as const;
