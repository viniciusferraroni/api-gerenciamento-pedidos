const pedidoService = require('../services/pedidoService');

function listar(req, res) {
  return res.status(200).json(pedidoService.listarPedidos());
}

function consultar(req, res) {
  const pedido = pedidoService.buscarPedidoPorId(req.params.id);

  if (!pedido) {
    return res.status(404).json({ message: 'Pedido não encontrado.' });
  }

  return res.status(200).json(pedido);
}

function criar(req, res) {
  const validationError = pedidoService.validarNovoPedido(req.body);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const pedido = pedidoService.criarPedido(req.body);
  return res.status(201).json(pedido);
}

function atualizarStatus(req, res) {
  const pedido = pedidoService.buscarPedidoPorId(req.params.id);

  if (!pedido) {
    return res.status(404).json({ message: 'Pedido não encontrado.' });
  }

  const status = req.body && req.body.status;
  if (typeof status !== 'string') {
    return res.status(400).json({ message: 'status é obrigatório.' });
  }

  const validationError = pedidoService.validarStatus(status);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  return res.status(200).json(pedidoService.atualizarStatus(pedido, status));
}

module.exports = {
  listar,
  consultar,
  criar,
  atualizarStatus
};
