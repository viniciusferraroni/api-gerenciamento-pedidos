const pedidos = [];
const TIPOS_VALIDOS = ['entrega', 'retirada'];
const PRIORIDADES_VALIDAS = ['normal', 'alta', 'urgente'];
const STATUS_VALIDOS = [
  'recebido',
  'em_preparacao',
  'enviado',
  'entregue',
  'cancelado',
];
const TRANSICOES_PERMITIDAS = {
  recebido: ['em_preparacao', 'cancelado'],
  em_preparacao: ['enviado', 'cancelado'],
  enviado: ['entregue'],
  entregue: [],
  cancelado: [],
};
let proximoId = 1;

function criarErroValidacao(mensagem) {
  const error = new Error(mensagem);
  error.statusCode = 400;
  return error;
}

async function criarPedido(dadosPedido) {
  if (!dadosPedido || typeof dadosPedido !== 'object' || Array.isArray(dadosPedido)) {
    throw criarErroValidacao('Corpo da requisição inválido.');
  }

  if (typeof dadosPedido.cliente !== 'string' || dadosPedido.cliente.trim() === '') {
    throw criarErroValidacao('cliente é obrigatório e não pode ficar vazio.');
  }

  if (
    typeof dadosPedido.tipo !== 'string'
    || !TIPOS_VALIDOS.includes(dadosPedido.tipo.trim().toLowerCase())
  ) {
    throw criarErroValidacao(`tipo deve ser um dos valores: ${TIPOS_VALIDOS.join(' ou ')}.`);
  }

  if (
    typeof dadosPedido.valor !== 'number'
    || !Number.isFinite(dadosPedido.valor)
    || dadosPedido.valor <= 0
  ) {
    throw criarErroValidacao('valor deve ser numérico e maior que zero.');
  }

  if (
    typeof dadosPedido.prioridade !== 'string'
    || !PRIORIDADES_VALIDAS.includes(dadosPedido.prioridade.trim().toLowerCase())
  ) {
    throw criarErroValidacao(
      `prioridade deve ser um dos valores: ${PRIORIDADES_VALIDAS.join(', ')}.`,
    );
  }

  const pedido = {
    id: proximoId,
    cliente: dadosPedido.cliente.trim(),
    tipo: dadosPedido.tipo.trim().toLowerCase(),
    valor: dadosPedido.valor,
    prioridade: dadosPedido.prioridade.trim().toLowerCase(),
    status: 'recebido',
  };

  pedidos.push(pedido);
  proximoId += 1;
  return pedido;
}

async function listarPedidos() {
  return pedidos;
}

async function buscarPedidoPorId(id) {
  const idNumerico = Number(id);
  if (!Number.isSafeInteger(idNumerico) || idNumerico <= 0) {
    return null;
  }

  return pedidos.find((pedido) => pedido.id === idNumerico) || null;
}

async function atualizarStatusPedido(id, status) {
  const pedido = await buscarPedidoPorId(id);
  if (!pedido) {
    return null;
  }

  if (typeof status !== 'string') {
    throw criarErroValidacao(`status deve ser um dos valores: ${STATUS_VALIDOS.join(', ')}.`);
  }

  const statusNormalizado = status.trim().toLowerCase();
  if (!STATUS_VALIDOS.includes(statusNormalizado)) {
    throw criarErroValidacao(`status deve ser um dos valores: ${STATUS_VALIDOS.join(', ')}.`);
  }

  if (!TRANSICOES_PERMITIDAS[pedido.status].includes(statusNormalizado)) {
    throw criarErroValidacao(
      `Não é permitida a transição de ${pedido.status} para ${statusNormalizado}.`,
    );
  }

  pedido.status = statusNormalizado;
  return pedido;
}

module.exports = {
  criarPedido,
  listarPedidos,
  buscarPedidoPorId,
  atualizarStatusPedido,
};
