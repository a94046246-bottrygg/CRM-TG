import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus } from '../types';
import {
  User,
  Phone,
  Send,
  Target,
  BookOpen,
  Layout,
  Clock,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

interface LeadDetailsCardProps {
  lead: Lead | null;
  onUpdateLead: (id: string, updates: { status?: LeadStatus; comment?: string }) => Promise<void>;
  loading?: boolean;
}

const statusOptions: { value: LeadStatus; label: string; badgeClass: string }[] = [
  { value: 'Новый', label: 'Новый', badgeClass: 'bg-slate-100 text-slate-700 border-slate-300' },
  { value: 'В работе', label: 'В работе', badgeClass: 'bg-amber-50 text-amber-800 border-amber-300' },
  { value: 'Связались', label: 'Связались', badgeClass: 'bg-blue-50 text-blue-800 border-blue-300' },
  { value: 'Пробный урок', label: 'Пробный урок', badgeClass: 'bg-purple-50 text-purple-800 border-purple-300' },
  { value: 'Успешно', label: 'Успешно', badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  { value: 'Отказ', label: 'Отказ', badgeClass: 'bg-rose-50 text-rose-800 border-rose-300' },
];

export const LeadDetailsCard: React.FC<LeadDetailsCardProps> = ({ lead, onUpdateLead, loading }) => {
  const [commentText, setCommentText] = useState('');
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Sync comment when selected lead changes
  useEffect(() => {
    if (lead) {
      setCommentText(lead.comment || '');
      setSaveSuccess(false);
    }
  }, [lead?.id]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!lead) return;
    const newStatus = e.target.value as LeadStatus;
    await onUpdateLead(lead.id, { status: newStatus });
  };

  const handleSaveComment = async () => {
    if (!lead) return;
    setIsSavingComment(true);
    try {
      await onUpdateLead(lead.id, { comment: commentText });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleCopyPhone = () => {
    if (!lead?.phone) return;
    navigator.clipboard.writeText(lead.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  if (!lead) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center min-h-[480px]">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
          <User className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-700 mb-1">Информация о лиде</h3>
        <p className="text-xs text-slate-400 max-w-[220px]">
          Выберите лида из списка справа, чтобы просмотреть подробности, изменить статус или добавить комментарий.
        </p>
      </div>
    );
  }

  const currentStatusObj = statusOptions.find((s) => s.value === lead.status) || statusOptions[0];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 text-slate-800">
      {/* Header section */}
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Информация о лиде
          </span>
          <span className={`text-[10.5px] px-2.5 py-0.5 rounded-full font-bold border ${currentStatusObj.badgeClass}`}>
            {lead.status}
          </span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 leading-tight">
          {lead.clientName}
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-mono font-semibold text-slate-700">{lead.phone}</span>
          <button
            onClick={handleCopyPhone}
            className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
            title="Скопировать телефон"
          >
            {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main attributes */}
      <div className="space-y-3 text-xs">
        {/* Telegram Details */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Send className="w-3 h-3 text-blue-500" /> Telegram
            </span>
            <span className="font-semibold text-blue-600">
              {lead.telegramUsername ? `@${lead.telegramUsername}` : 'Не указан'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Telegram ID:</span>
            <span className="font-mono">{lead.telegramUserId}</span>
          </div>
        </div>

        {/* Survey Answers */}
        <div className="space-y-2 pt-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-500 flex items-center gap-1.5 shrink-0 font-medium">
              <Target className="w-3.5 h-3.5 text-slate-400" /> Цель:
            </span>
            <span className="font-bold text-slate-800 text-right">{lead.goal}</span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-500 flex items-center gap-1.5 shrink-0 font-medium">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Уровень:
            </span>
            <span className="font-bold text-slate-800 text-right">{lead.englishLevel}</span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-500 flex items-center gap-1.5 shrink-0 font-medium">
              <Layout className="w-3.5 h-3.5 text-slate-400" /> Формат:
            </span>
            <span className="font-bold text-slate-800 text-right">{lead.studyFormat}</span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-500 flex items-center gap-1.5 shrink-0 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Частота:
            </span>
            <span className="font-bold text-slate-800 text-right">{lead.frequency}</span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-500 flex items-center gap-1.5 shrink-0 font-medium">
              Источник:
            </span>
            <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
              {lead.source}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2 text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Создан:
            </span>
            <span className="text-slate-600 font-mono">
              {new Date(lead.createdAt).toLocaleDateString('ru-RU')} {new Date(lead.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Status selector */}
      <div className="pt-2 border-t border-slate-100 space-y-1.5">
        <label className="block text-xs font-bold text-slate-700">Статус заявки</label>
        <select
          value={lead.status}
          onChange={handleStatusChange}
          disabled={loading}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Comment Section */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700">Комментарий менеджера</label>
          {saveSuccess && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 animate-fadeIn">
              <CheckCircle2 className="w-3 h-3" /> Сохранено
            </span>
          )}
        </div>
        <textarea
          rows={3}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Например: Позвонил. Клиенту удобнее после 18:00."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors resize-none leading-relaxed"
        />
        <button
          onClick={handleSaveComment}
          disabled={isSavingComment || loading}
          className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl py-2 px-3 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSavingComment ? 'Сохранение...' : 'Сохранить комментарий'}</span>
        </button>
      </div>
    </div>
  );
};
