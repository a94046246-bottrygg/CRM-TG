import TelegramBot, { Message, CallbackQuery } from 'node-telegram-bot-api';
import { UserState, Lead, LeadStatus } from '../types';
import { db } from './db';
import { logger } from './logger';

// In-memory state storage for ongoing Telegram questionnaires: Map<telegramUserId, UserState>
const userStates = new Map<number, UserState>();

let botInstance: TelegramBot | null = null;
let botUsername: string | null = null;
let isPollingStarted = false;
const startTime = Date.now();

// Helpers for User State
export function getUserState(userId: number): UserState | undefined {
  return userStates.get(userId);
}

export function resetUserState(
  userId: number,
  chatId: number,
  username?: string | null,
  firstName?: string | null
): UserState {
  const newState: UserState = {
    userId,
    chatId,
    step: 'start',
    goal: null,
    englishLevel: null,
    studyFormat: null,
    frequency: null,
    clientName: null,
    phone: null,
    username: username || null,
    firstName: firstName || null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  userStates.set(userId, newState);
  return newState;
}

export function getOrCreateUserState(
  userId: number,
  chatId: number,
  username?: string | null,
  firstName?: string | null
): UserState {
  const existing = userStates.get(userId);
  if (existing) {
    if (username) existing.username = username;
    if (firstName) existing.firstName = firstName;
    existing.chatId = chatId;
    return existing;
  }
  return resetUserState(userId, chatId, username, firstName);
}

// Telegram Keyboards
export const Keyboards = {
  mainMenu: {
    inline_keyboard: [
      [{ text: '🎯 Подобрать программу', callback_data: 'quiz_start' }],
      [{ text: '💰 Узнать стоимость', callback_data: 'pricing' }],
      [{ text: '📚 О школе', callback_data: 'about' }],
    ],
  },

  goal: {
    inline_keyboard: [
      [{ text: '💼 Для работы', callback_data: 'goal_work' }],
      [{ text: '✈️ Для путешествий', callback_data: 'goal_travel' }],
      [{ text: '🎓 Для учёбы', callback_data: 'goal_study' }],
      [{ text: '🗣 Хочу свободно говорить', callback_data: 'goal_speaking' }],
    ],
  },

  level: {
    inline_keyboard: [
      [{ text: '🌱 Начинающий', callback_data: 'level_beginner' }],
      [{ text: '📖 Базовый', callback_data: 'level_basic' }],
      [{ text: '💬 Средний', callback_data: 'level_intermediate' }],
      [{ text: '🚀 Продвинутый', callback_data: 'level_advanced' }],
      [{ text: '🤷 Не знаю', callback_data: 'level_unknown' }],
    ],
  },

  format: {
    inline_keyboard: [
      [{ text: '👤 Индивидуально', callback_data: 'format_personal' }],
      [{ text: '👥 В группе', callback_data: 'format_group' }],
      [{ text: '🤖 Самостоятельно + AI', callback_data: 'format_ai' }],
      [{ text: '🤷 Помогите выбрать', callback_data: 'format_help' }],
    ],
  },

  frequency: {
    inline_keyboard: [
      [{ text: '2 раза в неделю', callback_data: 'freq_2' }],
      [{ text: '3 раза в неделю', callback_data: 'freq_3' }],
      [{ text: 'Каждый день', callback_data: 'freq_daily' }],
      [{ text: 'Пока не знаю', callback_data: 'freq_unknown' }],
    ],
  },

  trialOffer: {
    inline_keyboard: [
      [{ text: '🎁 Да, хочу', callback_data: 'trial_yes' }],
      [{ text: '❌ Нет, спасибо', callback_data: 'trial_no' }],
    ],
  },

  phoneRequest: {
    keyboard: [
      [{ text: '📱 Отправить мой номер', request_contact: true }],
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  },

  afterCompleted: {
    inline_keyboard: [
      [{ text: '🏠 В главное меню', callback_data: 'menu_main' }],
      [{ text: '🔄 Подобрать заново', callback_data: 'quiz_start' }],
    ],
  },

  infoMenu: {
    inline_keyboard: [
      [{ text: '🎯 Подобрать программу', callback_data: 'quiz_start' }],
      [{ text: '🏠 Главное меню', callback_data: 'menu_main' }],
    ],
  },
};

// Telegram Standard Texts
export const Texts = {
  start: `Привет! 👋\n\nЯ помощник онлайн-школы Easy English.\n\nПомогу подобрать программу английского под твою цель. Это займёт около минуты.`,
  goalQuestion: `Для начала расскажи, зачем тебе английский?`,
  levelQuestion: `Как ты оцениваешь свой английский сейчас?`,
  formatQuestion: `Как тебе удобнее заниматься?`,
  frequencyQuestion: `Сколько времени ты готов уделять английскому?`,
  nameQuestion: `Как тебя зовут?`,
  pricing: `Стоимость зависит от формата обучения:\n\n👤 Индивидуальные занятия\nот 1 500 ₽ / занятие\n\n👥 Групповые занятия\nот 6 900 ₽ / месяц\n\n🤖 Самостоятельное обучение + AI\nот 2 900 ₽ / месяц\n\nХочешь подобрать подходящую программу?`,
  about: `📚 Easy English — современная онлайн-школа английского языка.\n\nЧто мы предлагаем:\n• Персональный подбор программы под ваши цели\n• Занятия 1-на-1 с опытными преподавателями\n• Групповые разговорные клубы\n• Интерактивная платформа и AI-тренажёр\n• Сертификат после каждого уровня`,
  trialDeclined: `Понял! Если появятся вопросы или захочешь вернуться к подбору позже — мы всегда на связи. 🙌`,
  phoneInvalid: `Похоже, это не номер телефона. Попробуй ещё раз или нажми «📱 Отправить мой номер».`,
};

// Formats summary of trial offer
export function formatTrialOfferText(state: UserState): string {
  return `Отлично! Я подобрал подходящий вариант 🎯\n\nТвоя цель: ${state.goal || 'Не указано'}\nТекущий уровень: ${state.englishLevel || 'Не указано'}\nПредпочтительный формат: ${state.studyFormat || 'Не указано'}\nЧастота занятий: ${state.frequency || 'Не указано'}\n\nХочешь получить бесплатный пробный урок?`;
}

// Formats final lead confirmation text
export function formatSuccessText(state: UserState): string {
  return `Готово! 🎉\n\nТвоя заявка принята.\n\nИмя: ${state.clientName || 'Клиент'}\nЦель: ${state.goal || '-'}\nУровень: ${state.englishLevel || '-'}\nФормат: ${state.studyFormat || '-'}\nЧастота занятий: ${state.frequency || '-'}\nТелефон: ${state.phone || '-'}\n\nМенеджер получил заявку и свяжется с тобой.`;
}

// Send lead notification to manager telegram chat if configured
async function notifyManager(lead: Lead) {
  const managerId = process.env.MANAGER_TELEGRAM_ID?.trim();
  if (!managerId || !botInstance) return;

  try {
    const text = `🔔 <b>Новая заявка в Easy English CRM!</b>\n\n👤 <b>Имя:</b> ${lead.clientName}\n📞 <b>Телефон:</b> <code>${lead.phone}</code>\n✈️ <b>Цель:</b> ${lead.goal}\n🌱 <b>Уровень:</b> ${lead.englishLevel}\n👥 <b>Формат:</b> ${lead.studyFormat}\n⏱ <b>Частота:</b> ${lead.frequency}\n💬 <b>Telegram:</b> ${lead.telegramUsername ? `@${lead.telegramUsername}` : 'Не указан'} (ID: <code>${lead.telegramUserId}</code>)\n📅 <b>Время:</b> ${new Date(lead.createdAt).toLocaleString('ru-RU')}`;
    await botInstance.sendMessage(managerId, text, { parse_mode: 'HTML' });
    logger.info(`Заявка ${lead.id} успешно доставлена менеджеру (ID: ${managerId})`);
  } catch (err: unknown) {
    logger.error(`Не удалось отправить заявку менеджеру: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// Handler for incoming Telegram text and contact messages
async function handleMessage(bot: TelegramBot, msg: Message) {
  const chatId = msg.chat.id;
  const userId = msg.from?.id || chatId;
  const username = msg.from?.username || null;
  const firstName = msg.from?.first_name || null;
  const text = (msg.text || '').trim();

  // 1. Command /start
  if (text.startsWith('/start')) {
    console.log(`Telegram User ID: ${userId}`);
    logger.add('start', `Telegram User ID: ${userId}`, userId, { username, firstName });
    const state = resetUserState(userId, chatId, username, firstName);
    state.step = 'start';
    await bot.sendMessage(chatId, Texts.start, {
      reply_markup: Keyboards.mainMenu,
    });
    return;
  }

  const state = getOrCreateUserState(userId, chatId, username, firstName);

  // 2. Waiting for Name
  if (state.step === 'waiting_name' && text) {
    state.clientName = text;
    state.step = 'waiting_phone';
    state.updatedAt = Date.now();
    logger.add('name', `Имя клиента: ${text}`, userId);

    await bot.sendMessage(
      chatId,
      `Приятно познакомиться, ${text}! 👋\n\nТеперь напиши номер телефона или отправь его кнопкой ниже.`,
      {
        reply_markup: Keyboards.phoneRequest,
      }
    );
    return;
  }

  // 3. Waiting for Phone (either shared Contact or text)
  if (state.step === 'waiting_phone') {
    let phone: string | null = null;

    if (msg.contact && msg.contact.phone_number) {
      phone = msg.contact.phone_number.trim();
      if (!phone.startsWith('+')) {
        phone = `+${phone}`;
      }
    } else if (text) {
      const cleanDigits = text.replace(/[^\d+]/g, '');
      if (cleanDigits.length >= 6) {
        phone = text;
      }
    }

    if (!phone) {
      await bot.sendMessage(chatId, Texts.phoneInvalid, {
        reply_markup: Keyboards.phoneRequest,
      });
      return;
    }

    state.phone = phone;
    state.step = 'completed';
    state.updatedAt = Date.now();
    logger.add('phone', `Телефон: ${phone}`, userId);

    try {
      // Save lead to persistent database
      const newLead = db.createLead({
        clientName: state.clientName || 'Пользователь',
        phone: state.phone,
        telegramUsername: state.username,
        telegramUserId: state.userId,
        goal: state.goal || 'Не указана',
        englishLevel: state.englishLevel || 'Не указан',
        studyFormat: state.studyFormat || 'Не указан',
        frequency: state.frequency || 'Не указана',
        status: 'Новый',
        comment: '',
        source: 'Telegram',
        deliveredToManager: !!process.env.MANAGER_TELEGRAM_ID,
      });

      logger.add('lead_created', `Создан лид ${newLead.id} для ${newLead.clientName}`, userId);

      // Remove reply keyboard and send final confirmation
      await bot.sendMessage(chatId, formatSuccessText(state), {
        reply_markup: {
          remove_keyboard: true,
        },
      });

      // Send navigation buttons
      await bot.sendMessage(chatId, 'Чем ещё могу помочь?', {
        reply_markup: Keyboards.afterCompleted,
      });

      // Notify manager via Telegram
      await notifyManager(newLead);
    } catch (err: unknown) {
      logger.error(`Ошибка при сохранении лида: ${err instanceof Error ? err.message : String(err)}`);
      await bot.sendMessage(
        chatId,
        'Не удалось отправить заявку. Попробуй ещё раз через несколько секунд.',
        {
          reply_markup: Keyboards.mainMenu,
        }
      );
    }
    return;
  }

  // Fallback default message
  await bot.sendMessage(
    chatId,
    `Привет! Чтобы начать подбор программы, нажми кнопку ниже или напиши /start`,
    {
      reply_markup: Keyboards.mainMenu,
    }
  );
}

// Handler for Callback Queries (Inline Buttons)
async function handleCallbackQuery(bot: TelegramBot, query: CallbackQuery) {
  const data = query.data;
  const message = query.message;
  if (!message || !data) return;

  const chatId = message.chat.id;
  const userId = query.from.id;
  const username = query.from.username || null;
  const firstName = query.from.first_name || null;

  try {
    await bot.answerCallbackQuery(query.id);
  } catch {
    // Ignore callback timeout
  }

  const state = getOrCreateUserState(userId, chatId, username, firstName);

  // A. Main Menu Actions
  if (data === 'menu_main') {
    state.step = 'start';
    await bot.sendMessage(chatId, Texts.start, {
      reply_markup: Keyboards.mainMenu,
    });
    return;
  }

  if (data === 'pricing') {
    await bot.sendMessage(chatId, Texts.pricing, {
      reply_markup: Keyboards.infoMenu,
    });
    return;
  }

  if (data === 'about') {
    await bot.sendMessage(chatId, Texts.about, {
      reply_markup: Keyboards.infoMenu,
    });
    return;
  }

  // B. Start Quiz
  if (data === 'quiz_start' || data === 'quiz_restart') {
    state.step = 'goal';
    state.goal = null;
    state.englishLevel = null;
    state.studyFormat = null;
    state.frequency = null;
    state.clientName = null;
    state.phone = null;
    state.updatedAt = Date.now();

    await bot.sendMessage(chatId, Texts.goalQuestion, {
      reply_markup: Keyboards.goal,
    });
    return;
  }

  // C. Goal Selection
  if (data.startsWith('goal_')) {
    const goalsMap: Record<string, string> = {
      goal_work: 'Для работы',
      goal_travel: 'Для путешествий',
      goal_study: 'Для учёбы',
      goal_speaking: 'Хочу свободно говорить',
    };
    state.goal = goalsMap[data] || 'Для работы';
    state.step = 'level';
    state.updatedAt = Date.now();
    logger.add('goal', `Цель: ${state.goal}`, userId);

    await bot.sendMessage(chatId, Texts.levelQuestion, {
      reply_markup: Keyboards.level,
    });
    return;
  }

  // D. Level Selection
  if (data.startsWith('level_')) {
    const levelMap: Record<string, string> = {
      level_beginner: 'Начинающий',
      level_basic: 'Базовый',
      level_intermediate: 'Средний',
      level_advanced: 'Продвинутый',
      level_unknown: 'Не знаю',
    };
    state.englishLevel = levelMap[data] || 'Начинающий';
    state.step = 'format';
    state.updatedAt = Date.now();
    logger.add('level', `Уровень: ${state.englishLevel}`, userId);

    await bot.sendMessage(chatId, Texts.formatQuestion, {
      reply_markup: Keyboards.format,
    });
    return;
  }

  // E. Format Selection
  if (data.startsWith('format_')) {
    const formatMap: Record<string, string> = {
      format_personal: 'Индивидуально',
      format_group: 'В группе',
      format_ai: 'Самостоятельно + AI',
      format_help: 'Помогите выбрать',
    };
    state.studyFormat = formatMap[data] || 'Индивидуально';
    state.step = 'frequency';
    state.updatedAt = Date.now();
    logger.add('format', `Формат: ${state.studyFormat}`, userId);

    await bot.sendMessage(chatId, Texts.frequencyQuestion, {
      reply_markup: Keyboards.frequency,
    });
    return;
  }

  // F. Frequency Selection -> Offer Trial
  if (data.startsWith('freq_') || data.startsWith('frequency_')) {
    const freqMap: Record<string, string> = {
      freq_2: '2 раза в неделю',
      frequency_2: '2 раза в неделю',
      freq_3: '3 раза в неделю',
      frequency_3: '3 раза в неделю',
      freq_daily: 'Каждый день',
      frequency_daily: 'Каждый день',
      freq_unknown: 'Пока не знаю',
      frequency_unknown: 'Пока не знаю',
    };
    state.frequency = freqMap[data] || '2 раза в неделю';
    state.step = 'trial_offer';
    state.updatedAt = Date.now();
    logger.add('frequency', `Частота: ${state.frequency}`, userId);

    await bot.sendMessage(chatId, formatTrialOfferText(state), {
      reply_markup: Keyboards.trialOffer,
    });
    return;
  }

  // G. Trial Offer Decision
  if (data === 'trial_yes') {
    state.step = 'waiting_name';
    state.updatedAt = Date.now();
    await bot.sendMessage(chatId, Texts.nameQuestion);
    return;
  }

  if (data === 'trial_no') {
    state.step = 'completed';
    state.updatedAt = Date.now();
    await bot.sendMessage(chatId, Texts.trialDeclined, {
      reply_markup: Keyboards.mainMenu,
    });
    return;
  }
}

// Initialize Telegram Bot Engine
export function initTelegramBot(): { bot: TelegramBot | null; error?: string } {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();

  if (!token) {
    return {
      bot: null,
      error: 'TELEGRAM_BOT_TOKEN не задан в переменных окружения.',
    };
  }

  if (botInstance && isPollingStarted) {
    return { bot: botInstance };
  }

  try {
    botInstance = new TelegramBot(token, { polling: true });
    isPollingStarted = true;

    botInstance.getMe().then((me) => {
      botUsername = me.username || null;
      logger.info(`Telegram Bot @${botUsername || 'easy_english_bot'} успешно авторизован!`);
    }).catch((err) => {
      logger.error(`Ошибка авторизации Telegram Bot: ${err.message}`);
    });

    botInstance.on('message', async (msg) => {
      try {
        await handleMessage(botInstance!, msg);
      } catch (err: unknown) {
        logger.error(`Ошибка при обработке сообщения: ${err instanceof Error ? err.message : String(err)}`);
      }
    });

    botInstance.on('callback_query', async (query) => {
      try {
        await handleCallbackQuery(botInstance!, query);
      } catch (err: unknown) {
        logger.error(`Ошибка при обработке кнопки callback: ${err instanceof Error ? err.message : String(err)}`);
      }
    });

    botInstance.on('polling_error', (err) => {
      // Avoid spamming if token is wrong
      if (err.message.includes('401') || err.message.includes('ETELEGRAM')) {
        logger.error(`Telegram Polling Error: ${err.message}`);
      }
    });

    return { bot: botInstance };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error(`Не удалось инициализировать Telegram Bot: ${errorMsg}`);
    return { bot: null, error: errorMsg };
  }
}

// Bot & Server Status
export function getBotStatus() {
  const leads = db.getLeads();
  const newLeads = leads.filter((l) => l.status === 'Новый').length;

  return {
    status: (botInstance ? 'running' : 'idle') as 'running' | 'idle',
    service: 'Easy English Telegram Bot & CRM Backend',
    botConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    managerConfigured: Boolean(process.env.MANAGER_TELEGRAM_ID),
    botUsername: botUsername,
    managerId: process.env.MANAGER_TELEGRAM_ID || null,
    totalLeads: leads.length,
    newLeadsCount: newLeads,
    recentLogs: logger.getRecent(40),
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
  };
}

// Interactive Web Simulator Processor
export async function processSimulatorAction(
  userId: number,
  actionType: 'command' | 'callback' | 'text' | 'contact',
  payload: {
    command?: string;
    callbackData?: string;
    text?: string;
    contact?: { phone_number: string };
    userName?: string;
    userHandle?: string;
  }
) {
  const state = getOrCreateUserState(
    userId,
    userId,
    payload.userHandle || 'andrei_travel',
    payload.userName || 'Андрей'
  );

  const replies: Array<{
    text: string;
    keyboard?: any;
    keyboardType?: 'inline' | 'reply' | 'none';
  }> = [];

  if (actionType === 'command' && payload.command === '/start') {
    const refreshed = resetUserState(userId, userId, payload.userHandle || 'andrei_travel', payload.userName || 'Андрей');
    refreshed.step = 'start';
    console.log(`Telegram User ID: ${userId}`);
    logger.add('start', `Telegram User ID: ${userId}`, userId);
    replies.push({
      text: Texts.start,
      keyboardType: 'inline',
      keyboard: Keyboards.mainMenu,
    });
    return { state: refreshed, botReplies: replies };
  }

  if (actionType === 'callback') {
    const cb = payload.callbackData || '';

    if (cb === 'menu_main') {
      state.step = 'start';
      replies.push({
        text: Texts.start,
        keyboardType: 'inline',
        keyboard: Keyboards.mainMenu,
      });
    } else if (cb === 'pricing') {
      replies.push({
        text: Texts.pricing,
        keyboardType: 'inline',
        keyboard: Keyboards.infoMenu,
      });
    } else if (cb === 'about') {
      replies.push({
        text: Texts.about,
        keyboardType: 'inline',
        keyboard: Keyboards.infoMenu,
      });
    } else if (cb === 'quiz_start' || cb === 'quiz_restart') {
      state.step = 'goal';
      state.goal = null;
      state.englishLevel = null;
      state.studyFormat = null;
      state.frequency = null;
      state.clientName = null;
      state.phone = null;
      replies.push({
        text: Texts.goalQuestion,
        keyboardType: 'inline',
        keyboard: Keyboards.goal,
      });
    } else if (cb.startsWith('goal_')) {
      const goalsMap: Record<string, string> = {
        goal_work: 'Для работы',
        goal_travel: 'Для путешествий',
        goal_study: 'Для учёбы',
        goal_speaking: 'Хочу свободно говорить',
      };
      state.goal = goalsMap[cb] || 'Для работы';
      state.step = 'level';
      logger.add('goal', `Цель: ${state.goal}`, userId);
      replies.push({
        text: Texts.levelQuestion,
        keyboardType: 'inline',
        keyboard: Keyboards.level,
      });
    } else if (cb.startsWith('level_')) {
      const levelMap: Record<string, string> = {
        level_beginner: 'Начинающий',
        level_basic: 'Базовый',
        level_intermediate: 'Средний',
        level_advanced: 'Продвинутый',
        level_unknown: 'Не знаю',
      };
      state.englishLevel = levelMap[cb] || 'Начинающий';
      state.step = 'format';
      logger.add('level', `Уровень: ${state.englishLevel}`, userId);
      replies.push({
        text: Texts.formatQuestion,
        keyboardType: 'inline',
        keyboard: Keyboards.format,
      });
    } else if (cb.startsWith('format_')) {
      const formatMap: Record<string, string> = {
        format_personal: 'Индивидуально',
        format_group: 'В группе',
        format_ai: 'Самостоятельно + AI',
        format_help: 'Помогите выбрать',
      };
      state.studyFormat = formatMap[cb] || 'Индивидуально';
      state.step = 'frequency';
      logger.add('format', `Формат: ${state.studyFormat}`, userId);
      replies.push({
        text: Texts.frequencyQuestion,
        keyboardType: 'inline',
        keyboard: Keyboards.frequency,
      });
    } else if (cb.startsWith('freq_') || cb.startsWith('frequency_')) {
      const freqMap: Record<string, string> = {
        freq_2: '2 раза в неделю',
        frequency_2: '2 раза в неделю',
        freq_3: '3 раза в неделю',
        frequency_3: '3 раза в неделю',
        freq_daily: 'Каждый день',
        frequency_daily: 'Каждый день',
        freq_unknown: 'Пока не знаю',
        frequency_unknown: 'Пока не знаю',
      };
      state.frequency = freqMap[cb] || '2 раза в неделю';
      state.step = 'trial_offer';
      logger.add('frequency', `Частота: ${state.frequency}`, userId);
      replies.push({
        text: formatTrialOfferText(state),
        keyboardType: 'inline',
        keyboard: Keyboards.trialOffer,
      });
    } else if (cb === 'trial_yes') {
      state.step = 'waiting_name';
      replies.push({
        text: Texts.nameQuestion,
        keyboardType: 'none',
      });
    } else if (cb === 'trial_no') {
      state.step = 'completed';
      replies.push({
        text: Texts.trialDeclined,
        keyboardType: 'inline',
        keyboard: Keyboards.mainMenu,
      });
    }
    return { state, botReplies: replies };
  }

  if (actionType === 'text') {
    const rawText = (payload.text || '').trim();

    if (state.step === 'waiting_name') {
      state.clientName = rawText;
      state.step = 'waiting_phone';
      logger.add('name', `Имя клиента: ${rawText}`, userId);
      replies.push({
        text: `Приятно познакомиться, ${rawText}! 👋\n\nТеперь напиши номер телефона или отправь его кнопкой ниже.`,
        keyboardType: 'reply',
        keyboard: Keyboards.phoneRequest,
      });
      return { state, botReplies: replies };
    }

    if (state.step === 'waiting_phone') {
      state.phone = rawText;
      state.step = 'completed';
      logger.add('phone', `Телефон: ${rawText}`, userId);

      const newLead = db.createLead({
        clientName: state.clientName || 'Андрей',
        phone: state.phone,
        telegramUsername: state.username,
        telegramUserId: state.userId,
        goal: state.goal || 'Для путешествий',
        englishLevel: state.englishLevel || 'Начинающий',
        studyFormat: state.studyFormat || 'Индивидуально',
        frequency: state.frequency || '2 раза в неделю',
        status: 'Новый',
        comment: '',
        source: 'Telegram',
        deliveredToManager: !!process.env.MANAGER_TELEGRAM_ID,
      });

      logger.add('lead_created', `Создан лид ${newLead.id} для ${newLead.clientName}`, userId);

      replies.push({
        text: formatSuccessText(state),
        keyboardType: 'inline',
        keyboard: Keyboards.afterCompleted,
      });

      await notifyManager(newLead);
      return { state, botReplies: replies };
    }
  }

  if (actionType === 'contact') {
    const phone = payload.contact?.phone_number || '+79991234567';
    state.phone = phone.startsWith('+') ? phone : `+${phone}`;
    state.step = 'completed';
    logger.add('phone', `Телефон: ${state.phone}`, userId);

    const newLead = db.createLead({
      clientName: state.clientName || 'Андрей',
      phone: state.phone,
      telegramUsername: state.username,
      telegramUserId: state.userId,
      goal: state.goal || 'Для путешествий',
      englishLevel: state.englishLevel || 'Начинающий',
      studyFormat: state.studyFormat || 'Индивидуально',
      frequency: state.frequency || '2 раза в неделю',
      status: 'Новый',
      comment: '',
      source: 'Telegram',
      deliveredToManager: !!process.env.MANAGER_TELEGRAM_ID,
    });

    logger.add('lead_created', `Создан лид ${newLead.id} для ${newLead.clientName}`, userId);

    replies.push({
      text: formatSuccessText(state),
      keyboardType: 'inline',
      keyboard: Keyboards.afterCompleted,
    });

    await notifyManager(newLead);
    return { state, botReplies: replies };
  }

  replies.push({
    text: `Чтобы начать, нажми кнопку ниже или введи /start`,
    keyboardType: 'inline',
    keyboard: Keyboards.mainMenu,
  });
  return { state, botReplies: replies };
}
