import express from 'express';
import path from 'path';
import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const FLASK_PORT = 5001;

// Spawn the Flask backend process
let flaskProcess: ChildProcess | null = null;

function startFlask() {
  const scriptPath = path.resolve(process.cwd(), 'backend', 'app.py');
  console.log('Starting Python Flask backend at:', scriptPath, 'on port', FLASK_PORT);
  flaskProcess = spawn('python3', [scriptPath], {
    cwd: process.cwd(),
    env: { ...process.env, FLASK_PORT: String(FLASK_PORT) },
    stdio: 'inherit',
  });

  flaskProcess.on('exit', (code, signal) => {
    console.log(`Flask process exited with code ${code}, signal ${signal}`);
  });

  flaskProcess.on('error', (err) => {
    console.error('Failed to start Flask process:', err);
  });
}

startFlask();

// Proxy helper for Flask endpoints
function proxyToFlask(req: express.Request, res: express.Response) {
  const options: http.RequestOptions = {
    hostname: '127.0.0.1',
    port: FLASK_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${FLASK_PORT}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy connection error to Flask:', err.message);
    res.status(503).json({
      error: 'Backend is initializing, please wait a moment...',
    });
  });

  req.pipe(proxyReq);
}

// Flask API routes
app.all('/merge-pdf', (req, res) => {
  proxyToFlask(req, res);
});

app.all('/text-to-pdf', (req, res) => {
  proxyToFlask(req, res);
});

app.all('/api/health', (req, res) => {
  proxyToFlask(req, res);
});

app.all('/api/*', (req, res) => {
  proxyToFlask(req, res);
});

// If an API client queries GET / directly with Accept: application/json
app.get('/', (req, res, next) => {
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return proxyToFlask(req, res);
  }
  next();
});

async function startServer() {
  // Mount Vite in development or serve static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PDF Tools server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

// Clean up child process on exit
process.on('SIGINT', () => {
  if (flaskProcess) flaskProcess.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  if (flaskProcess) flaskProcess.kill();
  process.exit();
});
