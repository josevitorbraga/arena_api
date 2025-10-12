import { Router } from 'express';

import Aluno from '../models/Aluno.js';
import Agenda from '../models/Agenda.js';
import FinanceiroEntrada from '../models/FinanceiroEntrada.js';
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
      email,
      nomeAgenda,
      plano_desc,
      plano_valor,
      plano_dataVencimento,
      plano_tipo,
      isAplication,
      endereco,
    } = req.body;

    if (isAplication) {
      const aluno = await Aluno.create({
        nome,
        cpf,
        dataNascimento,
        telefone,
        email,
        nomeAgenda,
        plano_desc,
        plano_valor,
        plano_dataVencimento,
        plano_tipo: 'avulso', // Clientes de aplicação sempre são avulsos
        isAplication,
        active: true,
        unidade: req.unidade_selecionada,
        endereco,
      });
      return res.status(201).json(aluno);
    }

    const aluno = await Aluno.create({
      nome,
      cpf,
      dataNascimento,
      telefone,
      email,
      nomeAgenda,
      plano_desc,
      plano_valor,
      plano_dataVencimento,
      plano_tipo: plano_tipo || 'mensal', // Default para mensal se não especificado
      unidade: req.unidade_selecionada,
      active: moment(plano_dataVencimento).isAfter(moment()),
      endereco,
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
      query.active = true; // Filtrar apenas alunos com pagamento em dia
    }

    if (req.query.search) {
      const search = req.query.search;
      query.$and = [
        {
          $or: [
            { nome: { $regex: search, $options: 'i' } },
            { nomeAgenda: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
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
    });

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
      email,
      nomeAgenda,
      plano_desc,
      plano_valor,
      plano_tipo,
      isAplication,
      plano_dataVencimento,
      active,
      changedActive,
      endereco,
    } = req.body;

    if (isAplication) {
      const aluno = await Aluno.findByIdAndUpdate(
        req.params.id,
        {
          nome,
          cpf,
          dataNascimento,
          telefone,
          email,
          nomeAgenda,
          plano_desc,
          plano_valor,
          plano_tipo: 'avulso', // Clientes de aplicação sempre são avulsos
          isAplication,
          plano_dataVencimento,
          active: true,
          endereco,
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
        email,
        nomeAgenda,
        plano_desc,
        plano_valor,
        plano_tipo: plano_tipo || 'mensal', // Default para mensal se não especificado
        plano_dataVencimento,
        isAplication,
        endereco,
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

// Rota para renovação manual de planos
alunosRoutes.post('/:alunoId/renovar', authMiddleware, async (req, res) => {
  try {
    const { novoTipo, novoValor } = req.body;
    const aluno = await Aluno.findById(req.params.alunoId);

    if (!aluno) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    if (aluno.plano_tipo === 'avulso') {
      return res
        .status(400)
        .json({ error: 'Planos avulsos não podem ser renovados' });
    }

    // Importar helpers dentro da rota para evitar problemas de import
    const { calcularProximaRenovacao, obterDescricaoPlano } = await import(
      '../helpers.js'
    );

    // Usar novo tipo se fornecido, senão manter o atual
    const tipoPlano = novoTipo || aluno.plano_tipo;
    const valorPlano = novoValor || aluno.plano_valor;

    // Calcular nova data de vencimento
    const novaDataVencimento = calcularProximaRenovacao(
      aluno.plano_dataVencimento || new Date(),
      tipoPlano
    );

    // Atualizar dados do aluno
    const alunoAtualizado = await Aluno.findByIdAndUpdate(
      req.params.alunoId,
      {
        plano_tipo: tipoPlano,
        plano_valor: valorPlano,
        plano_dataVencimento: novaDataVencimento,
        active: true,
      },
      { new: true }
    );

    // Criar entrada financeira
    await FinanceiroEntrada.create({
      data: new Date(),
      aluno: aluno._id,
      valor: valorPlano,
      formaPagamento: 'Renovação Manual',
      tipo: 'Mensalidade',
      observacao: `Renovação manual - ${obterDescricaoPlano(
        tipoPlano,
        valorPlano
      )}`,
      unidade: aluno.unidade,
    });

    res.status(200).json({
      message: 'Plano renovado com sucesso',
      aluno: alunoAtualizado,
      novaDataVencimento,
    });
  } catch (err) {
    console.error('Erro ao renovar plano:', err);
    res.status(400).json({ error: err.message });
  }
});

// Rota para executar manualmente o processo de inadimplentes (para testes)
alunosRoutes.post(
  '/executar/inadimplentes',
  authMiddleware,
  async (req, res) => {
    try {
      const atualizarInadimplentes = await import(
        '../utils/atualizarInadimplentes.js'
      );
      const resultado = await atualizarInadimplentes.default();

      res.status(200).json({
        message: 'Processo de inadimplentes executado com sucesso',
        timestamp: moment().format('DD/MM/YYYY HH:mm:ss'),
      });
    } catch (err) {
      res.status(500).json({
        error: 'Erro ao executar processo de inadimplentes',
        details: err.message,
      });
    }
  }
);

// Rota de teste para verificar lógica de inadimplentes
alunosRoutes.get('/test/inadimplentes', authMiddleware, async (req, res) => {
  try {
    const now = moment().endOf('day').toDate();

    // Alunos com planos vencidos mas ainda ativos
    const alunosVencidos = await Aluno.find({
      plano_dataVencimento: { $lt: now },
      active: true,
      isAplication: false,
      plano_tipo: { $ne: 'avulso' },
      canceladoEm: null,
      unidade: { $in: req.unidade_selecionada },
    }).select('nome plano_dataVencimento plano_tipo active');

    // Alunos inadimplentes (já marcados como inativos)
    const alunosInadimplentes = await Aluno.find({
      active: false,
      canceladoEm: null,
      unidade: { $in: req.unidade_selecionada },
    }).select('nome plano_dataVencimento plano_tipo active');

    res.status(200).json({
      message: 'Teste de lógica de inadimplentes',
      dataAtual: moment().format('DD/MM/YYYY HH:mm'),
      alunosVencidosAindaAtivos: alunosVencidos.length,
      alunosJaInadimplentes: alunosInadimplentes.length,
      detalhes: {
        vencidos: alunosVencidos.map(a => ({
          nome: a.nome,
          vencimento: moment(a.plano_dataVencimento).format('DD/MM/YYYY'),
          tipo: a.plano_tipo,
          active: a.active,
        })),
        inadimplentes: alunosInadimplentes.map(a => ({
          nome: a.nome,
          vencimento: moment(a.plano_dataVencimento).format('DD/MM/YYYY'),
          tipo: a.plano_tipo,
          active: a.active,
        })),
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default alunosRoutes;
