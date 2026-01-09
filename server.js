const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// Array para almacenar productos en memoria
let productos = [];

wss.on('connection', (ws) => {
  console.log('Cliente conectado');

  // Enviar la lista de productos actual al cliente que se conectó
  ws.send(JSON.stringify({ type: 'init', productos }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.name && data.price) {
        // Es un producto, lo agregamos
        productos.push(data);

        // Reenviamos a todos los clientes conectados
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'new_product', product: data }));
          }
        });
      } else {
        // Podés manejar otros tipos de mensajes si querés
        console.log('Mensaje recibido:', data);
      }
    } catch (err) {
      console.log('Error al procesar mensaje:', err);
    }
  });

  ws.on('close', () => {
    console.log('Cliente desconectado');
  });
});

console.log('Servidor WebSocket corriendo en ws://localhost:8080');
