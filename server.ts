import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  initTelegramBot,
  getBotStatus,
  processSimulatorAction,
} from './src/server/bot';
import { db } from './src/server/db';
import { logger } from './src/server/logger';

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Health check endpoints (Section 28 of ТЗ)
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy' });
  });

  // 2. Leads REST API (Section 27 of ТЗ)

  // GET /api/leads - get all leads (sorted createdAt DESC)
  app.get('/api/leads', (req, res) => {
    try {
      const leads = db.getLeads();
      res.json(leads);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: errMsg });
    }
  });

  // GET /api/leads/:id - get single lead
  app.get('/api/leads/:id', (req, res) => {
    try {
      const lead = db.getLeadById(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      res.json(lead);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: errMsg });
    }
  });

  // POST /api/leads - create new lead
  app.post('/api/leads', (req, res) => {
    try {
      const {
        clientName,
        phone,
        telegramUsername,
        telegramUserId = 'manual_crm',
        goal = 'Для работы',
        englishLevel = 'Начинающий',
        studyFormat = 'Индивидуально',
        frequency = '2 раза в неделю',
        status = 'Новый',
        comment = '',
        source = 'CRM Web',
      } = req.body;

      if (!clientName || !phone) {
        return res.status(400).json({ error: 'clientName and phone are required' });
      }

      const newLead = db.createLead({
        clientName,
        phone,
        telegramUsername,
        telegramUserId,
        goal,
        englishLevel,
        studyFormat,
        frequency,
        status,
        comment,
        source,
      });

      logger.add('lead_created', `Создан лид ${newLead.id} через API (${newLead.clientName})`);
      res.status(201).json(newLead);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: errMsg });
    }
  });

  // PATCH /api/leads/:id - update status, comment
  app.patch('/api/leads/:id', (req, res) => {
    try {
      const { status, comment, deliveredToManager } = req.body;
      const updated = db.updateLead(req.params.id, {
        status,
        comment,
        deliveredToManager,
      });

      if (!updated) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      logger.info(`Лид ${updated.id} обновлен: статус="${updated.status}"`);
      res.json(updated);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: errMsg });
    }
  });

  // 3. Status API
  app.get('/api/status', (req, res) => {
    res.json(getBotStatus());
  });

  // 4. Live Simulator Action endpoint for instant testing
  app.post('/api/simulator/action', async (req, res) => {
    try {
      const { userId = 999999, actionType, payload = {} } = req.body;
      const result = await processSimulatorAction(userId, actionType, payload);
      res.json(result);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: errMsg });
    }
  });

  // 5. Initialize Telegram Bot backend engine
  const botResult = initTelegramBot();
  if (botResult.bot) {
    logger.info('Telegram Bot engine started successfully in polling mode.');
  } else {
    logger.error(`Telegram Bot not started: ${botResult.error || 'Check environment variables'}`);
  }

  // 6. Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Easy English CRM & Bot server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
