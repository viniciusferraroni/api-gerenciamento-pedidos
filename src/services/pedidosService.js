class FuncionalidadeNaoImplementadaError extends Error {
  constructor() {
    super('Esta funcionalidade ainda não foi implementada.');
    this.name = 'FuncionalidadeNaoImplementadaError';
    this.statusCode = 501;
  }
}

const pedidos = [];
const TIPOS_VALIDOS = ['entrega', 'retirada'];
const PRIORIDADES_VALIDAS = ['normal', 'alta', 'urgente'];
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
  throw new FuncionalidadeNaoImplementadaError();
}

async function buscarPedidoPorId(id) {
  void id;
  throw new FuncionalidadeNaoImplementadaError();
}

async function atualizarStatusPedido(id, status) {
  void id;
  void status;
  throw new FuncionalidadeNaoImplementadaError();
}

module.exports = {
  criarPedido,
  listarPedidos,
  buscarPedidoPorId,
  atualizarStatusPedido,
};
