import moment from 'moment';
import { Schema, model } from 'mongoose';

const AlunoSchema = new Schema(
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
      required: true,
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
    plano_desc: {
      type: String,
      required: true,
    },
    plano_valor: {
      type: Number,
      required: true,
    },
    plano_dataVencimento: {
      type: Date,
      required: true,
    },
    plano_avaliacaoValor: {
      type: Number,
      required: true,
      default: 50,
    },
    professorAvaliacao: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    professorDesignado: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    vendaRealizadaPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    active: {
      type: Boolean,
      default: false,
    },
    canceladoEm: {
      type: Date,
      nullable: true,
      default: null,
    },
    isAplication: {
      type: Boolean,
      default: false,
    },
    aulasDoPlano: {
      type: Number,
      nullable: true,
    },
  },
  { timestamps: true }
);

AlunoSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.label = ret.nome;
    ret.plano_dataVencimento_formatted = ret.plano_dataVencimento
      ? moment(ret.plano_dataVencimento).format('DD/MM/YYYY')
      : null;

    ret.dataNascimento_formatted = moment(ret.dataNascimento).format(
      'DD/MM/YYYY'
    );

    ret.proxPgto = moment(ret.plano_dataVencimento)
      .add(1, 'months')
      .format('DD/MM/YYYY');

    ret.cancelado = !ret.canceladoEm ? false : true;
    return ret;
  },
});

const Aluno = model('Aluno', AlunoSchema);

export default Aluno;
