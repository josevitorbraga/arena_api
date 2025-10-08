import Agenda from '../models/Agenda.js';
import moment from 'moment';

const registrarAulasRecorrentes = async () => {
  try {
    const now = moment().format('DD/MM/YYYY HH:mm:ss');
    console.log(
      'Executando cron job para registrar aulas recorrentes... at: ',
      now
    );

    const startOfDay = moment().local().startOf('day').toDate();
    const currentWeek = moment().local().weekday();

    const agendaRecorrente = await Agenda.find({
      recorrente: true,
      semanaRecorrente: { $in: [currentWeek] },
      excluidoEm: { $not: { $elemMatch: { $eq: startOfDay } } },
      data: { $lte: startOfDay },
    });

    console.log('Aulas recorrentes:', agendaRecorrente.length);

    const errors = [];
    for (const agendamento of agendaRecorrente) {
      try {
        await Agenda.create({
          aluno: agendamento.aluno,
          professor: agendamento.professor,
          data: startOfDay,
          hora: agendamento.hora,
          cor: agendamento.cor,
          recorrente: false,
          tipo: agendamento.tipo,
          observacao: agendamento.observacao,
          unidade: agendamento.unidade,
          faltou: agendamento.faltouEm.some(date =>
            moment(date).isSame(startOfDay, 'day')
          ),
          gerarComissaoFalta: agendamento.gerarComissaoFaltaEm.some(date =>
            moment(date).isSame(startOfDay, 'day')
          ),
          isHistorico: true,
        });
      } catch (error) {
        errors.push({
          agendamento: agendamento._id,
          error: error.message,
        });
        console.error(
          `Erro ao criar agendamento ${agendamento._id}:`,
          error.message
        );
      }
    }

    if (errors.length > 0) {
      console.error('Erros encontrados durante o processamento:', errors);
    }

    console.log('Cron job concluída at: ', now);
    console.log(`Total processado: ${agendaRecorrente.length}`);
    console.log(`Sucessos: ${agendaRecorrente.length - errors.length}`);
    console.log(`Falhas: ${errors.length}`);
  } catch (err) {
    console.error('Erro ao executar cron job:', err);
  }
};

export default registrarAulasRecorrentes;
