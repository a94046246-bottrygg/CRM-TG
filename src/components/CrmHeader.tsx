import React from 'react';
import { Bot, CheckCircle2, AlertCircle, ShieldCheck, Database, Send, Radio } from 'lucide-react';
import { BotStatusResponse } from '../types';

interface CrmHeaderProps {
  status: BotStatusResponse | null;
  onOpenSimulator: () => void;
}

export const CrmHeader: React.FC<CrmHeaderProps> = ({ status, onOpenSimulator }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs font-bold text-base tracking-tight">
            EE
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                Easy English
              </span>
              <span className="bg-slate-100 text-slate-700 text-[10.5px] font-bold px-2 py-0.5 rounded-md border border-slate-200 uppercase tracking-wider">
                CRM v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Система приёма и обработки заявок</p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs">
          {/* Backend & DB Status */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] font-medium">SQLite/JSON DB: Активна</span>
          </div>

          {/* Telegram Engine Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
            <Radio className={`w-3.5 h-3.5 ${status?.botConfigured ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-[11px] font-medium hidden sm:inline">
              {status?.botConfigured
                ? `Telegram Bot: ${status.botUsername ? `@${status.botUsername}` : 'Онлайн'}`
                : 'Telegram Bot: Режим симулятора'}
            </span>
            <span className="text-[11px] font-medium sm:hidden">
              {status?.botConfigured ? 'Бот: Онлайн' : 'Симулятор'}
            </span>
          </div>

          {/* Test Bot Button */}
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl font-bold transition-colors"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Тест Telegram-анкеты</span>
            <span className="sm:hidden">Тест</span>
          </button>
        </div>
      </div>
    </header>
  );
};
