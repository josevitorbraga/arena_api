import moment from 'moment';
import Agenda from './models/Agenda.js';
import Usuario from './models/Usuario.js';
import Aluno from './models/Aluno.js';

export const formatMonthYear = date => {
  const months = [
    'JAN',
    'FEV',
    'MAR',
    'ABR',
    'MAI',
    'JUN',
    'JUL',
    'AGO',
    'SET',
    'OUT',
    'NOV',
    'DEZ',
  ];
  return `${months[date.getMonth()]}-${date.getFullYear()}`;
};

export const getStartAndEndOfYear = () => {
  const startDate = moment().startOf('month').toDate();
  const endDate = moment().endOf('month').toDate();
  return { startDate, endDate };
};

export const getStartAndEndOfMonth = () => {
  const currentMonthStart = moment().startOf('month').toDate();
  const currentMonthEnd = moment().endOf('month').toDate();
  return { currentMonthStart, currentMonthEnd };
};

export const calculateMonthlyTotals = (entries, formatMonthYear) => {
  const map = new Map();
  entries.forEach(entry => {
    const monthYear = formatMonthYear(entry.data);
    if (!map.has(monthYear)) {
      map.set(monthYear, 0);
    }
    map.set(monthYear, map.get(monthYear) + entry.valor);
  });
  return map;
};

export const calculateCurrentMonthTotal = (
  entries,
  currentMonthStart,
  currentMonthEnd
) => {
  return entries
    .filter(
      entry => entry.data >= currentMonthStart && entry.data <= currentMonthEnd
    )
    .reduce((sum, entry) => sum + entry.valor, 0);
};

export const countActiveInactive = alunos => {
  const activeCount = alunos.filter(aluno => !aluno.canceladoEm).length;
  const inactiveCount = alunos.filter(aluno => !!aluno.canceladoEm).length;
  const entradasMesAll = alunos.filter(aluno =>
    moment(aluno.createdAt).isSame(moment(), 'month')
  );
  const entradasEsseMes = entradasMesAll.length;
  const saidasMesAll = alunos.filter(
    aluno =>
      aluno.canceladoEm && moment(aluno.canceladoEm).isSame(moment(), 'month')
  );
  const saidasEsseMes = saidasMesAll.length;

  return {
    activeCount,
    inactiveCount,
    entradasEsseMes,
    saidasEsseMes,
    saidasMesAll,
    entradasMesAll,
  };
};

export const calculateCommissionsByUser = comissoes => {
  const userMap = new Map();
  comissoes.forEach(comissao => {
    const userName = comissao.user?.nome || 'Usuário apagado';
    if (!userMap.has(userName)) {
      userMap.set(userName, { total: 0, count: 0 });
    }
    const userData = userMap.get(userName);
    userData.total += comissao.valor;
    userData.count += 1;
    userMap.set(userName, userData);
  });

  return Array.from(userMap.entries()).map(([userName, data]) => ({
    x: userName,
    y: data.total,
    count: data.count,
  }));
};

export const countAulas = comissaoChart => {
  let labels = [];
  let values = [];

  comissaoChart.forEach(com => {
    labels.push(com.x);
    values.push(com.count);
  });

  return { labels, values };
};

export const getAgendamentos = async (
  startOfDay,
  endOfDay,
  currentWeek,
  unidadeSelecionada
) => {
  let agendaRecorrente = [];
  let agendaDoDia = [];

  if (
    moment(startOfDay).isSame(moment(), 'day') ||
    moment(startOfDay).isAfter(moment(), 'day')
  ) {
    agendaDoDia = await Agenda.find({
      data: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
      recorrente: false,
      isHistorico: false,
    }).populate('professor aluno');

    const agendaDoDiaIds = agendaDoDia.map(agendamento => agendamento._id);

    agendaRecorrente = await Agenda.find({
      recorrente: true,
      unidade: unidadeSelecionada,
      semanaRecorrente: { $in: [currentWeek] },
      _id: { $nin: agendaDoDiaIds },
      excluidoEm: { $not: { $elemMatch: { $eq: startOfDay } } },
    }).populate('professor aluno');
  } else {
    agendaDoDia = await Agenda.find({
      data: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
      recorrente: false,
    }).populate('professor aluno');
  }

  return [
    ...agendaDoDia.map(agendamento => ({
      ...agendamento.toObject(),
      faltouNoDia: agendamento.faltou,
      faltouComComissao: agendamento.gerarComissaoFalta,
      agendado: true,
    })),
    ...agendaRecorrente.map(agendamento => ({
      ...agendamento.toObject(),
      faltouNoDia: agendamento.faltouEm.some(date =>
        moment(date).isSame(startOfDay, 'day')
      ),
      faltouComComissao: agendamento.gerarComissaoFaltaEm.some(date =>
        moment(date).isSame(startOfDay, 'day')
      ),
      agendado: true,
    })),
  ];
};

