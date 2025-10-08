import { Router } from 'express';

import Unidade from '../models/Unidade.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const unidadeRoutes = Router();

unidadeRoutes.post('/', async (req, res) => {
  try {
    const { nome, endereco, cidade } = req.body;
    const unidade = await Unidade.create({ nome, endereco, cidade });
    res.status(201).json(unidade);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

unidadeRoutes.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, endereco, cidade } = req.body;
    const unidade = await Unidade.findByIdAndUpdate(
      id,
      { nome, endereco, cidade },
      { new: true }
    );
    return res.json(unidade);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

unidadeRoutes.get('/', async (req, res) => {
  try {
    const unidades = await Unidade.find();
    res.json(unidades);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

export default unidadeRoutes;
