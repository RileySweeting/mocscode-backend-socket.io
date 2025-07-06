export const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://your-frontend-domain.com',
  // Add your actual frontend URLs
];

export const SOCKET_IO_OPTIONS = {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6, // 1MB instead of 100MB
  allowEIO3: true,
  serveClient: false,
  allowUpgrades: true,
  perMessageDeflate: {
    threshold: 1024,
    zlibDeflateOptions: { level: 3 },
    zlibInflateOptions: { chunkSize: 10 * 1024 }
  }
};

export const PORT = process.env.PORT || 3001;