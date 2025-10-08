import { Router } from 'express';

import Aluno from '../models/Aluno.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import Agenda from '../models/Agenda.js';
import Usuario from '../models/Usuario.js';
import moment from 'moment';
import {
  getAgendamentoPorSemana,
  getAgendamentos,
  getCalendarAgenda,
  getPeriodoAgendamentos,
} from '../helpers.js';

const agendaRoutes = Router();

const horas = [
  '05:00',
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
];

agendaRoutes.get('/horarios/:professorId', authMiddleware, async (req, res) => {
  try {
    // const { data } = req.query;
    // const startOfDay = moment(data).startOf('day').toDate();
    // const endOfDay = moment(data).endOf('day').toDate();

    // const agenda = await Agenda.find({
    //   data: {
    //     $gte: startOfDay,
    //     $lt: endOfDay,
    //   },
    //   professor: req.params.professorId,
    // });

    // const horarios = horas.flatMap(hora => {
    //   const horaMais30 = moment(hora, 'HH:mm')
    //     .add(30, 'minutes')
    //     .format('HH:mm');
    //   const agendamentosHora = agenda.filter(i => i.hora === hora);
    //   const agendamentosHoraMais30 = agenda.filter(i => i.hora === horaMais30);

    //   const horariosDisponiveis = [];

    //   if (agendamentosHora.length < 4) {
    //     horariosDisponiveis.push({ label: hora, value: hora });
    //   }
    //   if (agendamentosHoraMais30.length < 4) {
    //     horariosDisponiveis.push({ label: horaMais30, value: horaMais30 });
    //   }

    //   return horariosDisponiveis;
    // });

    const horasComIncremento = horas.flatMap(hora => {
      const horaMoment = moment(hora, 'HH:mm');
      const horaMais30 = horaMoment.clone().add(30, 'minutes').format('HH:mm');
      return [hora, horaMais30];
    });

    res
      .status(200)
      .json(horasComIncremento.map(hora => ({ label: hora, value: hora })));
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// Criar Agendamento
agendaRoutes.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      aluno,
      professor,
      data,
      hora,
      cor,
      recorrente,
      tipo,
      observacao,
      semanaRecorrente,
      experimental,
      experimentalNome,
    } = req.body;

    const agenda = await Agenda.create({
      aluno,
      professor,
      data,
      hora,
      cor,
      recorrente,
      tipo,
      observacao,
      semanaRecorrente,
      experimental,
      experimentalNome,
      unidade: req.unidade_selecionada,
    });
    res.status(201).json(agenda);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

agendaRoutes.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      aluno,
      professor,
      data,
      hora,
      cor,
      recorrente,
      tipo,
      observacao,
      semanaRecorrente,
      experimental,
      experimentalNome,
    } = req.body;

    if (recorrente) {
      const agendamento = await Agenda.findById(id);

      if (agendamento) {
        const today = moment().startOf('day');
        const originalDate = moment(agendamento.data).startOf('day');
        const newDate = moment(data).startOf('day');

        // Só criar históricos se estiver movendo para uma data futura
        if (newDate.isAfter(originalDate)) {
          // Criar agendamentos históricos desde hoje até um dia antes da nova data
          let currentDate = today.clone(); // Começa de hoje
          const endDate = newDate.clone().subtract(1, 'day'); // Um dia antes da nova data

          // Iterar desde hoje até um dia antes da nova data
          while (currentDate.isSameOrBefore(endDate)) {
            // Verificar se o dia da semana está presente em agendamento.semanaRecorrente
            if (
              agendamento.semanaRecorrente.includes(currentDate.day()) &&
              !agendamento.excluidoEm.some(date =>
                moment(date).isSame(currentDate, 'day')
              )
            ) {
              // Verificar se esta data está em faltouEm
              const faltouNaData = agendamento.faltouEm.some(date =>
                moment(date).isSame(currentDate, 'day')
              );

              // Verificar se esta data está em gerarComissaoFaltaEm
              const gerarComissaoNaData = agendamento.gerarComissaoFaltaEm.some(
                date => moment(date).isSame(currentDate, 'day')
              );

              // Criar novo agendamento com recorrente = false e isHistorico = false
              console.log(
                'Criando agendamento histórico para:',
                currentDate.format('DD/MM/YYYY'),
                'dia da semana:',
                currentDate.day(),
                'faltou:',
                faltouNaData,
                'gerarComissao:',
                gerarComissaoNaData
              );

              const novoAgendamento = {
                aluno: agendamento.aluno,
                professor: agendamento.professor,
                data: currentDate.toDate(),
                hora: agendamento.hora,
                cor: agendamento.cor,
                recorrente: false,
                tipo: agendamento.tipo,
                observacao: agendamento.observacao,
                experimental: agendamento.experimental,
                experimentalNome: agendamento.experimentalNome,
                unidade: agendamento.unidade,
                isHistorico: false,
                faltou: faltouNaData,
                gerarComissaoFalta: gerarComissaoNaData,
              };

              // Se faltou na data, adicionar no faltouEm
              if (faltouNaData) {
                novoAgendamento.faltouEm = [currentDate.toDate()];
              }

              // Se gerou comissão na data, adicionar no gerarComissaoFaltaEm
              if (gerarComissaoNaData) {
                novoAgendamento.gerarComissaoFaltaEm = [currentDate.toDate()];
              }

              await Agenda.create(novoAgendamento);
            }
            currentDate.add(1, 'day');
          }
        }
      }
    }

    const agenda = await Agenda.findByIdAndUpdate(
      id,
      {
        aluno,
        professor,
        data,
        hora,
        cor,
        recorrente,
        tipo,
        observacao,
        semanaRecorrente,
        experimental,
        experimentalNome,
      },
      { new: true }
    );

    if (!agenda) {
      return res.status(404).send({ error: 'Agendamento não encontrado' });
    }

    res.status(200).json(agenda);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

agendaRoutes.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      data,
      professor,
      expediente = true,
      calendar = true,
      tipo,
      aluno,
      search,
    } = req.query;
    const startOfDay = moment(data).startOf('day').toDate();
    const endOfDay = moment(data).endOf('day').toDate();
    const currentWeek = moment(data).weekday();

    if (calendar === 'true') {
      const cal = await getCalendarAgenda({
        startOfDay,
        endOfDay,
        unidadeSelecionada: req.unidade_selecionada,
        professor,
        tipo,
        aluno,
        search,
      });

      return res.status(200).json(cal);
    }

    // if (professor) {
    //   const agendamentosPorSemana = await getAgendamentoPorSemana(
    //     horas,
    //     professor,
    //     req.unidade_selecionada,
    //     expediente === 'true',
    //     startOfDay,
    //     endOfDay
    //   );
    //   return res.status(200).json(agendamentosPorSemana);
    // }

    const professores = await Usuario.find(
      professor
        ? { _id: professor }
        : {
            unidades: { $in: [req.unidade_selecionada] },
            permissao: 3,
          }
    );

    const agenda = await getAgendamentos(
      startOfDay,
      endOfDay,
      currentWeek,
      req.unidade_selecionada
    );

    const response = professores.map(professor => ({
      professor: professor,
      agendamento: horas.map(hora => {
        const horaMais30 = moment(hora, 'HH:mm')
          .add(30, 'minutes')
          .format('HH:mm');
        return {
          periodo: hora,
          periodoAgendamentos: getPeriodoAgendamentos(
            agenda,
            professor,
            hora,
            horaMais30,
            expediente === 'true'
          ),
        };
      }),
    }));

    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: err.message });
  }
});

