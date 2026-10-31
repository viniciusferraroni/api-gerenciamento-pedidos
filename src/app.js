const express = require('express');
const pedidoRoutes = require('./routes/pedidoRoutes');

const app = express();
app.use(express.json());

const STATUS_VALIDOS = ['recebido', 'em_preparacao', 'enviado', 'entregue', 'cancelado'];
const PRIORIDADE_VALIDAS = ['normal', 'alta', 'urgente'];

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, message: 'API funcionando corretamente.' });
});

app.use('/pedidos', pedidoRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Corpo JSON inválido.' });
  }

  console.error(error);
  return res.status(500).json({ message: 'Erro interno do servidor.' });
});

module.exports = app;
