import moment from 'moment';
import Aluno from '../models/Aluno.js';

const atualizarInadimplentes = async () => {
  try {
    console.log('Executando cron job para verificar planos vencidos...');

    const now = moment().endOf('day').toDate();

    // Buscar alunos que serão afetados para log detalhado
    const alunosVencidos = await Aluno.find({
      plano_dataVencimento: { $lt: now },
      active: true,
      isAplication: false,
      plano_tipo: { $ne: 'avulso' },
      canceladoEm: null,
    }).select('nome plano_dataVencimento plano_tipo');

    console.log(
      `Encontrados ${alunosVencidos.length} alunos com planos vencidos:`
    );
    alunosVencidos.forEach(aluno => {
      console.log(
        `- ${aluno.nome} (${aluno.plano_tipo}) - Vencido em: ${moment(
          aluno.plano_dataVencimento
        ).format('DD/MM/YYYY')}`
      );
    });

    const result = await Aluno.updateMany(
      {
        plano_dataVencimento: { $lt: now },
        active: true, // Apenas alunos com status ativo
        isAplication: false, // Apenas alunos que não são aplicativos
        plano_tipo: { $ne: 'avulso' }, // Excluir planos avulsos que não vencem
        canceladoEm: null, // Apenas alunos não cancelados
      },
      {
        $set: { active: false },
      }
    );

    console.log(
      `Cron job de inadimplentes concluída. ${result.modifiedCount} planos foram marcados como vencidos.`
    );
  } catch (err) {
    console.error('Erro ao executar cron job:', err);
  }
};

export default atualizarInadimplentes;
