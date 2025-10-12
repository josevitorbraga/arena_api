import moment from 'moment';
import Agenda from '../models/Agenda.js';
import ComissaoMes from '../models/ComissaoMes.js';
import Aluno from '../models/Aluno.js';

const distribuirComissoesMes = async () => {
  try {
    console.log('Executando cron job para distribuir comissões...');

    const startOfMonth = moment().local().startOf('month');
    const now = moment().local().endOf('day');
    let dayIterator = moment().local().startOf('month');

    while (dayIterator.isBetween(startOfMonth, now, null, '[]')) {
      dayIterator = dayIterator.startOf('day');
      const startOfDay = dayIterator.toDate();
      const currentWeek = dayIterator.weekday();

      const agendamentosDoDia = await Agenda.find({
        data: {
          $gte: startOfDay,
          $lt: dayIterator.endOf('day').toDate(),
        },
        recorrente: false,
        faltou: false,
      }).populate('professor aluno');

      console.log('agendamentosDoDia', agendamentosDoDia.length);

      const faltasComComissao = await Agenda.find({
        data: {
          $gte: startOfDay,
          $lt: dayIterator.endOf('day').toDate(),
        },
        recorrente: false,
        faltou: true,
        gerarComissaoFalta: true,
      }).populate('professor aluno');

      console.log('faltasComComissao', faltasComComissao.length);

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
        data: { $lte: dayIterator.toDate() },
      }).populate('professor aluno');

      console.log('agendamentosRecorrentes', agendamentosRecorrentes.length);

      const faltasComComissaoRecorrentes = await Agenda.find({
        recorrente: true,
        semanaRecorrente: { $in: [currentWeek] },
        excluidoEm: { $not: { $elemMatch: { $eq: startOfDay } } },
        _id: { $nin: [...agendaDoDiaIds, ...faltasComComissaoIds] }, // Excluir ambos os arrays
        faltouEm: { $elemMatch: { $eq: startOfDay } },
        gerarComissaoFaltaEm: { $elemMatch: { $eq: startOfDay } },
        data: { $lte: dayIterator.toDate() },
      }).populate('professor aluno');

      console.log(
        'faltasComComissaoRecorrentes',
        faltasComComissaoRecorrentes.length
      );

      const agendamentos = [
        ...agendamentosDoDia,
        ...agendamentosRecorrentes,
        ...faltasComComissao,
        ...faltasComComissaoRecorrentes,
      ];

      // Calcular e salvar comissões
      for (const agendamento of agendamentos) {
        if (agendamento.aluno && agendamento.aluno.plano_valor > 0) {
          // Funcionalidade de comissão de venda aplicativo removida

          const comissao = new ComissaoMes({
            user: agendamento.professor._id,
            valor: agendamento.professor.valorAula,
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
      console.log(
        `Comissões do dia ${dayIterator.format('DD/MM/YYYY')} incluidas`
      );
      console.log('\n\n------------------------------------\n\n');
      dayIterator.add(1, 'day');
    }

    console.log('Cron job concluída.');
  } catch (err) {
    console.error('Erro ao executar cron job:', err);
  }
};

// Função removida - agora a comissão é o valor integral da aula

export default distribuirComissoesMes;
