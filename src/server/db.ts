import fs from 'fs';
import path from 'path';
import { Lead, LeadStatus } from '../types';

const DATA_DIR = path.join(process.cwd(), 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

// Ensure data directory exists
function ensureStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(LEADS_FILE)) {
      const initialLeads: Lead[] = [
        {
          id: 'lead_1',
          createdAt: Date.now() - 1000 * 60 * 25, // 25 mins ago
          clientName: 'Андрей',
          phone: '+79991234567',
          telegramUsername: 'andrei_travel',
          telegramUserId: '582910321',
          goal: 'Для путешествий',
          englishLevel: 'Начинающий',
          studyFormat: 'Индивидуально',
          frequency: '2 раза в неделю',
          status: 'Новый',
          comment: 'Хочет подготовиться к поездке в Испанию летом.',
          source: 'Telegram',
          deliveredToManager: true,
        },
        {
          id: 'lead_2',
          createdAt: Date.now() - 1000 * 60 * 75, // 1h 15m ago
          clientName: 'Екатерина',
          phone: '+79168884422',
          telegramUsername: 'kate_it_lead',
          telegramUserId: '491029482',
          goal: 'Для работы',
          englishLevel: 'Средний',
          studyFormat: 'Индивидуально',
          frequency: '3 раза в неделю',
          status: 'В работе',
          comment: 'Собеседование в международную компанию через месяц.',
          source: 'Telegram',
          deliveredToManager: true,
        },
        {
          id: 'lead_3',
          createdAt: Date.now() - 1000 * 60 * 240, // 4 hours ago
          clientName: 'Михаил',
          phone: '+79035551133',
          telegramUsername: null,
          telegramUserId: '381928491',
          goal: 'Хочу свободно говорить',
          englishLevel: 'Базовый',
          studyFormat: 'В группе',
          frequency: '2 раза в неделю',
          status: 'Пробный урок',
          comment: 'Записан на пробный урок в среду 19:00.',
          source: 'Telegram',
          deliveredToManager: false,
        },
      ];
      fs.writeFileSync(LEADS_FILE, JSON.stringify(initialLeads, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error initializing leads database file:', err);
  }
}

// In-memory cache synced with disk
let cachedLeads: Lead[] = [];

function loadLeads(): Lead[] {
  ensureStorage();
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const data = fs.readFileSync(LEADS_FILE, 'utf-8');
      cachedLeads = JSON.parse(data);
      return cachedLeads;
    }
  } catch (err) {
    console.error('Error reading leads from disk:', err);
  }
  return cachedLeads;
}

function saveLeads(leads: Lead[]) {
  ensureStorage();
  try {
    cachedLeads = leads;
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving leads to disk:', err);
    throw err;
  }
}

// Initialize on startup
ensureStorage();
loadLeads();

export const db = {
  getLeads(): Lead[] {
    const leads = loadLeads();
    // Sort createdAt DESC (newest first)
    return [...leads].sort((a, b) => b.createdAt - a.createdAt);
  },

  getLeadById(id: string): Lead | undefined {
    const leads = loadLeads();
    return leads.find((lead) => lead.id === id);
  },

  createLead(data: {
    clientName: string;
    phone: string;
    telegramUsername?: string | null;
    telegramUserId: number | string;
    goal: string;
    englishLevel: string;
    studyFormat: string;
    frequency: string;
    status?: LeadStatus;
    comment?: string;
    source?: string;
    deliveredToManager?: boolean;
  }): Lead {
    const leads = loadLeads();
    const newLead: Lead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      clientName: data.clientName.trim(),
      phone: data.phone.trim(),
      telegramUsername: data.telegramUsername || null,
      telegramUserId: String(data.telegramUserId),
      goal: data.goal,
      englishLevel: data.englishLevel,
      studyFormat: data.studyFormat,
      frequency: data.frequency,
      status: data.status || 'Новый',
      comment: data.comment || '',
      source: data.source || 'Telegram',
      deliveredToManager: data.deliveredToManager ?? false,
    };

    leads.unshift(newLead);
    saveLeads(leads);
    return newLead;
  },

  updateLead(
    id: string,
    updates: {
      status?: LeadStatus;
      comment?: string;
      deliveredToManager?: boolean;
    }
  ): Lead | null {
    const leads = loadLeads();
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) return null;

    const current = leads[index];
    const updated: Lead = {
      ...current,
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      ...(updates.comment !== undefined ? { comment: updates.comment } : {}),
      ...(updates.deliveredToManager !== undefined ? { deliveredToManager: updates.deliveredToManager } : {}),
    };

    leads[index] = updated;
    saveLeads(leads);
    return updated;
  },

  deleteLead(id: string): boolean {
    const leads = loadLeads();
    const filtered = leads.filter((l) => l.id !== id);
    if (filtered.length !== leads.length) {
      saveLeads(filtered);
      return true;
    }
    return false;
  },
};
