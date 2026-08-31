import React, { useState, useEffect, useCallback } from 'react';
import { Lead, LeadStatus, BotStatusResponse } from './types';
import { CrmHeader } from './components/CrmHeader';
import { LeadDetailsCard } from './components/LeadDetailsCard';
import { LeadsList } from './components/LeadsList';
import { BotSimulatorModal } from './components/BotSimulatorModal';
import { NewLeadModal } from './components/NewLeadModal';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [status, setStatus] = useState<BotStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);

  // Fetch leads from backend
  const fetchLeads = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch('/api/leads', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Не удалось загрузить лиды');
      const data: Lead[] = await res.json();
      setLeads(data);

      // Default select first lead if none selected
      setSelectedLeadId((prev) => {
        if (!prev && data.length > 0) return data[0].id;
        if (prev && !data.some((l) => l.id === prev) && data.length > 0) return data[0].id;
        return prev;
      });
      setErrorMessage(null);
    } catch (err: unknown) {
      console.error('Error fetching leads:', err);
      if (!isBackground) {
        setErrorMessage(err instanceof Error ? err.message : 'Ошибка при загрузке лидов');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  // Fetch system status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data: BotStatusResponse = await res.json();
        setStatus(data);
      }
    } catch (err) {
      // Ignore background status errors
    }
  }, []);

  // Initial load and polling
  useEffect(() => {
    fetchLeads();
    fetchStatus();

    // Auto-polling every 6 seconds (Section 24 of ТЗ)
    const interval = setInterval(() => {
      fetchLeads(true);
      fetchStatus();
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchLeads, fetchStatus]);

  // Update lead (status / comment)
  const handleUpdateLead = async (
    id: string,
    updates: { status?: LeadStatus; comment?: string }
  ) => {
    setUpdating(true);
    try {
      // Optimistic update
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
      );

      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Не удалось сохранить изменения');
      const updatedLead: Lead = await res.json();

      setLeads((prev) =>
        prev.map((l) => (l.id === id ? updatedLead : l))
      );
    } catch (err: unknown) {
      console.error('Error updating lead:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Ошибка обновления лида');
      // Revert on error
      fetchLeads(true);
    } finally {
      setUpdating(false);
    }
  };

  // Create lead manually
  const handleCreateLead = async (leadData: {
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
  }) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(leadData),
      });

      if (!res.ok) throw new Error('Не удалось создать лида');
      const newLead: Lead = await res.json();

      setLeads((prev) => [newLead, ...prev]);
      setSelectedLeadId(newLead.id);
    } catch (err: unknown) {
      console.error('Error creating lead:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Ошибка создания лида');
    } finally {
      setUpdating(false);
    }
  };

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || null;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased">
      {/* Header */}
      <CrmHeader
        status={status}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
      />

      {/* Error alert if any */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-800 font-bold ml-4"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace (20% / 80% Layout - Section 14 of ТЗ) */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (~20-25%): Selected Lead Card */}
          <div className="lg:col-span-4 xl:col-span-3 sticky top-20">
            <LeadDetailsCard
              lead={selectedLead}
              onUpdateLead={handleUpdateLead}
              loading={updating}
            />
          </div>

          {/* Right Column (~75-80%): Leads CRM Main Table */}
          <div className="lg:col-span-8 xl:col-span-9">
            <LeadsList
              leads={leads}
              selectedLeadId={selectedLeadId}
              onSelectLead={(lead) => setSelectedLeadId(lead.id)}
              onRefresh={() => fetchLeads()}
              loading={loading}
              onOpenSimulator={() => setIsSimulatorOpen(true)}
              onOpenNewLeadModal={() => setIsNewLeadModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Telegram Bot Simulator Modal */}
      <BotSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onLeadCreated={() => {
          fetchLeads(true);
        }}
      />

      {/* Manual Lead Creation Modal */}
      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        onCreateLead={handleCreateLead}
      />
    </div>
  );
}

export default App;
