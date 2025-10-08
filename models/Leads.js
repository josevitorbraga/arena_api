import moment from 'moment';
import { Schema, model } from 'mongoose';

const LeadsSchema = new Schema(
  {
    nome: {
      type: String,
      required: true,
    },
    cpf: {
      type: String,
      nullable: true,
    },
    dataNascimento: {
      type: Date,
      nullable: true,
    },
    telefone: {
      type: String,
      required: true,
    },
    nomeAgenda: {
      type: String,
      required: true,
    },
    unidade: {
      type: Schema.Types.ObjectId,
      ref: 'Unidade',
      required: true,
    },
    registroDeContatos: [
      {
        data: {
          type: Date,
          default: Date.now,
        },
        user: {
          type: Schema.Types.ObjectId,
          ref: 'Usuario',
        },
        observacao: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

LeadsSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.label = ret.nome;
    ret.cpf = ret.cpf || 'Não informado';
    ret.dataNascimento_formatted = ret.dataNascimento
      ? moment(ret.dataNascimento).format('DD/MM/YYYY')
      : '-';

    return ret;
  },
});

const Leads = model('Leads', LeadsSchema);

export default Leads;
