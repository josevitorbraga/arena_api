import { Router } from 'express';
import axios from 'axios';
import Checkins from '../models/Checkins.js';
import { sendNotification } from '../notificationWebsocket.js';
import moment from 'moment';
import Log from '../models/Logs.js';

const webhookRoutes = Router();

const totalpassCred = {
  '1b6e8d01-58b2-4233-8b1d-d4a82b0d95d0': {
    partner_api_key: 'f7bba248-ef7a-4276-ba14-7a6325cee848',
    place_api_key: '1b6e8d01-58b2-4233-8b1d-d4a82b0d95d0',
    unidade: 'valinhos',
  },
  '4f744e24-68dd-4eeb-95a7-32bf96613ac8': {
    partner_api_key: 'f7bba248-ef7a-4276-ba14-7a6325cee848',
    place_api_key: '4f744e24-68dd-4eeb-95a7-32bf96613ac8',
    unidade: 'jundiai',
  },
  '531b4075-73d9-4138-9f3f-ba2107cd5f4d': {
    partner_api_key: 'f7bba248-ef7a-4276-ba14-7a6325cee848',
    place_api_key: '531b4075-73d9-4138-9f3f-ba2107cd5f4d',
    unidade: 'vinhedo',
  },
};

const gympassCred = {
  gym_id: 535759,
  system_id: 182,
  partner_id: 'bbed7ca5-a714-4eb0-a2e0-309227e9258a',
  api_key:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyYWJjMTI3NC0yZDc4LTRlMDgtOWZmNy0xM2FmZTg5NjJhMTUiLCJpYXQiOjE3MzAyMjI3MzcsImlzcyI6ImlhbS51cy5neW1wYXNzLmNsb3VkIiwic3ViIjoiMmFiYzEyNzQtMmQ3OC00ZTA4LTlmZjctMTNhZmU4OTYyYTE1In0.oCBWegkOeh-AaNcbFtEEV3ujX7xqt35MBU65riR1pq0',
};

const getTotalpassCred = place => {
  return totalpassCred[place];
};

const getToken = async (place_api_key, partner_api_key) => {
  try {
    const { data } = await axios.post(
      process.env.TOTALPASS_ENDPOINT + 'partner/auth',
      {
        place_api_key: place_api_key,
        partner_api_key: partner_api_key,
      }
    );

    return { data };
  } catch (err) {
    return null;
  }
};

webhookRoutes.post('/totalpass', async (req, res) => {
  try {
    const { type, endpoint, check_in, place, user } = req.body;

    if (!!!place?.place) {
      return res.status(400).send({ error: 'Local não recebido' });
    }
    const cred = getTotalpassCred(place.place);

    sendNotification(
      'info',
      'Webhook Totalpass recebido',
      moment().format('DD-MM-YYYY HH:mm')
    );

    const response = await getToken(cred.place_api_key, cred.partner_api_key);

    if (!response) {
      return res.status(400).send({ error: 'Erro ao buscar token' });
    }

    const token = response.data.token;

    if (type === 'CHECK_IN_CREATED') {
      await axios.post(
        endpoint,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await Checkins.create({
        status: 'Validado',
        type: 'Validado',
        app: 'TOTALPASS',
        unidade_str: cred.unidade,
        data: { type, endpoint, check_in, place, user },
      });

      sendNotification(
        'success',
        'Token Totalpass validado com sucesso!',
        moment().format('DD-MM-YYYY HH:mm')
      );

      return res.status(200).send();
    }

    return res.status(200).send(response);
  } catch (err) {
    if (!!err.response) {
      const erro = err.response.data.errors[0] || null;

      if (erro) {
        // await Checkins.create({
        //   status: 'Checkin não é possível ser validado',
        //   type: 'Erro',
        //   app: 'TOTALPASS',
        //   data: req.body,
        //   errorLog: erro,
        // });
      }

      sendNotification(
        'error',
        'Token inválido Totalpass',
        moment().format('DD-MM-YYYY HH:mm')
      );
    }
    res.status(400).send({ error: err.message });
  }
});

webhookRoutes.post('/gympass', async (req, res) => {
  try {
    const { event_type, event_data, location, gym, timestamp } = req.body;

    sendNotification(
      'info',
      `Webhook Gympass recebido - #${event_data.user.first_name}`,
      moment().format('DD-MM-YYYY HH:mm')
    );

    await axios.post(
      'https://api.partners.gympass.com/access/v1/validate',
      { gympass_id: event_data.user.unique_token },
      {
        headers: {
          Authorization: `Bearer ${gympassCred.api_key}`,
          'X-Gym-Id': event_data.gym.id,
        },
      }
    );

    sendNotification(
      'success',
      'Token Gympass validado com sucesso!',
      moment().format('DD-MM-YYYY HH:mm')
    );

    await Checkins.create({
      status: `Validado - ${event_data.user.first_name}`,
      type: 'Validado',
      app: 'GYMPASS',
      data: { event_type, event_data, location, gym, timestamp },
    });

    return res.status(200).send();
  } catch (err) {
    await Log.create({
      description: 'Erro ao validar token Gympass',
      data: {
        body: req.body,
        error: err.request.body,
      },
    });
    if (!!err.response) {
      let erro = null;
      if (
        Array.isArray(err?.response?.data?.errors) &&
        err.response.data.errors.length > 0
      ) {
        erro = err.response.data.errors[0];
      }

      if (erro) {
        sendNotification(
          'error',
          'Gympass não pode ser validado: ' + erro.message,
          moment().format('DD-MM-YYYY HH:mm')
        );
      } else {
        sendNotification(
          'error',
          'Gympass não pode ser validado: ' + err.message,
          moment().format('DD-MM-YYYY HH:mm')
        );
      }
    }

    return res.status(400).send({ error: err.message });
  }
});

export default webhookRoutes;
