import { Schema, model } from 'mongoose';

const LogsSchema = new Schema(
  {
    description: {
      type: String,
      required: true,
    },
    data: {
      type: Object,
    },
  },
  { timestamps: true }
);

const Log = model('Log', LogsSchema);

export default Log;
