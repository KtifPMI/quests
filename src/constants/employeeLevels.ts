import { colors } from '../theme';
import { EmployeeLevel } from '../types';

export interface EmployeeLevelMeta {
  level: EmployeeLevel;
  label: string;
  short: string;
  description: string;
  color: string;
}

export const EMPLOYEE_LEVELS: EmployeeLevelMeta[] = [
  {
    level: 1,
    label: 'Сотрудник',
    short: 'Уровень 1',
    description: 'Ведёт брони и чаты с клиентами на своих квестах.',
    color: colors.secondary,
  },
  {
    level: 2,
    label: 'Администратор',
    short: 'Уровень 2',
    description: 'Управляет квестами локации и видит аналитику.',
    color: colors.primary,
  },
  {
    level: 3,
    label: 'Владелец',
    short: 'Уровень 3',
    description: 'Полный доступ: сотрудники, уровни и права.',
    color: colors.warning,
  },
];

export function getLevelMeta(level: EmployeeLevel): EmployeeLevelMeta {
  return EMPLOYEE_LEVELS.find((l) => l.level === level) ?? EMPLOYEE_LEVELS[0];
}

export function getRoleLabelForLevel(level: EmployeeLevel): string {
  return getLevelMeta(level).label;
}

export function employeeRightsForLevel(level: EmployeeLevel) {
  return {
    can_manage_bookings: true,
    can_chat_with_clients: true,
    can_manage_quests: level >= 2,
    can_view_analytics: level >= 2,
  };
}