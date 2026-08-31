import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus } from '../types';
import {
  Search,
  Filter,
  RefreshCw,
  User,
  Phone,
  Target,
  Clock,
  Sparkles,
  Bot,
  Plus,
  Calendar,
  Send,
} from 'lucide-react';

interface LeadsListProps {
  leads: Lead[];
  selectedLeadId: string | null;
  onSelectLead: (lead: Lead) => void;
  onRefresh: () => void;
  loading: boolean;
  onOpenSimulator: () => void;
  onOpenNewLeadModal: () => void;
}

const statusBadgeStyles: Record<LeadStatus, string> = {
  'Новый': 'bg-slate-100 text-slate-800 border-slate-300',
  'В работе': 'bg-amber-50 text-amber-900 border-amber-300 font-semibold',
  'Связались': 'bg-blue-50 text-blue-800 border-blue-300',
  'Пробный урок': 'bg-purple-50 text-purple-800 border-purple-300 font-semibold',
  'Успешно': 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold',
  'Отказ': 'bg-rose-50 text-rose-800 border-rose-300',
};

export const LeadsList: React.FC<LeadsListProps> = ({
  leads,
  selectedLeadId,
  onSelectLead,
  onRefresh,
  loading,
  onOpenSimulator,
  onOpenNewLeadModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Все');

  // Stats calculation
  const stats = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter((l) => l.status === 'Новый').length;
    const inProgress = leads.filter((l) => l.status === 'В работе').length;
    const trial = leads.filter((l) => l.status === 'Пробный урок').length;
    const success = leads.filter((l) => l.status === 'Успешно').length;
    return { total, newCount, inProgress, trial, success };
  }, [leads]);

  // Filtering
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Status filter
      if (statusFilter !== 'Все' && lead.status !== statusFilter) {
        return false;
      }
      // Search query (name, phone, username, goal)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = lead.clientName.toLowerCase().includes(q);
        const matchesPhone = lead.phone.toLowerCase().includes(q);
        const matchesUsername = lead.telegramUsername?.toLowerCase().includes(q) ?? false;
        const matchesGoal = lead.goal.toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesUsername || matchesGoal;
      }
      return true;
    });
  }, [leads, statusFilter, searchQuery]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-slate-900 flex flex-col min-h-[600px]">
      {/* Top Header & Fast KPI Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">CRM — Лиды</h1>
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-md border border-blue-200">
              Easy English
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Управление заявками студентов, статусы обучения и история взаимодействий
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Тест Telegram-бота</span>
          </button>

          <button
            onClick={onOpenNewLeadModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors border border-slate-300"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>Добавить лида</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={loading}
            title="Обновить список лидов"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors border border-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Counters Bar (Section 25 & 26 of ТЗ) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div
          onClick={() => setStatusFilter('Все')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'Все'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-75">Всего лидов</p>
          <p className="text-xl font-bold tracking-tight mt-0.5">{stats.total}</p>
        </div>

        <div
          onClick={() => setStatusFilter('Новый')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'Новый'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-blue-50/70 text-blue-900 border-blue-200 hover:bg-blue-100/60'
          }`}
        >
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">Новые лиды</p>
          <p className="text-xl font-bold tracking-tight mt-0.5">{stats.newCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter('В работе')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'В работе'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-amber-50/70 text-amber-900 border-amber-200 hover:bg-amber-100/60'
          }`}
        >
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">В работе</p>
          <p className="text-xl font-bold tracking-tight mt-0.5">{stats.inProgress}</p>
        </div>

        <div
          onClick={() => setStatusFilter('Пробный урок')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'Пробный урок'
              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
              : 'bg-purple-50/70 text-purple-900 border-purple-200 hover:bg-purple-100/60'
          }`}
        >
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">Пробный урок</p>
          <p className="text-xl font-bold tracking-tight mt-0.5">{stats.trial}</p>
        </div>

        <div
          onClick={() => setStatusFilter('Успешно')}
          className={`p-3 rounded-xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            statusFilter === 'Успешно'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:bg-emerald-100/60'
          }`}
        >
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">Успешно</p>
          <p className="text-xl font-bold tracking-tight mt-0.5">{stats.success}</p>
        </div>
      </div>

      {/* Toolbar: Search & Status Filter */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск лидов по имени, телефону, @username..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
          >
            <option value="Все">Все статусы ({leads.length})</option>
            <option value="Новый">Новый</option>
            <option value="В работе">В работе</option>
            <option value="Связались">Связались</option>
            <option value="Пробный урок">Пробный урок</option>
            <option value="Успешно">Успешно</option>
            <option value="Отказ">Отказ</option>
          </select>
        </div>
      </div>

      {/* Leads Table (Section 15 of ТЗ) */}
      <div className="flex-1 overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3.5">Имя</th>
              <th className="py-3 px-3.5">Телефон</th>
              <th className="py-3 px-3.5">Цель</th>
              <th className="py-3 px-3.5 hidden md:table-cell">Уровень / Формат</th>
              <th className="py-3 px-3.5">Статус</th>
              <th className="py-3 px-3.5 hidden lg:table-cell">Источник</th>
              <th className="py-3 px-3.5 text-right">Дата и время</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <User className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold">Лиды не найдены</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {searchQuery || statusFilter !== 'Все'
                      ? 'Попробуйте изменить параметры поиска или фильтрации'
                      : 'Создайте первого лида через Telegram-бота или кнопку выше'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => {
                const isSelected = lead.id === selectedLeadId;
                const formattedDate = new Date(lead.createdAt).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                });
                const formattedTime = new Date(lead.createdAt).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 hover:bg-blue-50 border-l-4 border-l-blue-600'
                        : 'hover:bg-slate-50/90'
                    }`}
                  >
                    {/* Name & Telegram */}
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{lead.clientName}</div>
                      {lead.telegramUsername && (
                        <div className="text-[11px] text-blue-600 font-medium">
                          @{lead.telegramUsername}
                        </div>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-3.5 font-mono text-slate-700 font-semibold whitespace-nowrap">
                      {lead.phone}
                    </td>

                    {/* Goal */}
                    <td className="py-3 px-3.5 text-slate-800 font-medium">
                      <span className="inline-block max-w-[140px] truncate" title={lead.goal}>
                        {lead.goal}
                      </span>
                    </td>

                    {/* Level / Format */}
                    <td className="py-3 px-3.5 text-slate-600 hidden md:table-cell">
                      <div className="truncate max-w-[150px]">
                        {lead.englishLevel} • {lead.studyFormat}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{lead.frequency}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] border ${
                          statusBadgeStyles[lead.status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="py-3 px-3.5 text-slate-500 text-[11px] hidden lg:table-cell whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-medium">
                        {lead.source}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3.5 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      <div>{formattedDate}</div>
                      <div className="text-[10px] text-slate-400">{formattedTime}</div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer summary */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span>
          Отображено: <strong className="text-slate-700">{filteredLeads.length}</strong> из {leads.length} лидов
        </span>
        <span>Автообновление каждые 5 сек</span>
      </div>
    </div>
  );
};
