import moment from 'moment';
import Aluno from '../models/Aluno.js';
import FinanceiroEntrada from '../models/FinanceiroEntrada.js';
import {
  calcularDataVencimento,
  calcularProximaRenovacao,
  obterDescricaoPlano,
} from '../helpers.js';

const renovarPlanos = async () => {
  try {
    console.log('Executando cron job para renovação automática de planos...');

    const hoje = moment().startOf('day');
    const proximosMeses = hoje.clone().add(3, 'days'); // Renovar planos que vencerão nos próximos 3 dias

    // Buscar alunos com planos que vencerão em breve
    const alunosParaRenovar = await Aluno.find({
      plano_dataVencimento: {
        $gte: hoje.toDate(),
        $lte: proximosMeses.toDate(),
      },
      active: true,
      canceladoEm: null,
      plano_tipo: { $in: ['mensal', 'trimestral', 'semestral', 'anual'] }, // Não renovar avulsos
    });

    console.log(
      `Encontrados ${alunosParaRenovar.length} planos para renovação automática.`
    );

    let renovados = 0;
    let falharam = 0;

    for (const aluno of alunosParaRenovar) {
      try {
        // Calcular nova data de vencimento
        const novaDataVencimento = calcularProximaRenovacao(
          aluno.plano_dataVencimento,
          aluno.plano_tipo
        );

        if (!novaDataVencimento) {
          console.log(`Plano avulso não renovado: ${aluno.nome}`);
          continue;
        }

        // Atualizar data de vencimento do aluno
        await Aluno.findByIdAndUpdate(aluno._id, {
          plano_dataVencimento: novaDataVencimento,
          active: true, // Garantir que o aluno permanece ativo
        });

        // Criar entrada financeira para a renovação
        await FinanceiroEntrada.create({
          data: moment().toDate(),
          aluno: aluno._id,
          valor: aluno.plano_valor,
          formaPagamento: 'Renovação Automática',
          tipo: 'Mensalidade',
          observacao: `Renovação automática - ${obterDescricaoPlano(
            aluno.plano_tipo,
            aluno.plano_valor
          )}`,
          unidade: aluno.unidade,
        });

        renovados++;
        console.log(
          `Plano renovado: ${aluno.nome} - Novo vencimento: ${moment(
            novaDataVencimento
          ).format('DD/MM/YYYY')}`
        );
      } catch (error) {
        falharam++;
        console.error(
          `Erro ao renovar plano do aluno ${aluno.nome}:`,
          error.message
        );
      }
    }

    console.log(
      `Renovação de planos concluída. ${renovados} renovados, ${falharam} falharam.`
    );

    return {
      renovados,
      falharam,
      total: alunosParaRenovar.length,
    };
  } catch (err) {
    console.error('Erro ao executar renovação de planos:', err);
    throw err;
  }
};

export default renovarPlanos;
