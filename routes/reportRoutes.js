import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import Entradas from '../models/FinanceiroEntrada.js';
import Comissao from '../models/Comissao.js';
import ExcelJS from 'exceljs';
import Saidas from '../models/FinanceiroSaida.js';
import Aluno from '../models/Aluno.js';
import ComissaoMes from '../models/ComissaoMes.js';

const reportRoutes = Router();

reportRoutes.get('/fechamento', authMiddleware, async (req, res) => {
  try {
    const { mes, ano, unidade } = req.query;
    const recebimento = await Entradas.find({
      $expr: {
        $and: [
          { $eq: [{ $month: '$data' }, mes] },
          { $eq: [{ $year: '$data' }, ano] },
        ],
      },
      unidade,
    }).populate('aluno unidade');

    const comissao = await Comissao.find({
      $expr: {
        $and: [
          { $eq: [{ $month: '$data' }, mes] },
          { $eq: [{ $year: '$data' }, ano] },
        ],
      },
      unidade,
    }).populate('aluno user unidade');

    const comissaomes = await ComissaoMes.find({
      $expr: {
        $and: [
          { $eq: [{ $month: '$data' }, mes] },
          { $eq: [{ $year: '$data' }, ano] },
        ],
      },
      unidade,
    }).populate('aluno user unidade');

    const despesas = await Saidas.find({
      $expr: {
        $and: [
          { $eq: [{ $month: '$data' }, mes] },
          { $eq: [{ $year: '$data' }, ano] },
        ],
      },
      unidade,
    }).populate('unidade');

    const alunos = await Aluno.find({ unidade });

    const workbook = new ExcelJS.Workbook();

    const worksheetRecebimento = workbook.addWorksheet('Recebimento');
    const worksheetComissao = workbook.addWorksheet('Comissão');
    const worksheetDespesas = workbook.addWorksheet('Despesas');
    const worksheetAlunos = workbook.addWorksheet('Alunos');
    const worksheetComissaoMes = workbook.addWorksheet('Comissão Consolidada');

    worksheetRecebimento.columns = [
      { header: 'Data', key: 'data', width: 20 },
      { header: 'Aluno', key: 'aluno', width: 30 },
      { header: 'Valor', key: 'valor', width: 10 },
      { header: 'Forma de Pagamento', key: 'formaPagamento', width: 20 },
      { header: 'Tipo', key: 'tipo', width: 20 },
      { header: 'Observação', key: 'observacao', width: 20 },
      { header: 'Unidade', key: 'unidade', width: 20 },
    ];

    worksheetComissao.columns = [
      { header: 'Data', key: 'data', width: 20 },
      { header: 'Professor / Recepcionista', key: 'user', width: 30 },
      { header: 'Aluno', key: 'aluno', width: 30 },
      { header: 'Valor', key: 'valor', width: 10 },
      { header: 'Tipo', key: 'tipo', width: 20 },
      { header: 'Unidade', key: 'unidade', width: 20 },
    ];

    worksheetComissaoMes.columns = [
      { header: 'Data', key: 'data', width: 20 },
      { header: 'Professor / Recepcionista', key: 'user', width: 30 },
      { header: 'Aluno', key: 'aluno', width: 30 },
      { header: 'Valor', key: 'valor', width: 10 },
      { header: 'Tipo', key: 'tipo', width: 20 },
      { header: 'Unidade', key: 'unidade', width: 20 },
    ];

    worksheetDespesas.columns = [
      { header: 'Data', key: 'data', width: 20 },
      { header: 'Valor', key: 'valor', width: 10 },
      { header: 'Forma de Pagamento', key: 'formaPagamento', width: 20 },
      { header: 'Tipo', key: 'tipo', width: 20 },
      { header: 'Observação', key: 'observacao', width: 20 },
      { header: 'Unidade', key: 'unidade', width: 20 },
    ];

    worksheetAlunos.columns = [
      { header: 'Nome', key: 'nome', width: 30 },
      { header: 'CPF', key: 'cpf', width: 20 },
      { header: 'Data de Nascimento', key: 'dataNascimento', width: 20 },
      { header: 'Telefone', key: 'telefone', width: 20 },
      { header: 'Plano', key: 'plano_desc', width: 20 },
      { header: 'Valor do Plano', key: 'plano_valor', width: 20 },
      { header: 'Data de Vencimento', key: 'plano_dataVencimento', width: 20 },
      { header: 'É Aplicativo', key: 'isAplication', width: 20 },
      { header: 'Inativado em', key: 'canceladoEm', width: 10 },
    ];

    recebimento.forEach(recebimento => {
      worksheetRecebimento.addRow({
        data: recebimento.data,
        aluno: recebimento.aluno?.nome,
        valor: recebimento.valor,
        formaPagamento: recebimento.formaPagamento,
        tipo: recebimento.tipo,
        observacao: recebimento.observacao,
        unidade: recebimento.unidade?.nome,
      });
    });

    comissao.forEach(comissao => {
      worksheetComissao.addRow({
        data: comissao.data,
        user: comissao.user?.nome,
        aluno: comissao.aluno?.nome,
        valor: comissao.valor,
        tipo: comissao.tipo,
        unidade: comissao.unidade?.nome,
      });
    });

    comissaomes.forEach(comissao => {
      worksheetComissaoMes.addRow({
        data: comissao.data,
        user: comissao.user?.nome,
        aluno: comissao.aluno?.nome,
        valor: comissao.valor,
        tipo: comissao.tipo,
        unidade: comissao.unidade?.nome,
      });
    });

    despesas.forEach(despesa => {
      worksheetDespesas.addRow({
        data: despesa.data,
        valor: despesa.valor,
        formaPagamento: despesa.formaPagamento,
        tipo: despesa.tipo,
        observacao: despesa.observacao,
        unidade: despesa.unidade?.nome,
      });
    });

    alunos.forEach(aluno => {
      worksheetAlunos.addRow({
        nome: aluno.nome,
        cpf: aluno.cpf,
        dataNascimento: aluno.dataNascimento,
        telefone: aluno.telefone,
        plano_desc: aluno.plano_desc,
        plano_valor: aluno.plano_valor,
        plano_dataVencimento: aluno.plano_dataVencimento,
        isAplication: aluno.isAplication,
        canceladoEm: aluno.canceladoEm,
      });
    });

    worksheetRecebimento.getColumn('valor').numFmt =
      '"R$"#,##0.00;[Red]-"R$"#,##0.00';
    worksheetComissao.getColumn('valor').numFmt =
      '"R$"#,##0.00;[Red]-"R$"#,##0.00';
    worksheetComissaoMes.getColumn('valor').numFmt =
      '"R$"#,##0.00;[Red]-"R$"#,##0.00';
    worksheetDespesas.getColumn('valor').numFmt =
      '"R$"#,##0.00;[Red]-"R$"#,##0.00';
    worksheetAlunos.getColumn('plano_valor').numFmt =
      '"R$"#,##0.00;[Red]-"R$"#,##0.00';

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'fechamento.xlsx'
    );

    await workbook.xlsx.write(res);

    res.end();
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

export default reportRoutes;
