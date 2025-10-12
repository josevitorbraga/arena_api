import { Router } from 'express';
import bcrypt from 'bcrypt';
import Usuario from '../models/Usuario.js';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middlewares/authMiddleware.js';
import permissionMiddleware from '../middlewares/permissionMiddleware.js';

const usuarioRoutes = Router();

usuarioRoutes.get('/', authMiddleware, async (req, res) => {
  try {
    const query = {
      unidades: { $in: [req.unidade_selecionada] },
    };

    if (req.query.search) {
      const search = req.query.search;
      query.$and = [
        { unidades: { $in: [req.unidade_selecionada] } },
        {
          $or: [
            { nome: { $regex: search, $options: 'i' } },
            { usuario: { $regex: search, $options: 'i' } },
          ],
        },
      ];
    }

    const usuarios = await Usuario.find(query);
    res.status(200).json(usuarios);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

usuarioRoutes.get('/:id', authMiddleware, async (req, res) => {
  try {
    const usuario = await Usuario.findOne({
      _id: req.params.id,
      unidades: { $in: [req.unidade_selecionada] },
    }).populate('unidades');
    res.status(200).json(usuario);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

usuarioRoutes.post('/', authMiddleware, async (req, res) => {
  try {
    const { nome, usuario, senha, permissao, valorAula, podeEditarAgenda } =
      req.body;

    await Usuario.create({
      nome,
      usuario,
      senha,
      permissao,
      unidades: [req.unidade_selecionada],
      valorAula,
      podeEditarAgenda,
    });

    res.status(201).json({
      message: 'Usuário criado com sucesso!',
    });
  } catch (err) {
    res.status(400).send({
      message: 'Erro ao criar usuário',
      error_id: err.code,
      error: err.message,
    });
  }
});

usuarioRoutes.put('/', authMiddleware, async (req, res) => {
  try {
    const {
      _id,
      nome,
      usuario,
      senha,
      permissao,
      valorAula,
      unidades,
      podeEditarAgenda,
    } = req.body;

    await Usuario.updateOne(
      {
        _id: _id,
      },
      {
        nome,
        usuario,
        senha,
        permissao,
        valorAula,
        unidades,
        podeEditarAgenda,
      }
    );

    res.status(200).json({
      message: 'Usuário atualizado com sucesso!',
    });
  } catch (err) {
    res.status(400).send({
      message: 'Erro ao atualizar usuário',
      error_id: err.code,
      error: err.message,
    });
  }
});

usuarioRoutes.post('/login', async (req, res) => {
  const { usuario, senha, unidade_id } = req.body;

  try {
    const user = await Usuario.findOne({ usuario }).populate({
      path: 'unidades',
      select: '_id nome',
      transform: doc => ({ id: doc._id, label: doc.nome }),
    });

    const unidadesArray = user.unidades.map(i => String(i.id));
    const unidadeSelecionada = user.unidades.find(
      i => String(i.id) === unidade_id
    );

    if (!user) {
      return res.status(400).json({ message: 'Usuario ou senha incorretos' });
    }

    const isInUnidade = unidadesArray.includes(unidade_id);
    if (!isInUnidade) {
      return res
        .status(400)
        .json({ message: 'Usuário não pertence à unidade' });
    }

    const isMatch = await bcrypt.compare(senha, user.senha);
    if (!isMatch) {
      return res.status(400).json({ message: 'Usuario ou senha incorretos' });
    }

    const userWithoutPassword = { ...user._doc };
    delete userWithoutPassword.senha;

    const token = jwt.sign(
      {
        ...userWithoutPassword,
        unidade_selecionada: userWithoutPassword.unidades.find(
          i => i.id === unidade_id
        ),
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login bem-sucedido',
      token,
      user,
      unidade_selecionada: unidadeSelecionada,
      teste: 'OK',
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor', error: err.message });
  }
});

usuarioRoutes.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Usuario.deleteOne({ _id: req.params.id });
    res.status(200).json({
      message: 'Usuário deletado com sucesso!',
    });
  } catch (err) {
    res.status(400).send({
      message: 'Erro ao deletar usuário',
      error_id: err.code,
      error: err.message,
    });
  }
});

export default usuarioRoutes;
