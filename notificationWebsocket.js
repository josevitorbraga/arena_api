import WebSocket, { WebSocketServer } from 'ws';

let wss;

const notificationWebsocket = () => {
  wss = new WebSocketServer({
    port: 8080,
  });

  wss.on('connection', ws => {
    ws.on('message', message => {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  });

  return wss;
};

const sendNotification = (type, message, at) => {
  let notification = {
    type,
    message,
    at,
  };
  if (wss) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(notification));
      }
    });
  }
};

export { notificationWebsocket, sendNotification };