export const isHoraInExpediente = (hora, expediente) => {
  if (!Array.isArray(expediente)) {
    return false;
  }
  return expediente.some(({ horaInicio, horaFim }) => {
    return moment(hora, 'HH:mm').isBetween(
      moment(horaInicio, 'HH:mm'),
      moment(horaFim, 'HH:mm'),
      null,
      '[)'
    );
  });
};

export const createEmptyAgendamento = (hora, count, expediente, hide) => ({
  hora,
  agendado: false,
  count,
  hide: hide ? !isHoraInExpediente(hora, expediente) : false,
});

export const getPeriodoAgendamentos = (
  agenda,
  professor,
  hora,
  horaMais30,
  hide
) => {
  const agendamentosHora = agenda.filter(
    i =>
      i.professor._id.toString() === professor._id.toString() && i.hora === hora
  );
  const agendamentosHoraMais30 = agenda.filter(
    i =>
      i.professor._id.toString() === professor._id.toString() &&
      i.hora === horaMais30
  );

  const mapAgendamentos = (agendamentos, hora) =>
    agendamentos.slice(0, 4).map(agendamento => ({
      ...agendamento,
      count: agendamentos.length === 1 ? 2 : agendamentos.length,
    }));

  return [
    ...mapAgendamentos(agendamentosHora, hora),
    ...Array(Math.max(0, 2 - agendamentosHora.length)).fill(
      createEmptyAgendamento(hora, 2, professor.expediente, hide)
    ),
    ...mapAgendamentos(agendamentosHoraMais30, horaMais30),
    ...Array(Math.max(0, 2 - agendamentosHoraMais30.length)).fill(
      createEmptyAgendamento(horaMais30, 2, professor.expediente, hide)
    ),
  ];
};

export const getAgendamentoPorSemana = async (
  horas,
  professorId,
  unidadeSelecionada,
  expediente,
  startOfDay,
  endOfDay
) => {
  const startOfMonth = moment(startOfDay).startOf('month');
  const endOfMonth = moment(endOfDay).endOf('month');
  const diasDoMes = Array.from({ length: endOfMonth.date() }, (_, i) =>
    moment(startOfMonth).add(i, 'days')
  );

  const professorData = await Usuario.findById(professorId);
  const agendamentosPorMes = await Promise.all(
    diasDoMes.map(async dia => {
      const startOfDay = dia.startOf('day').toDate();
      const endOfDay = dia.endOf('day').toDate();
      const currentWeek = dia.weekday();
      const agenda = await getAgendamentos(
        startOfDay,
        endOfDay,
        currentWeek,
        unidadeSelecionada
      );
      return {
        professor: `${
          dia.format('ddd').charAt(0).toUpperCase() + dia.format('ddd').slice(1)
        } - ${dia.format('DD')}`,
        agendamento: horas.map(hora => {
          const horaMais30 = moment(hora, 'HH:mm')
            .add(30, 'minutes')
            .format('HH:mm');
          return {
            periodo: hora,
            periodoAgendamentos: getPeriodoAgendamentos(
              agenda,
              professorData,
              hora,
              horaMais30,
              expediente
            ),
          };
        }),
      };
    })
  );
  return agendamentosPorMes;
};

const getContrastColor = hexColor => {
  // Remove o caractere '#' se estiver presente
  hexColor = hexColor.replace('#', '');

  // Converte a cor de hexadecimal para RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  // Calcula a luminância relativa
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Retorna 'black' para cores claras e 'white' para cores escuras
  return luminance > 0.5 ? 'black' : 'white';
};

