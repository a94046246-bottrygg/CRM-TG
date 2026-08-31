import { BotLogItem } from '../types';

const inMemoryLogs: BotLogItem[] = [];
const MAX_LOGS = 150;

function sanitize(text: string): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.length < 5) return text;
  return text.replaceAll(token, '[REDACTED_TELEGRAM_TOKEN]');
}

export const logger = {
  add(
    type: BotLogItem['type'],
    message: string,
    userId?: number | string,
    details?: Record<string, unknown>
  ) {
    const item: BotLogItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      type,
      message: sanitize(message),
      userId,
      details,
    };

    inMemoryLogs.unshift(item);
    if (inMemoryLogs.length > MAX_LOGS) {
      inMemoryLogs.pop();
    }

    const timeStr = new Date(item.timestamp).toISOString().split('T')[1].slice(0, 8);
    const userTag = userId ? ` [User: ${userId}]` : '';
    console.log(`[${timeStr}] [${type.toUpperCase()}]${userTag} ${item.message}`);
  },

  info(message: string, userId?: number | string, details?: Record<string, unknown>) {
    this.add('info', message, userId, details);
  },

  error(message: string, userId?: number | string, details?: Record<string, unknown>) {
    this.add('error', message, userId, details);
  },

  getRecent(limit = 40): BotLogItem[] {
    return inMemoryLogs.slice(0, limit);
  },

  getRecentLogs(): BotLogItem[] {
    return [...inMemoryLogs];
  },
};
