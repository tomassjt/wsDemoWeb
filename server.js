const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const STORAGE_FILE = path.join(__dirname, 'storage.json');

let state = { products: [] };

// Cargar estado inicial si existe
if (fs.existsSync(STORAGE_FILE)) {
    const data = fs.readFileSync(STORAGE_FILE, 'utf8');
    try {
        state = JSON.parse(data);
    } catch (e) {
        console.error('Error leyendo storage.json:', e);
    }
}

// Guardar estado en disco
function persistState() {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// Configurar servidor WebSocket
const wss = new WebSocket.Server({ host: '0.0.0.0', port: 8080 });
console.log('Servidor corriendo en ws://localhost:8080');

wss.on('connection', (ws) => {
    console.log('Cliente conectado');

    // Enviar estado completo al nuevo cliente
    ws.send(JSON.stringify({ type: 'sync', state }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'addProduct') {
                // Agregar producto al estado
                state.products.push(data.product);
                persistState();

                // Reenviar a todos los clientes
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'addProduct', product: data.product }));
                    }
                });
            }
        } catch (e) {
            console.error('Mensaje inválido:', message, e);
        }
    });
});
