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
        // Funcionalidade de comissão de venda aplicativo removida

        const comissao = new Comissao({
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

    console.log('Cron job concluída.');
  } catch (err) {
    console.error('Erro ao executar cron job:', err);
  }
};

// Função removida - agora a comissão é o valor integral da aula

export default distribuirComissoes;
