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
const TIPOS_VALIDOS = ['entrega', 'retirada'];
const TRANSICOES_STATUS = {
  recebido: ['em_preparacao', 'cancelado'],
  em_preparacao: ['enviado', 'cancelado'],
  enviado: ['entregue'],
  entregue: [],
  cancelado: []
};
let nextId = 2;

function validarNovoPedido(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Corpo da requisição inválido.';
  }

  if (typeof body.cliente !== 'string' || body.cliente.trim() === '') {
    return 'cliente é obrigatório.';
  }

  if (typeof body.tipo !== 'string' || !TIPOS_VALIDOS.includes(body.tipo.trim().toLowerCase())) {
    return `tipo deve ser um dos valores: ${TIPOS_VALIDOS.join(' ou ')}.`;
  }

  if (typeof body.valor !== 'number' || !Number.isFinite(body.valor) || body.valor <= 0) {
    return 'valor deve ser numérico e maior que zero.';
  }

  if (typeof body.prioridade !== 'string' || !PRIORIDADES_VALIDAS.includes(body.prioridade.trim().toLowerCase())) {
    return 'prioridade deve ser um dos valores: normal, alta ou urgente.';
  }

  return null;
}

function validarStatus(status) {
  if (typeof status !== 'string' || !STATUS_VALIDOS.includes(status.trim().toLowerCase())) {
    return `status inválido. Valores permitidos: ${STATUS_VALIDOS.join(', ')}.`;
  }

  return null;
}

function validarTransicaoStatus(statusAtual, proximoStatus) {
  if (!TRANSICOES_STATUS[statusAtual].includes(proximoStatus.trim().toLowerCase())) {
    return `Não é permitido alterar o status de ${statusAtual} para ${proximoStatus}.`;
  }

  return null;
}

function validarFiltrosLista(filtros) {
  if (filtros.status !== undefined && (
    typeof filtros.status !== 'string'
    || !STATUS_VALIDOS.includes(filtros.status.trim().toLowerCase())
  )) {
    return `status inválido. Valores permitidos: ${STATUS_VALIDOS.join(', ')}.`;
  }

  if (filtros.prioridade !== undefined && (
    typeof filtros.prioridade !== 'string'
    || !PRIORIDADES_VALIDAS.includes(filtros.prioridade.trim().toLowerCase())
  )) {
    return 'prioridade inválida. Valores permitidos: normal, alta ou urgente.';
  }

  return null;
}

function listarPedidos(filtros = {}) {
  return pedidos.filter((pedido) => {
    const statusCorresponde = filtros.status === undefined
      || pedido.status === filtros.status.trim().toLowerCase();
    const prioridadeCorresponde = filtros.prioridade === undefined
      || pedido.prioridade === filtros.prioridade.trim().toLowerCase();

    return statusCorresponde && prioridadeCorresponde;
  });
}

function buscarPedidoPorId(id) {
  if (typeof id !== 'string' || !/^[1-9]\d*$/.test(id)) {
    return undefined;
  }

  const pedidoId = Number(id);
  if (!Number.isSafeInteger(pedidoId)) {
    return undefined;
  }

  return pedidos.find((pedido) => pedido.id === pedidoId);
}

function criarPedido(dados) {
  const pedido = {
    id: nextId,
    cliente: dados.cliente.trim(),
    tipo: dados.tipo.trim().toLowerCase(),
    valor: dados.valor,
    prioridade: dados.prioridade.trim().toLowerCase(),
    status: 'recebido'
  };

  pedidos.push(pedido);
  nextId += 1;
  return pedido;
}

function atualizarStatus(pedido, status) {
  pedido.status = status.trim().toLowerCase();
  return pedido;
}

module.exports = {
  validarNovoPedido,
  validarStatus,
  validarTransicaoStatus,
  validarFiltrosLista,
  listarPedidos,
  buscarPedidoPorId,
  criarPedido,
  atualizarStatus
};
