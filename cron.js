import cron from 'node-cron';

import atualizarInadimplentes from './utils/atualizarInadimplentes.js';
import distribuirComissoes from './utils/distribComissoes.js';
import registrarAulasRecorrentes from './utils/registraAulasRecorrentes.js';
import distribuirComissoesMes from './utils/distribComissoesMes.js';
import renovarPlanos from './utils/renovarPlanos.js';
import moment from 'moment';

// Configurar a cron job para executar ao final do dia (23:40) e executar todas as tarefas automatizadas
cron.schedule('40 23 * * *', async () => {
  try {
    console.log('Iniciando execução das tarefas automatizadas...');

    // Renovar planos que estão próximos do vencimento
    await renovarPlanos();

    // Atualizar status dos planos vencidos
    await atualizarInadimplentes();

    // Distribuir comissões diárias
    await distribuirComissoes();

    // Registrar aulas recorrentes
    await registrarAulasRecorrentes();

    // Distribuir comissões mensais no último dia do mês
    const today = moment();
    const lastDayOfMonth = today.clone().endOf('month').date();
    if (today.date() === lastDayOfMonth) {
      console.log(
        'Último dia do mês - executando distribuição de comissões mensais...'
      );
      await distribuirComissoesMes();
    }

    console.log('Todas as tarefas automatizadas foram concluídas com sucesso.');
  } catch (err) {
    console.error('Erro ao executar cron job:', err);
  }
});
