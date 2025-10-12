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
    email: {
      type: String,
      required: false,
      lowercase: true,
      validate: {
        validator: function (v) {
          // Se email for fornecido, deve ter formato válido
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Email deve ter um formato válido',
      },
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
    plano_tipo: {
      type: String,
      required: true,
      enum: ['mensal', 'trimestral', 'semestral', 'anual', 'avulso'],
      default: 'mensal',
    },
    plano_valor: {
      type: Number,
      required: true,
    },
    plano_valorMensal: {
      type: Number,
      required: false,
      default: function () {
        // Calcula valor mensal baseado no tipo de plano
        if (!this.plano_valor || !this.plano_tipo) return this.plano_valor;

        const multiplicadores = {
          mensal: 1,
          trimestral: 1 / 3,
          semestral: 1 / 6,
          anual: 1 / 12,
          avulso: 1,
        };

        return Math.round(
          this.plano_valor * (multiplicadores[this.plano_tipo] || 1)
        );
      },
    },
    plano_dataVencimento: {
      type: Date,
      required: true,
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
    endereco: {
      type: String,
      nullable: true,
    },
  },
  { timestamps: true }
);

// Campos virtuais para compatibilidade com frontend
AlunoSchema.virtual('aulasDoPlano').get(function () {
  // Para clientes de aplicativo ou planos avulsos: sempre 1 aula
  if (this.isAplication || this.plano_tipo === 'avulso') {
    return 1;
  }

  // Para planos por período: número teórico baseado no tipo
  const aulasPorTipo = {
    mensal: 8, // ~2 aulas por semana
    trimestral: 24, // 8 aulas x 3 meses
    semestral: 48, // 8 aulas x 6 meses
    anual: 96, // 8 aulas x 12 meses
  };

  return aulasPorTipo[this.plano_tipo] || 8;
});

// Valor padrão para avaliação (compatibilidade)
AlunoSchema.virtual('plano_avaliacaoValor').get(function () {
  return 50; // Valor fixo padrão
});

// Campos removidos - retornam null para compatibilidade
AlunoSchema.virtual('professorDesignado').get(function () {
  return null;
});

AlunoSchema.virtual('professorAvaliacao').get(function () {
  return null;
});

AlunoSchema.virtual('vendaRealizadaPor').get(function () {
  return null;
});

AlunoSchema.set('toJSON', {
  virtuals: true, // Incluir campos virtuais no JSON
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
