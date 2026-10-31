const pedidos = [
  {
    id: 1,
    cliente: 'Carlos Silva',
    tipo: 'entrega',
    valor: 150,
    prioridade: 'normal',
    status: 'recebido'
  }
];

const STATUS_VALIDOS = ['recebido', 'em_preparacao', 'enviado', 'entregue', 'cancelado'];
const PRIORIDADES_VALIDAS = ['normal', 'alta', 'urgente'];
let nextId = 2;

function validarNovoPedido(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Corpo da requisição inválido.';
  }

  if (typeof body.cliente !== 'string' || body.cliente.trim() === '') {
    return 'cliente é obrigatório.';
  }

  if (typeof body.tipo !== 'string' || body.tipo.trim() === '') {
    return 'tipo é obrigatório.';
  }

  if (typeof body.valor !== 'number' || Number.isNaN(body.valor) || body.valor <= 0) {
    return 'valor deve ser numérico e maior que zero.';
  }

  if (typeof body.prioridade !== 'string' || !PRIORIDADES_VALIDAS.includes(body.prioridade.toLowerCase())) {
    return 'prioridade deve ser um dos valores: normal, alta ou urgente.';
  }

  return null;
}

function validarStatus(status) {
  if (typeof status !== 'string' || !STATUS_VALIDOS.includes(status.toLowerCase())) {
    return `status inválido. Valores permitidos: ${STATUS_VALIDOS.join(', ')}.`;
  }

  return null;
}

function listarPedidos() {
  return pedidos;
}

function buscarPedidoPorId(id) {
  return pedidos.find((pedido) => pedido.id === Number(id));
}

function criarPedido(dados) {
  const pedido = {
    id: nextId,
    cliente: dados.cliente.trim(),
    tipo: dados.tipo.trim(),
    valor: dados.valor,
    prioridade: dados.prioridade.toLowerCase(),
    status: 'recebido'
  };

  pedidos.push(pedido);
  nextId += 1;
  return pedido;
}

function atualizarStatus(pedido, status) {
  pedido.status = status.toLowerCase();
  return pedido;
}

module.exports = {
  validarNovoPedido,
  validarStatus,
  listarPedidos,
  buscarPedidoPorId,
  criarPedido,
  atualizarStatus
};
