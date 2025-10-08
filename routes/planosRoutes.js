import { Router } from 'express';

import Plano from '../models/Plano.js';

const planosRoutes = Router();

planosRoutes.post('/', async (req, res) => {
  try {
    const { nome, valorAula, quantidadeAulas } = req.body;
    const plano = await Plano.create({ nome, valorAula, quantidadeAulas });
    res.status(201).json(plano);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

export default planosRoutes;
