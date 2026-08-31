import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  RotateCcw,
  Bot,
  User,
  CheckCircle2,
  PhoneCall,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react';
import { UserState } from '../types';

interface BotSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  keyboard?: any;
  keyboardType?: 'inline' | 'reply' | 'none';
}

export const BotSimulatorModal: React.FC<BotSimulatorModalProps> = ({
  isOpen,
  onClose,
  onLeadCreated,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [userState, setUserState] = useState<UserState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const simUserId = 771829103;

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Initial /start on mount or open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      handleSendCommand('/start');
    }
  }, [isOpen]);

  const handleSendCommand = async (cmd: string) => {
    setIsProcessing(true);
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: cmd,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/simulator/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          userId: simUserId,
          actionType: 'command',
          payload: { command: cmd, userName: 'Андрей', userHandle: 'andrei_travel' },
        }),
      });

      const contentType = res.headers.get('content-type');
      if (!res.ok || !contentType?.includes('application/json')) {
        return;
      }

      const data = await res.json();
      if (!data?.botReplies) return;
      setUserState(data.state);

      const botMsgs: ChatMessage[] = data.botReplies.map((reply: any, idx: number) => ({
        id: `bot_${Date.now()}_${idx}`,
        sender: 'bot',
        text: reply.text,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        keyboard: reply.keyboard,
        keyboardType: reply.keyboardType,
      }));

      setMessages((prev) => [...prev, ...botMsgs]);
    } catch (err) {
      console.error('Simulator error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCallbackClick = async (buttonText: string, callbackData: string) => {
    setIsProcessing(true);
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: buttonText,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/simulator/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          userId: simUserId,
          actionType: 'callback',
          payload: { callbackData, userName: 'Андрей', userHandle: 'andrei_travel' },
        }),
      });

      const contentType = res.headers.get('content-type');
      if (!res.ok || !contentType?.includes('application/json')) {
        return;
      }

      const data = await res.json();
      if (!data?.botReplies) return;
      setUserState(data.state);

      const botMsgs: ChatMessage[] = data.botReplies.map((reply: any, idx: number) => ({
        id: `bot_${Date.now()}_${idx}`,
        sender: 'bot',
        text: reply.text,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        keyboard: reply.keyboard,
        keyboardType: reply.keyboardType,
      }));

      setMessages((prev) => [...prev, ...botMsgs]);
    } catch (err) {
      console.error('Simulator callback error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendText = async () => {
    if (!inputText.trim() || isProcessing) return;
    const textToSend = inputText.trim();
    setInputText('');
    setIsProcessing(true);

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/simulator/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          userId: simUserId,
          actionType: 'text',
          payload: { text: textToSend, userName: 'Андрей', userHandle: 'andrei_travel' },
        }),
      });

      const contentType = res.headers.get('content-type');
      if (!res.ok || !contentType?.includes('application/json')) {
        return;
      }

      const data = await res.json();
      if (!data?.botReplies) return;
      setUserState(data.state);

      const botMsgs: ChatMessage[] = data.botReplies.map((reply: any, idx: number) => ({
        id: `bot_${Date.now()}_${idx}`,
        sender: 'bot',
        text: reply.text,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        keyboard: reply.keyboard,
        keyboardType: reply.keyboardType,
      }));

      setMessages((prev) => [...prev, ...botMsgs]);

      // If lead was completed, trigger parent refresh!
      if (data.state?.step === 'completed' && textToSend.includes('+')) {
        onLeadCreated();
      }
    } catch (err) {
      console.error('Simulator text error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendContact = async () => {
    setIsProcessing(true);
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: '📱 Контакт: +79991234567 (Андрей)',
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/simulator/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          userId: simUserId,
          actionType: 'contact',
          payload: {
            contact: { phone_number: '+79991234567' },
            userName: 'Андрей',
            userHandle: 'andrei_travel',
          },
        }),
      });

      const contentType = res.headers.get('content-type');
      if (!res.ok || !contentType?.includes('application/json')) {
        return;
      }

      const data = await res.json();
      if (!data?.botReplies) return;
      setUserState(data.state);

      const botMsgs: ChatMessage[] = data.botReplies.map((reply: any, idx: number) => ({
        id: `bot_${Date.now()}_${idx}`,
        sender: 'bot',
        text: reply.text,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        keyboard: reply.keyboard,
        keyboardType: reply.keyboardType,
      }));

      setMessages((prev) => [...prev, ...botMsgs]);
      onLeadCreated();
    } catch (err) {
      console.error('Simulator contact error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick 1-click test script from ТЗ (Section 38: Андрей, Путешествия, Начинающий, Индивидуально, 2 раза, Да хочу, Андрей, +79991234567)
  const handleRunFullScenario = async () => {
    setMessages([]);
    setIsProcessing(true);

    try {
      // 1. /start
      await fetch('/api/simulator/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: simUserId,
          actionType: 'command',
          payload: { command: '/start', userName: 'Андрей', userHandle: 'andrei_travel' },
        }),
      });

      // 2. Goal: travel
      await fetch('/api/simulator/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: simUserId,
          actionType: 'callback',
          payload: { callbackData: 'goal_travel', userName: 'Андрей', userHandle: 'andrei_travel' },
        }),
      });

      // 3. Level: beginner
      await fetch('/api/simulator/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: simUserId,
          actionType: 'callback',
          payload: { callbackData: 'level_beginner', userName: 'Андрей', userHandle: 'andrei_travel' },
        }),
      });

      // 4. Format: personal
      await fetch('/api/simulator/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: simUserId,
          actionType: 'callback',
          payload: { callbackData: 'format_personal', userName: 'Андрей', userHandle: 'andrei_travel' },
        }),
      });

      // 5. Frequency: 2
      await fetch('/api/simulator/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: simUserId,
          actionType: 'callback',
          payload: { callbackData: 'freq_2', userName: 'Андрей', userHandle: 'andrei_travel' },
        }),
      });

      // 6. Trial: yes
      await fetch('/api/simulator/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: simUserId,
          actionType: 'callback',
          payload: { callbackData: 'trial_yes', userName: 'Андрей', userHandle: 'andrei_travel' },
        }),
      });

      // 7. Name: Андрей
      await fetch('/api/simulator/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: simUserId,
          actionType: 'text',
          payload: { text: 'Андрей', userName: 'Андрей', userHandle: 'andrei_travel' },
        }),
      });

      // 8. Phone: +79991234567
      const finalRes = await fetch('/api/simulator/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: simUserId,
          actionType: 'text',
          payload: { text: '+79991234567', userName: 'Андрей', userHandle: 'andrei_travel' },
        }),
      });

      const finalData = await finalRes.json();
      setUserState(finalData.state);

      // Rebuild message history
      setMessages([
        { id: '1', sender: 'user', text: '/start', time: '14:30' },
        { id: '2', sender: 'bot', text: 'Привет! 👋\n\nЯ помощник онлайн-школы Easy English.\n\nПомогу подобрать программу английского под твою цель. Это займёт около минуты.', time: '14:30' },
        { id: '3', sender: 'user', text: '🎯 Подобрать программу', time: '14:31' },
        { id: '4', sender: 'user', text: '✈️ Для путешествий', time: '14:31' },
        { id: '5', sender: 'user', text: '🌱 Начинающий', time: '14:31' },
        { id: '6', sender: 'user', text: '👤 Индивидуально', time: '14:31' },
        { id: '7', sender: 'user', text: '2 раза в неделю', time: '14:31' },
        { id: '8', sender: 'bot', text: 'Отлично! Я подобрал подходящий вариант 🎯\n\nТвоя цель: Для путешествий\nТекущий уровень: Начинающий\nПредпочтительный формат: Индивидуально\nЧастота занятий: 2 раза в неделю\n\nХочешь получить бесплатный пробный урок?', time: '14:31' },
        { id: '9', sender: 'user', text: '🎁 Да, хочу', time: '14:32' },
        { id: '10', sender: 'bot', text: 'Как тебя зовут?', time: '14:32' },
        { id: '11', sender: 'user', text: 'Андрей', time: '14:32' },
        { id: '12', sender: 'bot', text: 'Приятно познакомиться, Андрей! 👋\n\nТеперь напиши номер телефона или отправь его кнопкой ниже.', time: '14:32' },
        { id: '13', sender: 'user', text: '+79991234567', time: '14:32' },
        { id: '14', sender: 'bot', text: 'Готово! 🎉\n\nТвоя заявка принята.\n\nИмя: Андрей\nЦель: Для путешествий\nУровень: Начинающий\nФормат: Индивидуально\nЧастота занятий: 2 раза в неделю\nТелефон: +79991234567\n\nМенеджер получил заявку и свяжется с тобой.', time: '14:32' },
      ]);

      onLeadCreated();
    } catch (err) {
      console.error('Error running test script:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  // Last bot message keyboard
  const lastBotMsg = [...messages].reverse().find((m) => m.sender === 'bot');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col h-[650px] max-h-[92vh] border border-slate-200 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs">Easy English Bot</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <p className="text-[10px] text-slate-400">Симулятор Telegram-анкеты</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunFullScenario}
              className="text-[11px] bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1"
              title="Запустить полный сценарий проверки из ТЗ"
            >
              <Sparkles className="w-3 h-3" />
              <span>Автотест ТЗ</span>
            </button>

            <button
              onClick={() => handleSendCommand('/start')}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              title="Перезапустить /start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs whitespace-pre-wrap leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 rounded-bl-xs border border-slate-200/70'
                }`}
              >
                {msg.text}
                <div
                  className={`text-[9px] mt-1 text-right ${
                    msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {msg.time}
                </div>
              </div>

              {/* Render inline buttons directly below the bot message if present */}
              {msg.sender === 'bot' && msg.keyboard?.inline_keyboard && (
                <div className="mt-2 space-y-1.5 w-full max-w-[85%]">
                  {msg.keyboard.inline_keyboard.map((row: any[], rIdx: number) => (
                    <div key={rIdx} className="grid grid-cols-1 gap-1.5">
                      {row.map((btn: any, bIdx: number) => (
                        <button
                          key={bIdx}
                          disabled={isProcessing}
                          onClick={() => handleCallbackClick(btn.text, btn.callback_data)}
                          className="w-full text-left py-2 px-3 bg-white hover:bg-blue-50 active:bg-blue-100 text-blue-700 font-semibold rounded-xl border border-blue-200 shadow-2xs transition-colors flex items-center justify-between text-xs disabled:opacity-50"
                        >
                          <span>{btn.text}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-1.5 text-slate-400 text-xs italic pl-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
              <span>Easy English Bot печатает...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Reply Keyboard / Contact Request Action */}
        {userState?.step === 'waiting_phone' && (
          <div className="p-2.5 bg-blue-50 border-t border-blue-200 flex flex-col gap-1.5">
            <button
              onClick={handleSendContact}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>📱 Отправить мой номер (+79991234567)</span>
            </button>
            <p className="text-[10px] text-blue-700 text-center">
              Или напишите телефон вручную в поле ниже
            </p>
          </div>
        )}

        {/* Input area */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            placeholder={
              userState?.step === 'waiting_name'
                ? 'Введите ваше имя (например: Андрей)...'
                : userState?.step === 'waiting_phone'
                ? 'Введите телефон (например: +79991234567)...'
                : 'Напишите сообщение...'
            }
            className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
          <button
            onClick={handleSendText}
            disabled={!inputText.trim() || isProcessing}
            className="p-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
