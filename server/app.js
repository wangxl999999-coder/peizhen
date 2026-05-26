const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const uploadPath = config.upload.path;
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use('/api', routes);

app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.json({
    code: 500,
    message: err.message || '服务器内部错误',
    data: null
  });
});

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null
  });
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  陪诊服务平台后端服务已启动`);
  console.log(`  服务地址: http://localhost:${PORT}`);
  console.log(`  接口前缀: http://localhost:${PORT}/api`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log(`========================================\n`);
});

module.exports = app;
