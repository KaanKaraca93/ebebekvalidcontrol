const express = require('express');
const tokenRoutes = require('./routes/token.routes');
const styleRoutes = require('./routes/style.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api', tokenRoutes);
app.use('/api/style', styleRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    environments: ['TST (HA286TFZ2VY8TRHK_TRN)', 'PRD (HA286TFZ2VY8TRHK_PRD)'],
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 PLM API (TRN) çalışıyor → http://localhost:${PORT}`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/token`);
  console.log(`   GET  /api/token/info`);
  console.log(`   POST /api/token/refresh`);
  console.log(`   POST /api/style/process`);
  console.log(`   GET  /api/style/:styleId`);
  console.log(`   GET  /api/style/:styleId/validate`);
});

module.exports = app;
