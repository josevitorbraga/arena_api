import moment from 'moment';
import { Schema, model } from 'mongoose';

const FinanceiroEntrada = new Schema(
  {
    aluno: {
      type: Schema.Types.ObjectId,
      ref: 'Aluno',
    },
    valor: {
      type: Number,
      required: true,
    },
    data: {
      type: Date,
      required: true,
    },
    formaPagamento: {
      type: String,
      required: true,
      enum: ['Dinheiro', 'Cartão', 'Pix', 'Outros'],
    },
    tipo: {
      type: String,
      required: true,
      enum: ['Mensalidade', 'Avaliacao', 'Outros'],
    },
    observacao: {
      type: String,
    },
    unidade: {
      type: Schema.Types.ObjectId,
      ref: 'Unidade',
    },
  },
  { timestamps: true }
);

FinanceiroEntrada.set('toJSON', {
  transform: function (doc, ret) {
    const nome = ret?.aluno?.nome;
    ret.nomeAluno = nome !== undefined ? nome : null;
    ret.nomeUnidade = ret?.unidade?.nome || null;
    return ret;
  },
});

const Entradas = model('Entradas', FinanceiroEntrada);

export default Entradas;
