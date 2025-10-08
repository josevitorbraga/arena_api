import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

const UsuarioSchema = new Schema(
  {
    nome: {
      type: String,
      required: true,
    },
    usuario: {
      type: String,
      required: true,
      unique: true,
    },
    senha: {
      type: String,
      required: true,
    },
    permissao: {
      // 1: 'admin',
      // 2: 'recepçao',
      // 3: 'professor',

      type: Number,
      required: true,
      enum: [1, 2, 3],
      validate: {
        validator: function (v) {
          return [1, 2, 3].includes(v);
        },
        message: props => `${props.value} não é uma permissão válida!`,
      },
    },
    unidades: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Unidade',
      },
    ],

    expediente: [
      {
        horaInicio: {
          type: String,
          required: function () {
            return this.permissao === 3;
          },
        },
        horaFim: {
          type: String,
          required: function () {
            return this.permissao === 3;
          },
        },
      },
    ],

    percentualComissao: {
      type: Number,
      required: function () {
        return this.permissao === 3;
      },
    },
    podeEditarAgenda: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

UsuarioSchema.pre('save', async function (next) {
  if (this.isModified('senha') || this.isNew) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.senha = await bcrypt.hash(this.senha, salt);
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

UsuarioSchema.pre('updateOne', async function (next) {
  const update = this.getUpdate();
  if (update && update.senha) {
    try {
      const salt = await bcrypt.genSalt(10);
      update.senha = await bcrypt.hash(update.senha, salt);
      this.setUpdate(update);
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

UsuarioSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    ret.label = ret.nome;
    ret.id = ret._id;
    ret.permissaoName =
      ret.permissao === 1
        ? 'Admin'
        : ret.permissao === 2
        ? 'Recepção'
        : 'Professor';
    delete ret.senha;
    return ret;
  },
});

const Usuario = model('Usuario', UsuarioSchema);

export default Usuario;
