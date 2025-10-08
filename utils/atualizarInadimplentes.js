import moment from 'moment';
import Aluno from '../models/Aluno.js';

const atualizarInadimplentes = async () => {
  try {
    console.log('Executando cron job para verificar planos vencidos...');

    const now = moment().endOf('day').toDate();

    const result = await Aluno.updateMany(
      {
        plano_dataVencimento: { $lt: now },
        active: true, // Apenas alunos com status ativo
        isAplication: false, // Apenas alunos que não são aplicativos
      },
      {
        $set: { active: false },
      }
    );

    console.log(
      `Cron job concluída. ${result.modifiedCount} planos vencidos atualizados.`
    );
  } catch (err) {
    console.error('Erro ao executar cron job:', err);
  }
};

export default atualizarInadimplentes;
