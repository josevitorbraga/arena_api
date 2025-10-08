import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import router from './routes/index.js';
import cors from 'cors';
import './cron.js';
import { fileURLToPath } from 'url';
import path from 'path';
import 'moment/locale/pt-br.js'; // Importa o locale pt-br
import moment from 'moment';
import http from 'http';
import {
  notificationWebsocket,
  sendNotification,
} from './notificationWebsocket.js';
import seedDatabase from './utils/seedDatabase.js';

moment.locale('pt-br'); // Configura o moment para usar o locale pt-br

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(router);
notificationWebsocket();

app.use(express.static(path.join(__dirname, '../arena_webapp/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../arena_webapp/dist', 'index.html'));
});

const main = async () => {
  try {
    const now = moment().format('DD/MM/YYYY HH:mm:ss');
    await mongoose.connect('mongodb://127.0.0.1:27017/arena');
    console.log('DATABASE CONNECTED at: ', now);

    // Executar seed do banco de dados se necessário
    await seedDatabase();

    app.listen(3333, () => {
      console.log(`Server is running on port 3333 at: ${now}`);
    });
  } catch (err) {
    console.log(err);
    console.log('Failed to start the server ☠', err.message);
  }
};

main();