const escapeRegExp = string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const getCalendarAgenda = async ({
  startOfDay,
  endOfDay,
  unidadeSelecionada,
  professor,
  tipo,
  aluno,
  search,
}) => {
  const monthStart = moment(startOfDay)
    .subtract(8, 'days')
    .startOf('month')
    .toDate();
  const monthEnd = moment(endOfDay).add(1, 'month').endOf('month').toDate();
  const today = moment();

  // Construir a query condicionalmente
  const queryRecorrente = {
    recorrente: true,
    isHistorico: false,
    unidade: unidadeSelecionada,
  };

  if (professor !== undefined) {
    queryRecorrente.professor = professor;
  }

  if (aluno !== undefined) {
    queryRecorrente.aluno = aluno;
  }

  if (tipo !== undefined) {
    queryRecorrente.tipo = tipo;
  }

  const agendaRecorrente = await Agenda.find(queryRecorrente)
    .populate('aluno')
    .populate('professor');

  const novasAgendas = [];

  const filteredAgendaRecorrente = agendaRecorrente.filter(i => {
    const alunoNome = i.aluno?.nome?.toLowerCase() || '';
    const nomeAgenda = i.aluno?.nomeAgenda?.toLowerCase() || '';
    return (
      alunoNome.includes(search.toLowerCase()) ||
      nomeAgenda.includes(search.toLowerCase())
    );
  });

  filteredAgendaRecorrente.forEach((item, index) => {
    let dataAtual = moment(item.data).startOf('day'); // Começa a partir da data de início do item

    while (dataAtual.isBefore(monthEnd)) {
      // Verifica se o dia da semana atual está no array semanaRecorrente
      // e se a data atual é igual ou posterior à data de início da aula recorrente

      if (
        item.semanaRecorrente.includes(dataAtual.day()) &&
        !item.excluidoEm.some(date =>
          moment(date).startOf('day').isSame(dataAtual, 'day')
        ) &&
        dataAtual.isSameOrAfter(today, 'day')
      ) {
        // Cria uma cópia do item original com a nova data
        const novaAgenda = {
          ...item.toObject(),
          id: `${item._id}-${index}-${dataAtual.format('YYYY-MM-DD')}`,
          data: dataAtual.local().toDate(),
          faltou: item.faltouEm.some(date => dataAtual.isSame(date, 'day')),
          gerarComissaoFalta: item.gerarComissaoFaltaEm.some(date =>
            dataAtual.isSame(date, 'day')
          ),
        };

        novasAgendas.push(novaAgenda);
      }

      dataAtual.add(1, 'day');
    }
  });

  const queryTotal = {
    data: {
      $gte: monthStart,
      $lt: monthEnd,
    },
    $or: [{ recorrente: false }, { isHistorico: true }],
    unidade: unidadeSelecionada,
  };

  if (professor !== undefined) {
    queryTotal.professor = professor;
  }

  if (aluno !== undefined) {
    queryTotal.aluno = aluno;
  }

  if (tipo !== undefined) {
    queryTotal.tipo = tipo;
  }

  const agendaTotal = await Agenda.find(queryTotal)
    .populate('professor')
    .populate('aluno');

  const filteredAgendaTotal = agendaTotal.filter(i => {
    const alunoNome = i.aluno?.nome?.toLowerCase() || '';
    const nomeAgenda = i.aluno?.nomeAgenda?.toLowerCase() || '';
    const experimentalNome = i.experimentalNome?.toLowerCase() || '';

    return (
      alunoNome.includes(search.toLowerCase()) ||
      nomeAgenda.includes(search.toLowerCase()) ||
      experimentalNome.includes(search.toLowerCase())
    );
  });

  return [...novasAgendas, ...filteredAgendaTotal.map(e => e.toObject())].map(
    ag => {
      let start = moment(ag.data)
        .set('hour', ag.hora.split(':')[0])
        .set('minute', ag.hora.split(':')[1]);

      let ret;

      if (ag.experimental) {
        ret = {
          ...ag,
          title: ag.faltou ? `${ag.experimentalNome}` : ag.experimentalNome,
          backgroundColor:
            ag.faltou && !ag.gerarComissaoFalta
              ? '#f44336'
              : ag.gerarComissaoFalta
              ? '#F58D21'
              : ag.cor,
          start: start.local().toDate(),
          textColor: getContrastColor(ag.faltou ? '#f44336' : ag.cor),
          end: start.add(30, 'minutes').local().toDate(),
        };
      } else {
        ret = {
          ...ag,
          title: ag.faltou
            ? `${ag.aluno?.nomeAgenda || ''}`
            : ag.aluno?.nomeAgenda || '',
          backgroundColor:
            ag.faltou && !ag.gerarComissaoFalta
              ? '#f44336'
              : ag.gerarComissaoFalta
              ? '#F58D21'
              : ag.cor,
          textColor: getContrastColor(ag.faltou ? '#f44336' : ag.cor),
          start: start.local().toDate(),
          end: start.add(30, 'minutes').local().toDate(),
        };
      }

      return ret;
    }
  );
};
