class FuncionalidadeNaoImplementadaError extends Error {
  constructor() {
    super('Esta funcionalidade ainda não foi implementada.');
    this.name = 'FuncionalidadeNaoImplementadaError';
    this.statusCode = 501;
  }
}

async function criarPedido(dadosPedido) {
  void dadosPedido;
  throw new FuncionalidadeNaoImplementadaError();
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
