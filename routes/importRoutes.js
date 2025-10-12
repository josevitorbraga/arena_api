import { Router } from 'express';
import { parse } from 'csv-parse';
import moment from 'moment';
import Aluno from '../models/Aluno.js';

const importRoutes = Router();

importRoutes.post('/alunos', (req, res) => {
  try {
    const { file, unidadeId } = req.body;

    let savedIds = [];
    let saveAlunos = [];

    const csvBuffer = Buffer.from(file, 'base64');
    const csvString = csvBuffer.toString('utf-8');

    const parser = parse({
      delimiter: ',',
      trim: true,
      skip_empty_lines: true,
      columns: true,
    });

    parser.on('readable', async function () {
      let record;
      while ((record = parser.read()) !== null) {
        const toSave = {
          ...record,
          dataNascimento: moment(record.dataNascimento, 'DD/MM/YYYY').toDate(),
          isAplication: record.isAplication == 'VERDADEIRO' ? true : false,
          plano_valor: Number(record.plano_valor) || 0,
          plano_dataVencimento:
            moment(record.plano_dataVencimento, 'DD/MM/YYYY').toDate() ||
            moment().toDate(),
          unidade: unidadeId,
          active:
            moment(record.plano_dataVencimento, 'DD/MM/YYYY').isAfter(
              moment()
            ) || record.isAplication == 'VERDADEIRO'
              ? true
              : false,
          canceladoEm: record.active == 'VERDADEIRO' ? null : new Date(),
        };
        saveAlunos.push(toSave);
        // const saved = await Aluno.create(toSave);
        // savedIds.push(saved._id);
      }
    });

    parser.on('end', async function () {
      console.log('Processamento do CSV finalizado');
      console.log('Alunos a serem salvos:', saveAlunos.length);

      await Aluno.insertMany(saveAlunos)
        .then(alunos => {
          alunos.forEach(aluno => {
            savedIds.push(aluno._id);
          });
        })
        .catch(err => {
          console.error('Erro ao salvar alunos:', err);
          res.status(500).json({
            error: 'Erro ao salvar os alunos',
          });
        });

      res.status(201).json({
        alunosSalvos: saveAlunos.length,
        savedIds,
      });
    });

    parser.write(csvString);
    parser.end();
  } catch (err) {
    console.error('Erro ao processar o arquivo:', err);
    res.status(500).json({
      error: 'Erro ao processar o arquivo CSV',
    });
  }
});

export default importRoutes;
