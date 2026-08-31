export type LeadStatus =
  | 'Новый'
  | 'В работе'
  | 'Связались'
  | 'Пробный урок'
  | 'Успешно'
  | 'Отказ';

export interface Lead {
  id: string;
  createdAt: number;
  clientName: string;
  phone: string;
  telegramUsername: string | null;
  telegramUserId: number | string;
  goal: string;
  englishLevel: string;
  studyFormat: string;
  frequency: string;
  status: LeadStatus;
  comment: string;
  source: string;
  deliveredToManager?: boolean;
}

export type UserStep =
  | 'start'
  | 'goal'
  | 'level'
  | 'format'
  | 'frequency'
  | 'trial_offer'
  | 'waiting_name'
  | 'waiting_phone'
  | 'completed';

export interface UserState {
  userId: number;
  chatId: number;
  step: UserStep;
  goal: string | null;
  englishLevel: string | null;
  studyFormat: string | null;
  frequency: string | null;
  clientName: string | null;
  phone: string | null;
  username: string | null;
  firstName: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface BotLogItem {
  id: string;
  timestamp: number;
  type: 'start' | 'goal' | 'level' | 'format' | 'frequency' | 'name' | 'phone' | 'lead_created' | 'error' | 'info';
  message: string;
  userId?: number | string;
  details?: Record<string, unknown>;
}

export interface BotStatusResponse {
  status: 'running' | 'idle' | 'error';
  service: string;
  botConfigured: boolean;
  managerConfigured: boolean;
  botUsername: string | null;
  managerId: string | null;
  totalLeads: number;
  newLeadsCount: number;
  recentLogs: BotLogItem[];
  uptimeSeconds: number;
}
