import moment from 'moment';
import { Schema, model } from 'mongoose';

const AgendaSchema = new Schema(
  {
    experimental: {
      type: Boolean,
      default: false,
    },
    experimentalNome: {
      type: String,
      default: null,
    },
    aluno: {
      type: Schema.Types.ObjectId,
      ref: 'Aluno',
      nullable: true,
      default: null,
    },
    professor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    data: {
      type: Date,
      required: true,
    },
    hora: {
      type: String,
      required: true,
    },
    cor: {
      type: String,
      required: true,
      default: function () {
        return this.experimental ? '#ff008a' : '#00FF85';
      },
    },
    faltou: {
      type: Boolean,
      default: false,
    },
    recorrente: {
      type: Boolean,
      default: false,
    },
    tipo: {
      type: String,
      required: true,
      enum: ['Aula', 'Avaliação', 'Outro'],
      default: 'Aula',
    },
    observacao: {
      type: String,
    },
    semanaRecorrente: [
      {
        type: Number,
      },
    ],
    unidade: {
      type: Schema.Types.ObjectId,
      ref: 'Unidade',
    },
    excluidoEm: [
      {
        type: Date,
      },
    ],
    faltouEm: [
      {
        type: Date,
      },
    ],
    isHistorico: {
      type: Boolean,
      default: false,
    },
    gerarComissaoFalta: {
      type: Boolean,
      default: false,
    },
    gerarComissaoFaltaEm: [
      {
        type: Date,
      },
    ],
  },
  { timestamps: true }
);

AgendaSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.agendado = true;
    return ret;
  },
});

const Agenda = model('Agenda', AgendaSchema);

export default Agenda;
