require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'peizhen',
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'peizhen2024secretkey',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || ''
  },
  upload: {
    path: process.env.UPLOAD_PATH || './public/uploads',
    maxSize: 5 * 1024 * 1024
  },
  order: {
    cancelBeforeHours: 2,
    maxRescheduleCount: 2
  }
};
