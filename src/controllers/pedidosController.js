const pedidosService = require('../services/pedidosService');

async function criarPedido(req, res, next) {
  try {
    const pedido = await pedidosService.criarPedido(req.body);
    return res.status(201).json(pedido);
  } catch (error) {
    return next(error);
  }
}

async function listarPedidos(req, res, next) {
  try {
    const pedidos = await pedidosService.listarPedidos();
    return res.status(200).json(pedidos);
  } catch (error) {
    return next(error);
  }
}

async function buscarPedidoPorId(req, res, next) {
  try {
    const pedido = await pedidosService.buscarPedidoPorId(req.params.id);
    if (!pedido) {
      return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
    }

    return res.status(200).json(pedido);
  } catch (error) {
    return next(error);
  }
}

async function atualizarStatusPedido(req, res, next) {
  try {
    const pedido = await pedidosService.atualizarStatusPedido(
      req.params.id,
      req.body.status,
    );
    if (!pedido) {
      return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
    }

    return res.status(200).json(pedido);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  criarPedido,
  listarPedidos,
  buscarPedidoPorId,
  atualizarStatusPedido,
};
