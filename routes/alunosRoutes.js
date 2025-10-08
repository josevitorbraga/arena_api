import { Router } from 'express';

import Aluno from '../models/Aluno.js';
import Agenda from '../models/Agenda.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import moment from 'moment';

const alunosRoutes = Router();

alunosRoutes.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      nome,
      cpf,
      dataNascimento,
      telefone,
      nomeAgenda,
      plano_desc,
      plano_valor,
      plano_dataVencimento,
      professorDesignado,
      vendaRealizadaPor,
      plano_avaliacaoValor,
      professorAvaliacao,
      isAplication,
      aulasDoPlano,
    } = req.body;

    if (isAplication) {
      const aluno = await Aluno.create({
        nome,
        cpf,
        dataNascimento,
        telefone,
        nomeAgenda,
        plano_desc,
        plano_valor,
        plano_dataVencimento,
        professorDesignado,
        vendaRealizadaPor,
        plano_avaliacaoValor,
        professorAvaliacao,
        isAplication,
        active: true,
        unidade: req.unidade_selecionada,
        aulasDoPlano: 1,
      });
      return res.status(201).json(aluno);
    }

    const aluno = await Aluno.create({
      nome,
      cpf,
      dataNascimento,
      telefone,
      nomeAgenda,
      plano_desc,
      plano_valor,
      plano_dataVencimento,
      professorDesignado,
      vendaRealizadaPor,
      plano_avaliacaoValor,
      professorAvaliacao,
      unidade: req.unidade_selecionada,
      aulasDoPlano,
      active: moment(plano_dataVencimento).isAfter(moment()),
    });
    return res.status(201).json(aluno);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

alunosRoutes.get('/', authMiddleware, async (req, res) => {
  try {
    const today = moment();
    const stats = await Aluno.find({
      unidade: req.unidade_selecionada,
    }).sort({ dataNascimento: -1 });

    const query = {
      unidade: { $in: req.unidade_selecionada },
    };

    if (req.query.activeOnly && req.query.activeOnly === 'true') {
      query.canceladoEm = null;
    }

    if (req.query.search) {
      const search = req.query.search;
      query.$and = [
        {
          $or: [
            { nome: { $regex: search, $options: 'i' } },
            { nomeAgenda: { $regex: search, $options: 'i' } },
          ],
        },
      ];
    }

    const alunos = await Aluno.find(query).sort({ nome: 1 });

    res.status(200).json({
      alunos,
      count: stats.length,
      aniversarios: stats.filter(
        i =>
          today.month() === moment(i.dataNascimento).month() &&
          i.canceladoEm === null
      ),
      inativos: stats.filter(i => i.active === false && !i.canceladoEm),
      ativos: stats.filter(i => i.canceladoEm === null).length,
    });
  } catch (err) {
    console.error(err);
    res.status(400).send({ error: err.message });
  }
});

alunosRoutes.get('/:id', authMiddleware, async (req, res) => {
  try {
    const aluno = await Aluno.findOne({
      _id: req.params.id,
      unidade: req.unidade_selecionada,
    }).populate('professorDesignado professorAvaliacao vendaRealizadaPor');

    const agendamentos = await Agenda.find({
      aluno: req.params.id,
      recorrente: true,
      unidade: req.unidade_selecionada,
    }).populate('professor unidade');

    res.status(200).json({ aluno, agendamentos });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

alunosRoutes.put('/:id', authMiddleware, async (req, res) => {
  try {
    const {
      nome,
      cpf,
      dataNascimento,
      telefone,
      nomeAgenda,
      plano_desc,
      plano_valor,
      professorDesignado,
      vendaRealizadaPor,
      plano_avaliacaoValor,
      professorAvaliacao,
      isAplication,
      plano_dataVencimento,
      aulasDoPlano,
      active,
      changedActive,
    } = req.body;

    if (isAplication) {
      const aluno = await Aluno.findByIdAndUpdate(
        req.params.id,
        {
          nome,
          cpf,
          dataNascimento,
          telefone,
          nomeAgenda,
          plano_desc,
          plano_valor,
          professorDesignado,
          vendaRealizadaPor,
          plano_avaliacaoValor,
          professorAvaliacao,
          isAplication,
          plano_dataVencimento,
          active: true,
          aulasDoPlano: 1,
        },
        { new: true }
      );

      return res.status(200).json(aluno);
    }
    const aluno = await Aluno.findByIdAndUpdate(
      req.params.id,
      {
        nome,
        cpf,
        dataNascimento,
        telefone,
        nomeAgenda,
        plano_desc,
        plano_valor,
        professorDesignado,
        vendaRealizadaPor,
        plano_avaliacaoValor,
        professorAvaliacao,
        plano_dataVencimento,
        isAplication,
        aulasDoPlano,
        active: changedActive
          ? active
          : moment(plano_dataVencimento).isAfter(moment()),
      },
      { new: true }
    );

    return res.status(200).json(aluno);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

alunosRoutes.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Agenda.deleteMany({ aluno: req.params.id });
    await Aluno.findByIdAndDelete(req.params.id);

    res.status(200).send();
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

alunosRoutes.delete('/delete/multiple', async (req, res) => {
  try {
    const { ids } = req.body;
    await Aluno.deleteMany({ _id: { $in: ids } });
    res.status(200).send('Alunos deletados com sucesso');
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

alunosRoutes.put('/:alunoId/cancelar', authMiddleware, async (req, res) => {
  try {
    const aluno = await Aluno.findById(req.params.alunoId);

    if (!aluno) {
      throw new Error('Aluno não encontrado');
    }

    if (!aluno.canceladoEm) {
      aluno.canceladoEm = new Date();
      await aluno.save();
      await Agenda.deleteMany({
        aluno: req.params.alunoId,
        isHistorico: false,
        data: { $gte: new Date() },
      });
      await Agenda.deleteMany({
        aluno: req.params.alunoId,
        recorrente: true,
      });
      return res.status(200).send();
    }

    aluno.canceladoEm = null;
    await aluno.save();
    return res.status(200).send();
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

export default alunosRoutes;
