import moment from 'moment';
import Agenda from '../models/Agenda.js';
import Comissao from '../models/Comissao.js';
import Aluno from '../models/Aluno.js';

const distribuirComissoes = async () => {
  try {
    console.log('Executando cron job para distribuir comissões...');

    const now = moment().local().endOf('day').toDate();
    const startOfDay = moment().local().startOf('day').toDate();
    const currentWeek = moment().local().weekday();

    const agendamentosDoDia = await Agenda.find({
      data: {
        $gte: startOfDay,
        $lt: now,
      },
      recorrente: false,
      faltou: false,
    }).populate('professor aluno');

    const faltasComComissao = await Agenda.find({
      data: {
        $gte: startOfDay,
        $lt: now,
      },
      recorrente: false,
      faltou: true,
      gerarComissaoFalta: true,
    }).populate('professor aluno');

    const agendaDoDiaIds = agendamentosDoDia.map(
      agendamento => agendamento._id
    );
    const faltasComComissaoIds = faltasComComissao.map(
      agendamento => agendamento._id
    );

    const agendamentosRecorrentes = await Agenda.find({
      recorrente: true,
      semanaRecorrente: { $in: [currentWeek] },
      excluidoEm: { $not: { $elemMatch: { $eq: startOfDay } } },
      _id: { $nin: agendaDoDiaIds },
      faltouEm: { $not: { $elemMatch: { $eq: startOfDay } } },
    }).populate('professor aluno');

    const faltasComComissaoRecorrentes = await Agenda.find({
      recorrente: true,
      semanaRecorrente: { $in: [currentWeek] },
      excluidoEm: { $not: { $elemMatch: { $eq: startOfDay } } },
      _id: { $nin: faltasComComissaoIds },
      faltouEm: { $elemMatch: { $eq: startOfDay } },
      gerarComissaoFaltaEm: { $elemMatch: { $eq: startOfDay } },
    }).populate('professor aluno');

    const agendamentos = [
      ...agendamentosDoDia,
      ...agendamentosRecorrentes,
      ...faltasComComissao,
      ...faltasComComissaoRecorrentes,
    ];

    // Calcular e salvar comissões
    for (const agendamento of agendamentos) {
      if (agendamento.aluno && agendamento.aluno.plano_valor > 0) {
        if (
          agendamento.aluno.isAplication &&
          moment().isBefore(moment(agendamento.aluno.plano_dataVencimento))
        ) {
          const aluno = await Aluno.findById(agendamento.aluno._id).populate(
            'vendaRealizadaPor'
          );

          const comissaoRecepcao = new Comissao({
            user: aluno.vendaRealizadaPor._id,
            valor: calcularComissao(
              agendamento.aluno.plano_valor,
              aluno.vendaRealizadaPor.percentualComissao
            ),
            data: startOfDay,
            tipo: 'Comissão de venda aplicativo',
            hora: agendamento.hora,
            agendamento: agendamento._id,
            unidade: agendamento.unidade,
            aluno: agendamento.aluno._id,
          });

          await comissaoRecepcao.save();
        }

        const comissao = new Comissao({
          user: agendamento.professor._id,
          valor: calcularComissao(
            agendamento.aluno.plano_valor,
            agendamento.professor.percentualComissao,
            agendamento.aluno.aulasDoPlano || 1
          ),
          data: startOfDay,
          tipo: 'Comissão de aula dada',
          hora: agendamento.hora,
          agendamento: agendamento._id,
          unidade: agendamento.unidade,
          aluno: agendamento.aluno._id,
        });

        await comissao.save();
      }
    }

    console.log('Cron job concluída.');
  } catch (err) {
    console.error('Erro ao executar cron job:', err);
  }
};

// Função para calcular o valor da comissão recebe valor e percentual e retorna o valor calculado
const calcularComissao = (
  valorPlano,
  percentualProfessor,
  quantidadeAulas = 1
) => {
  return ((valorPlano / quantidadeAulas) * percentualProfessor) / 100;
};

export default distribuirComissoes;
