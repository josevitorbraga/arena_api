import cron from 'node-cron';

import atualizarInadimplentes from './utils/atualizarInadimplentes.js';
import distribuirComissoes from './utils/distribComissoes.js';
import registrarAulasRecorrentes from './utils/registraAulasRecorrentes.js';
import distribuirComissoesMes from './utils/distribComissoesMes.js';
import moment from 'moment';

// Configurar a cron job para executar ao final do dia (23:59) e atualizar o status dos planos vencidos
cron.schedule('40 23 * * *', async () => {
  try {
    atualizarInadimplentes();
    distribuirComissoes();
    registrarAulasRecorrentes();

    const today = moment();
    const lastDayOfMonth = today.clone().endOf('month').date();
    if (today.date() === lastDayOfMonth) {
      await distribuirComissoesMes();
    }
  } catch (err) {
    console.error('Erro ao executar cron job:', err);
  }
});
