import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function pickPort(want) {
  return new Promise((resolve, reject) => {
    const tryListen = (p) => {
      if (p > want + 40) {
        reject(new Error('Нет свободного порта для API'));
        return;
      }
      const s = net.createServer();
      s.once('error', () => tryListen(p + 1));
      s.listen(p, '127.0.0.1', () => {
        s.close(() => resolve(p));
      });
    };
    tryListen(want);
  });
}

const want = Number(process.env.SERVER_PORT || 3001);
const apiPort = await pickPort(want);

const node = process.execPath;
const serverPath = path.join(root, 'server', 'index.js');
const vitePath = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');

const env = {
  ...process.env,
  SERVER_PORT: String(apiPort),
  VITE_PROXY_TARGET: `http://127.0.0.1:${apiPort}`,
};

const api = spawn(node, [serverPath], { cwd: root, env, stdio: 'inherit' });

const vite = spawn(
  node,
  [vitePath, '--config', path.join('client', 'vite.config.js')],
  { cwd: root, env, stdio: 'inherit' }
);

function stop() {
  api.kill('SIGTERM');
  vite.kill('SIGTERM');
}

process.on('SIGINT', () => {
  stop();
  process.exit(0);
});
process.on('SIGTERM', () => {
  stop();
  process.exit(0);
});

api.on('exit', (code, sig) => {
  if (sig !== 'SIGTERM' && sig !== 'SIGINT') {
    vite.kill('SIGTERM');
    process.exit(code ?? 1);
  }
});

vite.on('exit', (code, sig) => {
  if (sig !== 'SIGTERM' && sig !== 'SIGINT') {
    api.kill('SIGTERM');
    process.exit(code ?? 1);
  }
});
