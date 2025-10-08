import { Schema, model } from 'mongoose';

const UnidadeSchema = new Schema(
  {
    nome: {
      type: String,
      required: true,
    },
    endereco: {
      type: String,
      required: true,
    },
    cidade: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

UnidadeSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    return ret;
  },
});

const Unidade = model('Unidade', UnidadeSchema);

export default Unidade;
