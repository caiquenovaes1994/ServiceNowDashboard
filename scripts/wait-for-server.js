/* global process */
import net from 'net';

const PORT = process.env.PORT || 5000;
const HOST = '127.0.0.1';
const MAX_WAIT_MS = 15000;
const INTERVAL_MS = 200;

const startTime = Date.now();

function checkServer() {
  const socket = net.createConnection({ port: PORT, host: HOST });

  socket.on('connect', () => {
    socket.destroy();
    process.exit(0);
  });

  socket.on('error', () => {
    socket.destroy();
    if (Date.now() - startTime >= MAX_WAIT_MS) {
      console.warn(`[wait-for-server] Timeout aguardando o servidor na porta ${PORT}. Prosseguindo com Vite...`);
      process.exit(0);
    }
    setTimeout(checkServer, INTERVAL_MS);
  });
}

checkServer();
