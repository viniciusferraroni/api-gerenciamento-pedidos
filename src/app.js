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

module.exports = app;
