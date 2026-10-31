const express = require('express');
const pedidosRoutes = require('./routes/pedidosRoutes');

const app = express();

app.use(express.json());
app.use('/pedidos', pedidosRoutes);

app.use((req, res) => {
  res.status(404).json({ mensagem: 'Rota não encontrada.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const isInvalidJson = error.type === 'entity.parse.failed';
  const hasErrorStatus = Number.isInteger(error.statusCode)
    && error.statusCode >= 400
    && error.statusCode < 600;
  const statusCode = isInvalidJson ? 400 : hasErrorStatus ? error.statusCode : 500;

  if (statusCode === 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    mensagem: statusCode === 500 ? 'Erro interno do servidor.' : error.message,
  });
});

module.exports = app;
