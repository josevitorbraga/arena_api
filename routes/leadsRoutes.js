import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import Leads from '../models/Leads.js';

const leadsRoutes = Router();

leadsRoutes.post('/', authMiddleware, async (req, res) => {
  try {
    const { nome, cpf, dataNascimento, telefone, email, nomeAgenda } = req.body;

    const aluno = await Leads.create({
      nome,
      cpf,
      dataNascimento,
      telefone,
      email,
      nomeAgenda,
      unidade: req.unidade_selecionada,
    });
    res.status(201).json(aluno);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

leadsRoutes.get('/', authMiddleware, async (req, res) => {
  try {
    const query = {
      unidade: { $in: req.unidade_selecionada },
    };

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

    const alunos = await Leads.find(query);
    res.status(200).json(alunos);
  } catch (err) {
    console.error(err);
    res.status(400).send({ error: err.message });
  }
});

leadsRoutes.get('/:id', authMiddleware, async (req, res) => {
  try {
    const aluno = await Leads.findOne({
      _id: req.params.id,
      unidade: req.unidade_selecionada,
    }).populate({
      path: 'registroDeContatos',
      populate: {
        path: 'user',
      },
    });

    res.status(200).json({ aluno });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

leadsRoutes.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { nome, cpf, dataNascimento, telefone, email, nomeAgenda } = req.body;

    const aluno = await Leads.findByIdAndUpdate(
      req.params.id,
      {
        nome,
        cpf,
        dataNascimento,
        telefone,
        email,
        nomeAgenda,
      },
      { new: true }
    );

    res.status(200).json(aluno);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

leadsRoutes.post('/:id/contato', authMiddleware, async (req, res) => {
  try {
    const { data, user, observacao } = req.body;
    const contato = {
      data,
      user,
      observacao,
    };

    const aluno = await Leads.findByIdAndUpdate(
      req.params.id,
      {
        $push: { registroDeContatos: contato },
      },
      { new: true }
    );

    res.status(200).json(aluno);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

leadsRoutes.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Leads.findByIdAndDelete(req.params.id);

    res.status(200).send();
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

export default leadsRoutes;
