const express = require('express');

const app = express();
app.use(express.json());

const STATUS_VALIDOS = ['recebido', 'em_preparacao', 'enviado', 'entregue', 'cancelado'];
const PRIORIDADE_VALIDAS = ['normal', 'alta', 'urgente'];

let pedidos = [
  {
    id: 1,
    cliente: 'Carlos Silva',
    tipo: 'entrega',
    valor: 150,
    prioridade: 'normal',
    status: 'recebido'
  }
];

let nextId = 2;

function findPedidoById(id) {
  const pedidoId = Number(id);
  return pedidos.find((pedido) => pedido.id === pedidoId);
}

function validateString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    return `${fieldName} é obrigatório.`;
  }
  return null;
}

function validatePedidoBody(body) {
  if (!body || typeof body !== 'object') {
    return 'Corpo da requisição inválido.';
  }

  const clienteError = validateString(body.cliente, 'cliente');
  if (clienteError) return clienteError;

  const tipoError = validateString(body.tipo, 'tipo');
  if (tipoError) return tipoError;

  if (typeof body.valor !== 'number' || Number.isNaN(body.valor) || body.valor <= 0) {
    return 'valor deve ser numérico e maior que zero.';
  }

  if (typeof body.prioridade !== 'string' || !PRIORIDADE_VALIDAS.includes(body.prioridade.toLowerCase())) {
    return 'prioridade deve ser um dos valores: normal, alta ou urgente.';
  }

  return null;
}

function validateStatus(status) {
  if (typeof status !== 'string' || !STATUS_VALIDOS.includes(status.toLowerCase())) {
    return `status inválido. Valores permitidos: ${STATUS_VALIDOS.join(', ')}.`;
  }

  return null;
}

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, message: 'API funcionando corretamente.' });
});

app.get('/pedidos', (req, res) => {
  res.status(200).json(pedidos);
});

app.get('/pedidos/:id', (req, res) => {
  const pedido = findPedidoById(req.params.id);

  if (!pedido) {
    return res.status(404).json({ message: 'Pedido não encontrado.' });
  }

  return res.status(200).json(pedido);
});

app.post('/pedidos', (req, res) => {
  const validationError = validatePedidoBody(req.body);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const novoPedido = {
    id: nextId,
    cliente: req.body.cliente.trim(),
    tipo: req.body.tipo.trim(),
    valor: Number(req.body.valor),
    prioridade: req.body.prioridade.toLowerCase(),
    status: 'recebido'
  };

  pedidos.push(novoPedido);
  nextId += 1;

  return res.status(201).json(novoPedido);
});

app.patch('/pedidos/:id/status', (req, res) => {
  const pedido = findPedidoById(req.params.id);

  if (!pedido) {
    return res.status(404).json({ message: 'Pedido não encontrado.' });
  }

  if (!req.body || typeof req.body !== 'object' || !Object.prototype.hasOwnProperty.call(req.body, 'status')) {
    return res.status(400).json({ message: 'status é obrigatório.' });
  }

  const statusError = validateStatus(req.body.status);
  if (statusError) {
    return res.status(400).json({ message: statusError });
  }

  pedido.status = req.body.status.toLowerCase();

  return res.status(200).json(pedido);
});

module.exports = app;
