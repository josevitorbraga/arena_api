import { Schema, model } from 'mongoose';

const ComissaoMesSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  valor: {
    type: Number,
    required: true,
  },
  data: {
    type: Date,
    required: true,
  },
  tipo: {
    type: String,
    required: true,
  },
  hora: {
    type: String,
  },
  agendamento: {
    type: Schema.Types.ObjectId,
    ref: 'Agenda',
  },
  unidade: {
    type: Schema.Types.ObjectId,
    ref: 'Unidade',
  },
  aluno: {
    type: Schema.Types.ObjectId,
    ref: 'Aluno',
  },
});

const ComissaoMes = model('ComissaoMes', ComissaoMesSchema);

export default ComissaoMes;
