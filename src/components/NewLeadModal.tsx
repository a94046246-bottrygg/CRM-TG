import React, { useState } from 'react';
import { X, UserPlus, Phone, User, Target, BookOpen, Clock, Layout } from 'lucide-react';
import { LeadStatus } from '../types';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateLead: (leadData: {
    clientName: string;
    phone: string;
    telegramUsername?: string;
    goal: string;
    englishLevel: string;
    studyFormat: string;
    frequency: string;
    status: LeadStatus;
    comment: string;
    source: string;
  }) => Promise<void>;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({
  isOpen,
  onClose,
  onCreateLead,
}) => {
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [goal, setGoal] = useState('Для работы');
  const [englishLevel, setEnglishLevel] = useState('Начинающий');
  const [studyFormat, setStudyFormat] = useState('Индивидуально');
  const [frequency, setFrequency] = useState('2 раза в неделю');
  const [status, setStatus] = useState<LeadStatus>('Новый');
  const [comment, setComment] = useState('');
  const [source, setSource] = useState('Звонок менеджера');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateLead({
        clientName: clientName.trim(),
        phone: phone.trim(),
        telegramUsername: telegramUsername.trim().replace(/^@/, '') || undefined,
        goal,
        englishLevel,
        studyFormat,
        frequency,
        status,
        comment: comment.trim(),
        source,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn text-slate-800">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Добавить лида вручную</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Имя клиента <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Например: Андрей"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Телефон <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+79991234567"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Telegram Username (если есть)</label>
            <input
              type="text"
              value={telegramUsername}
              onChange={(e) => setTelegramUsername(e.target.value)}
              placeholder="@username"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Цель</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="Для работы">Для работы</option>
                <option value="Для путешествий">Для путешествий</option>
                <option value="Для учёбы">Для учёбы</option>
                <option value="Хочу свободно говорить">Хочу свободно говорить</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Уровень</label>
              <select
                value={englishLevel}
                onChange={(e) => setEnglishLevel(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="Начинающий">Начинающий</option>
                <option value="Базовый">Базовый</option>
                <option value="Средний">Средний</option>
                <option value="Продвинутый">Продвинутый</option>
                <option value="Не знаю">Не знаю</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Формат</label>
              <select
                value={studyFormat}
                onChange={(e) => setStudyFormat(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="Индивидуально">Индивидуально</option>
                <option value="В группе">В группе</option>
                <option value="Самостоятельно + AI">Самостоятельно + AI</option>
                <option value="Помогите выбрать">Помогите выбрать</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Частота</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="2 раза в неделю">2 раза в неделю</option>
                <option value="3 раза в неделю">3 раза в неделю</option>
                <option value="Каждый день">Каждый день</option>
                <option value="Пока не знаю">Пока не знаю</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Комментарий</label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Заметка менеджера..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !clientName.trim() || !phone.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Создание...' : 'Создать лида'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
