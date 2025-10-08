import { Schema, model } from 'mongoose';

const FinanceiroSaida = new Schema(
  {
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
    },
    observacao: {
      type: String,
      required: true,
    },
    unidade: {
      type: Schema.Types.ObjectId,
      ref: 'Unidade',
    },
  },
  { timestamps: true }
);

FinanceiroSaida.set('toJSON', {
  transform: function (doc, ret) {
    const nome = ret?.aluno?.nome;
    ret.nomeUnidade = ret?.unidade?.nome || null;
    return ret;
  },
});

const Saidas = model('Saidas', FinanceiroSaida);

export default Saidas;
