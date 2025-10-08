import { Router } from 'express';
import Entradas from '../models/FinanceiroEntrada.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import Aluno from '../models/Aluno.js';
import moment from 'moment';
import Comissao from '../models/Comissao.js';
import Saidas from '../models/FinanceiroSaida.js';

const financeiroRoutes = Router();

financeiroRoutes.get('/:alunoId', authMiddleware, async (req, res) => {
  try {
    const alunoId = req.params.alunoId;
    const response = await Entradas.find({ aluno: alunoId });
    res.status(200).json(response);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

financeiroRoutes.post('/', authMiddleware, async (req, res) => {
  try {
    const { aluno, valor, data, formaPagamento, tipo, observacao } = req.body;

    if (aluno) {
      const entradaExistente = await Entradas.findOne({ aluno });
      const alunoQs = await Aluno.findById(aluno).populate(
        'vendaRealizadaPor professorAvaliacao'
      );

      if (!entradaExistente) {
        const percentualProfessor =
          alunoQs.vendaRealizadaPor.percentualComissao;
        const valorComissao = (alunoQs.plano_valor * percentualProfessor) / 100;

        await Comissao.create({
          user: alunoQs.vendaRealizadaPor,
          valor: valorComissao,
          data: data,
          tipo: 'Comissão de venda',
          unidade: req.unidade_selecionada,
          aluno: alunoQs._id,
        });
      }

      if (tipo === 'Mensalidade') {
        await Entradas.create({
          aluno,
          valor: alunoQs.plano_valor,
          data,
          formaPagamento,
          tipo,
          observacao,
          unidade: req.unidade_selecionada,
        });

        const alunoQuery = await Aluno.findById(aluno);
        alunoQuery.plano_dataVencimento = moment(
          alunoQuery.plano_dataVencimento
        )
          .add(1, 'month')
          .toDate();
        alunoQuery.active = true;
        await alunoQuery.save();
      } else if (tipo === 'Avaliacao') {
        const percentual = alunoQs.professorAvaliacao.percentualComissao;
        const valorDescontado =
          (alunoQs.plano_avaliacaoValor * percentual) / 100;

        await Comissao.create({
          user: alunoQs.professorAvaliacao,
          valor: valorDescontado,
          data: data,
          tipo: 'Comissão de avaliação física',
          unidade: req.unidade_selecionada,
          aluno: alunoQs._id,
        });
        await Entradas.create({
          aluno,
          valor: alunoQs.plano_avaliacaoValor,
          data,
          formaPagamento,
          tipo,
          observacao,
          unidade: req.unidade_selecionada,
        });
      } else {
        await Entradas.create({
          aluno,
          valor,
          data,
          formaPagamento,
          tipo,
          observacao,
          unidade: req.unidade_selecionada,
        });
      }
    } else {
      await Entradas.create({
        valor,
        data,
        formaPagamento,
        tipo,
        observacao,
        unidade: req.unidade_selecionada,
      });
    }

    res.status(201).send();
  } catch (err) {
    res.status(400).send({ error: err.message });
    // console.log(err);
  }
});

financeiroRoutes.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { valor, data, formaPagamento, tipo, observacao } = req.body;
    const id = req.params.id;

    await Entradas.findByIdAndUpdate(id, {
      valor,
      data,
      formaPagamento,
      tipo,
      observacao,
    });

    res.status(200).send();
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

financeiroRoutes.post('/saida', authMiddleware, async (req, res) => {
  try {
    const { valor, data, formaPagamento, tipo, observacao } = req.body;

    await Saidas.create({
      valor,
      data,
      formaPagamento,
      tipo,
      observacao,
      unidade: req.unidade_selecionada,
    });

    res.status(201).send();
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

financeiroRoutes.get('/view/recebimento', authMiddleware, async (req, res) => {
  try {
    const { dataInicial, dataFinal, tipo, formaPagamento, search, aluno } =
      req.query;

    // Construir o objeto de consulta dinamicamente
    const query = { unidade: req.unidade_selecionada };

    if (dataInicial && dataFinal) {
      const startDate = new Date(dataInicial);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(dataFinal);
      endDate.setHours(23, 59, 59, 999);

      query.data = { $gte: startDate, $lte: endDate };
    } else if (dataInicial) {
      const startDate = new Date(dataInicial);
      startDate.setHours(0, 0, 0, 0);

      query.data = { $gte: startDate };
    } else if (dataFinal) {
      const endDate = new Date(dataFinal);
      endDate.setHours(23, 59, 59, 999);

      query.data = { $lte: endDate };
    }

    if (tipo) {
      query.tipo = tipo;
    }

    if (formaPagamento) {
      query.formaPagamento = formaPagamento;
    }

    if (search) {
      query.$or = [{ observacao: { $regex: search, $options: 'i' } }];
    }

    if (aluno) {
      query.aluno = aluno;
    }

    const response = await Entradas.find(query)
      .populate('aluno')
      .sort({ data: -1 });

    res.status(200).json(response);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

financeiroRoutes.get('/view/saidas', authMiddleware, async (req, res) => {
  try {
    const { dataInicial, dataFinal, tipo, formaPagamento, search } = req.query;

    // Construir o objeto de consulta dinamicamente
    const query = { unidade: req.unidade_selecionada };

    if (dataInicial && dataFinal) {
      const startDate = new Date(dataInicial);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(dataFinal);
      endDate.setHours(23, 59, 59, 999);

      query.data = { $gte: startDate, $lte: endDate };
    } else if (dataInicial) {
      const startDate = new Date(dataInicial);
      startDate.setHours(0, 0, 0, 0);

      query.data = { $gte: startDate };
    } else if (dataFinal) {
      const endDate = new Date(dataFinal);
      endDate.setHours(23, 59, 59, 999);

      query.data = { $lte: endDate };
    }

    if (tipo) {
      query.tipo = tipo;
    }

    if (formaPagamento) {
      query.formaPagamento = formaPagamento;
    }

    if (search) {
      query.$or = [{ observacao: { $regex: search, $options: 'i' } }];
    }

    const response = await Saidas.find(query).sort({ data: -1 });
    res.status(200).json(response);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

financeiroRoutes.delete(
  '/recebimento/:id',
  authMiddleware,
  async (req, res) => {
    try {
      const id = req.params.id;
      await Entradas.findByIdAndDelete(id);
      res.status(200).send();
    } catch (err) {
      res.status(400).send({ error: err.message });
    }
  }
);

financeiroRoutes.delete('/saida/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    await Saidas.findByIdAndDelete(id);
    res.status(200).send();
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

export default financeiroRoutes;