agendaRoutes.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { data } = req.query;
    const startOfDay = moment(data).startOf('day').toDate();
    const agenda = await Agenda.findById(req.params.id);
    if (!agenda) {
      return res.status(404).send({ error: 'Agendamento não encontrado' });
    }

    if (agenda.recorrente) {
      if (data == undefined) {
        await Agenda.findByIdAndDelete(req.params.id);
        return res.status(204).send();
      } else {
        agenda.excluidoEm.push(startOfDay);
        await agenda.save();
        return res.status(204).send();
      }
    }
    await Agenda.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

agendaRoutes.put('/falta/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, geraComissao } = req.query;
    const agenda = await Agenda.findById(id);

    console.log({
      geraComissao,
      type: typeof geraComissao,
    });

    const gera = geraComissao == 'true';

    if (!agenda) {
      return res.status(404).send({ error: 'Agendamento não encontrado' });
    }

    const startOfDay = moment(data).startOf('day').toDate();

    if (agenda.recorrente) {
      const index = agenda.faltouEm.findIndex(date =>
        moment(date).isSame(startOfDay, 'day')
      );

      if (index !== -1) {
        // Data já existe, remover
        agenda.faltouEm.splice(index, 1);
      } else {
        // Data não existe, adicionar
        agenda.faltouEm.push(startOfDay);
      }

      if (gera !== undefined && gera) {
        const index2 = agenda.gerarComissaoFaltaEm.findIndex(date =>
          moment(date).isSame(startOfDay, 'day')
        );
        if (index2 !== -1) {
          agenda.gerarComissaoFaltaEm.splice(index, 1);
        } else {
          agenda.gerarComissaoFaltaEm.push(startOfDay);
        }
      }
      await agenda.save();
      return res.status(204).send();
    }

    // Para agendamentos não recorrentes, alternar o campo faltou
    agenda.faltou = !agenda.faltou;
    if (gera !== undefined && gera) {
      agenda.gerarComissaoFalta = !agenda.gerarComissaoFalta;
    }
    await agenda.save();
    res.status(204).send();
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
});

agendaRoutes.put('/color/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { cor } = req.body;

    const agenda = await Agenda.findById(id);

    if (!agenda) {
      return res.status(404).send({ error: 'Agendamento não encontrado' });
    }

    agenda.cor = cor;
    await agenda.save();
    res.status(200).send(agenda);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
});

agendaRoutes.get('/fix', async (req, res) => {
  try {
    const recorrentesHistorico = await Agenda.find({
      isHistorico: true,
    });

    let returnData = {
      totalRecorrentes: recorrentesHistorico.length,
      totalRemovidos: 0,
      totalAtualizados: 0,
    };

    for (const ag of recorrentesHistorico) {
      if (moment(ag.data).isAfter(moment().local(), 'day')) {
        await Agenda.deleteOne({ _id: ag._id });
        returnData.totalRemovidos++;
      } else if (!moment(ag.createdAt).isSame(moment(ag.data), 'day')) {
        ag.data = ag.createdAt;
        await ag.save();
        returnData.totalAtualizados++;
      }
    }

    res.status(200).send(returnData);
  } catch (e) {
    console.log(e);
    res.status(400).send({ error: e.message });
  }
});

export default agendaRoutes;
