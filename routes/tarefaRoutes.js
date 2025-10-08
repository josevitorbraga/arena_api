import { Router } from 'express';
import Tarefa from '../models/Tarefa.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import moment from 'moment';

const tarefaRoutes = Router();

tarefaRoutes.post('/', authMiddleware, async (req, res) => {
  try {
    const { descricao, data, recorrente, usuarios, semanaRecorrente } =
      req.body;

    const tarefa = await Tarefa.create({
      descricao,
      data,
      recorrente,
      usuarios,
      semanaRecorrente,
      criadoPor: req.usuario._id,
    });

    res.status(201).json(tarefa);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

tarefaRoutes.put('/edit/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao, data, recorrente, usuarios, semanaRecorrente } =
      req.body;

    const t = await Tarefa.findByIdAndUpdate(id, {
      descricao,
      data,
      recorrente,
      usuarios,
      semanaRecorrente,
    });

    return res.status(200).json(t);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

tarefaRoutes.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    await Tarefa.findByIdAndDelete(id);

    res.status(200).send();
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

tarefaRoutes.get('/', authMiddleware, async (req, res) => {
  try {
    const { data } = req.query;
    const startOfDay = moment(data).startOf('day').toDate();
    const endOfDay = moment(data).endOf('day').toDate();
    const currentWeek = moment(data).weekday();

    const tarefasDoDia = await Tarefa.find({
      data: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
      usuarios: { $in: [req.usuario._id] },
    }).populate('usuarios completaPor');
    const tarefasDoDiaIds = tarefasDoDia.map(tarefa => tarefa._id);

    const tarefasRecorrentes = await Tarefa.find({
      recorrente: true,
      semanaRecorrente: { $in: [currentWeek] },
      usuarios: { $in: [req.usuario._id] },
      _id: { $nin: tarefasDoDiaIds },
    }).populate('usuarios completaPor');

    //MINHAS TAREFAS Criadas
    const minhasTarefasCriadasRecorrentes = await Tarefa.find({
      criadoPor: req.usuario._id,
      recorrente: true,
    }).populate('usuarios completaPor');

    const tarefasComPercentual = minhasTarefasCriadasRecorrentes.map(tarefa => {
      const totalUsuarios = tarefa.usuarios.length;
      const usuariosCompletaram = tarefa.completaPor.filter(usuario => {
        return moment(usuario.completedAt).isSame(data, 'day');
      });

      const percentualConclusao =
        (usuariosCompletaram.length / totalUsuarios) * 100;

      return {
        ...tarefa._doc,
        formated_date: moment(tarefa.data).format('DD/MM/YYYY'),
        completou: usuariosCompletaram,
        percentualConclusao: percentualConclusao.toFixed(0), // Formatar para 2 casas decimais
      };
    });

    const minhasTarefasCriadaDoDia = await Tarefa.find({
      criadoPor: req.usuario._id,
      recorrente: false,
      data: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    }).populate('usuarios completaPor');

    const diaComPercentual = minhasTarefasCriadaDoDia.map(tarefa => {
      const totalUsuarios = tarefa.usuarios.length;
      const usuariosCompletaram = tarefa.completaPor.filter(usuario => {
        return moment(usuario.completedAt).isSame(data, 'day');
      });

      const percentualConclusao =
        (usuariosCompletaram.length / totalUsuarios) * 100;

      return {
        ...tarefa._doc,
        formated_date: moment(tarefa.data).format('DD/MM/YYYY'),
        completou: usuariosCompletaram,
        percentualConclusao: percentualConclusao.toFixed(0), // Formatar para 2 casas decimais
      };
    });

    const todasMinhasTarefasCriadas = {
      recorrentes: tarefasComPercentual,
      doDia: diaComPercentual,
    };

    const tarefas = [...tarefasDoDia, ...tarefasRecorrentes];

    let response = {
      pendente: [],
      concluido: [],
    };

    tarefas.forEach(tarefa => {
      const tarefaCompleta = tarefa.completaPor.find(
        item =>
          item.user.toString() === req.usuario._id.toString() &&
          moment(item.completedAt).isSame(data, 'day')
      );

      if (tarefaCompleta) {
        response.concluido.push({
          ...tarefa._doc,
          status: 'concluido',
          formated_date: moment(tarefa.data).format('DD/MM/YYYY'),
        });
      } else {
        response.pendente.push({
          ...tarefa._doc,
          status: 'pendente',
          formated_date: moment(tarefa.data).format('DD/MM/YYYY'),
        });
      }
    });

    res.status(200).json({
      minhasTarefas: response,
      tarefasCriadas: todasMinhasTarefasCriadas,
    });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

tarefaRoutes.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    await Tarefa.findByIdAndUpdate(
      id,
      {
        $push: {
          completaPor: {
            user: req.usuario._id,
            completedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    res.status(200).send();
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

export default tarefaRoutes;
