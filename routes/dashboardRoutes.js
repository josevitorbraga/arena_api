import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import Aluno from '../models/Aluno.js';
import Entradas from '../models/FinanceiroEntrada.js';
import Saidas from '../models/FinanceiroSaida.js';
import Comissao from '../models/Comissao.js';
import {
  formatMonthYear,
  getStartAndEndOfYear,
  getStartAndEndOfMonth,
  calculateMonthlyTotals,
  calculateCurrentMonthTotal,
  countActiveInactive,
  calculateCommissionsByUser,
  countAulas,
} from '../helpers.js';

const dashboardRoutes = Router();

dashboardRoutes.get('/', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = getStartAndEndOfYear();
    const { currentMonthStart, currentMonthEnd } = getStartAndEndOfMonth();

    const entradas = await Entradas.find({
      unidade: req.unidade_selecionada,
      data: { $gte: startDate, $lte: endDate },
    });

    const saidas = await Saidas.find({
      unidade: req.unidade_selecionada,
      data: { $gte: startDate, $lte: endDate },
    });

    const comissoes = await Comissao.find({
      unidade: req.unidade_selecionada,
      data: { $gte: startDate, $lte: endDate },
    }).populate('user');

    const entradasOutro = await Entradas.find({
      unidade: req.unidade_selecionada,
      tipo: { $not: { $in: ['Mensalidade'] } },
      data: { $gte: startDate, $lte: endDate },
    });

    const entradasMap = calculateMonthlyTotals(entradas, formatMonthYear);
    const saidasMap = calculateMonthlyTotals(saidas, formatMonthYear);

    const allMonths = new Set([...entradasMap.keys(), ...saidasMap.keys()]);
    const sortedMonths = Array.from(allMonths).sort((a, b) => {
      const [monthA, yearA] = a.split('-');
      const [monthB, yearB] = b.split('-');
      return (
        new Date(`${yearA}-${monthA}-01`) - new Date(`${yearB}-${monthB}-01`)
      );
    });

    const entradasData = sortedMonths.map(month => entradasMap.get(month) || 0);
    const saidasData = sortedMonths.map(month => saidasMap.get(month) || 0);

    const currentMonthEntradas = calculateCurrentMonthTotal(
      entradas,
      currentMonthStart,
      currentMonthEnd
    );
    const currentMonthSaidas = calculateCurrentMonthTotal(
      saidas,
      currentMonthStart,
      currentMonthEnd
    );

    const entradasSemMensalidade = calculateCurrentMonthTotal(
      entradasOutro,
      currentMonthStart,
      currentMonthEnd
    );

    const alunos = await Aluno.find({ unidade: req.unidade_selecionada });
    const {
      activeCount,
      inactiveCount,
      entradasEsseMes,
      saidasEsseMes,
      saidasMesAll,
      entradasMesAll,
    } = countActiveInactive(alunos);

    const comissoesData = calculateCommissionsByUser(comissoes);
    const comissoesSemVenda = calculateCommissionsByUser(
      comissoes.filter(i => i.tipo !== 'Comissão de venda')
    );
    const aulasCount = countAulas(comissoesSemVenda);
    const aReceber = alunos
      .filter(a => !a.active && !a.canceladoEm)
      .reduce((acc, aluno) => {
        return acc + aluno.plano_valor;
      }, 0);

    const recebido = alunos
      .filter(a => a.active && !a.canceladoEm && !a.isAplication)
      .reduce((acc, aluno) => {
        return acc + aluno.plano_valor;
      }, 0);

    const total = alunos
      .filter(a => !a.canceladoEm && !a.isAplication)
      .reduce((acc, aluno) => {
        return acc + aluno.plano_valor;
      }, 0);

    const faturamento = entradasSemMensalidade + total;

    res.status(200).json({
      active: activeCount,
      inactive: inactiveCount,
      entradasMes: currentMonthEntradas,
      saidasMes: currentMonthSaidas,
      alunosNovosEsseMes: entradasEsseMes,
      inativadosEsseMes: saidasEsseMes,
      aReceber: faturamento - currentMonthEntradas,
      recebido: currentMonthEntradas,
      total_faturamento: faturamento,
      alunosInativadosDetail: saidasMesAll,
      novosEsseMesDetail: entradasMesAll,
      entradaSaidaChart: {
        dataset: [
          {
            name: 'Recebimentos',
            data: entradasData,
          },
          {
            name: 'Despesas',
            data: saidasData,
          },
        ],
        labels: sortedMonths,
      },
      comissoesChart: {
        name: 'Comissão',
        data: comissoesData,
      },
      comissoesCountChart: aulasCount,
    });
  } catch (err) {
    console.log(err);
    console.log('------------------------------------');
    res.status(400).send({ error: err.message });
  }
});

export default dashboardRoutes;
