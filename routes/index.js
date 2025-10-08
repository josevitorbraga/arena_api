import { Router } from 'express';

import unidadeRoutes from './unidadeRoutes.js';
import usuarioRoutes from './usuarioRoutes.js';
import planosRoutes from './planosRoutes.js';
import alunosRoutes from './alunosRoutes.js';
import agendaRoutes from './agendaRoutes.js';
import financeiroRoutes from './financeiroRoutes.js';
import tarefaRoutes from './tarefaRoutes.js';
import reportRoutes from './reportRoutes.js';
import Unidade from '../models/Unidade.js';
import Usuario from '../models/Usuario.js';
import leadsRoutes from './leadsRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import webhookRoutes from './webhookRoutes.js';
import { sendNotification } from '../notificationWebsocket.js';
import importRoutes from './importRoutes.js';
import seedDatabase from '../utils/seedDatabase.js';

const router = Router();

router.use('/api/unidades', unidadeRoutes);
router.use('/api/usuarios', usuarioRoutes);
router.use('/api/planos', planosRoutes);
router.use('/api/alunos', alunosRoutes);
router.use('/api/agenda', agendaRoutes);
router.use('/api/financeiro', financeiroRoutes);
router.use('/api/tarefas', tarefaRoutes);
router.use('/api/report', reportRoutes);
router.use('/api/leads', leadsRoutes);
router.use('/api/dashboard', dashboardRoutes);
router.use('/api/webhook', webhookRoutes);
router.use('/api/import', importRoutes);

// Endpoint de emergência para recriar dados iniciais
router.post('/api/initialize', async (req, res) => {
  try {
    // Verifica se já existem usuários
    const usuarioCount = await Usuario.countDocuments();

    if (usuarioCount > 0) {
      return res.status(400).json({
        message: 'Sistema já possui usuários. Inicialização não é necessária.',
        existingUsers: usuarioCount,
      });
    }

    await seedDatabase();

    res.status(200).json({
      message: 'Sistema inicializado com sucesso!',
      credentials: {
        usuario: 'admin',
        senha: 'admin123',
      },
      warning: 'IMPORTANTE: Altere essas credenciais após o primeiro login!',
    });
  } catch (error) {
    console.error('Erro na inicialização:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
    });
  }
});

router.post('/api/populate', async (req, res) => {
  try {
    sendNotification(
      'success',
      'WEBSOCJET ESTÀ FUNCIONANDO CORRETAMENTE',
      '19/10/2021 10:00'
    );
    sendNotification(
      'error',
      'WEBSOCJET ESTÀ FERRRR EA ASD ASDAsd',
      '19/10/2021 10:00'
    );
    sendNotification(
      'info',
      'WEBSOCJET ESTÀ asdagd INFOOOO',
      '19/10/2021 10:00'
    );
    return res.status(200).send({ message: 'Websocket disparado' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

export default router;
