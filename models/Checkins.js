import { Schema, model } from 'mongoose';

const CheckinSchema = new Schema({
  status: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Solicitação', 'Validado', 'Erro'],
  },
  app: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
  errorLog: {
    type: Object,
    nullable: true,
    default: null,
  },
  unidade_str: {
    type: String,
    nullable: true,
  },
});

const Checkins = model('Checkins', CheckinSchema);

export default Checkins;
