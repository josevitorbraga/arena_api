import { Schema, model } from 'mongoose';

const PlanoSchema = new Schema(
  {
    nome: {
      type: String,
      required: true,
    },
    valorAula: {
      type: Number,
      required: true,
    },
    quantidadeAulas: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Plano = model('Plano', PlanoSchema);

export default Plano;
