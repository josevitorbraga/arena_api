import moment from 'moment';
import { Schema, model } from 'mongoose';

const TarefaSchema = new Schema(
  {
    descricao: {
      type: String,
      required: true,
    },
    data: {
      type: Date,
      required: true,
    },
    recorrente: {
      type: Boolean,
      required: true,
      default: false,
    },
    semanaRecorrente: [
      {
        type: Number,
      },
    ],
    usuarios: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
      },
    ],
    completaPor: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'Usuario',
        },
        completedAt: {
          type: Date,
        },
      },
    ],
    criadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
  },
  { timestamps: true }
);

TarefaSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.formated_date = moment(ret.data).format('DD/MM/YYYY');
    return ret;
  },
});

const Tarefa = model('Tarefa', TarefaSchema);

export default Tarefa;
