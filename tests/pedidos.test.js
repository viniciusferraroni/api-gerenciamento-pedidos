const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const app = require('../src/app');
const pedidosService = require('../src/services/pedidosService');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

async function criarPedidoParaTeste() {
  const response = await fetch(`${baseUrl}/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cliente: 'Ana Souza',
      tipo: 'entrega',
      valor: 35,
      prioridade: 'normal',
    }),
  });

  assert.equal(response.status, 201);
  return response.json();
}

test('POST /pedidos cria pedido normalizado com status inicial recebido', async () => {
  const response = await fetch(`${baseUrl}/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cliente: '  Ana Souza  ',
      tipo: ' ENTREGA ',
      valor: 35,
      prioridade: ' ALTA ',
    }),
  });
  const pedido = await response.json();

  assert.equal(response.status, 201);
  assert.equal(pedido.cliente, 'Ana Souza');
  assert.equal(pedido.tipo, 'entrega');
  assert.equal(pedido.valor, 35);
  assert.equal(pedido.prioridade, 'alta');
  assert.equal(pedido.status, 'recebido');
  assert.ok(Number.isInteger(pedido.id));
});

test('POST /pedidos rejeita dados inválidos com HTTP 400 e mensagem JSON', async (context) => {
  const casos = [
    { dados: { cliente: '   ', tipo: 'entrega', valor: 1, prioridade: 'normal' }, campo: 'cliente' },
    { dados: { cliente: 'Ana', tipo: 'balcão', valor: 1, prioridade: 'normal' }, campo: 'tipo' },
    { dados: { cliente: 'Ana', tipo: 'entrega', valor: 0, prioridade: 'normal' }, campo: 'valor' },
    { dados: { cliente: 'Ana', tipo: 'entrega', valor: '1', prioridade: 'normal' }, campo: 'valor' },
    { dados: { cliente: 'Ana', tipo: 'entrega', valor: 1, prioridade: 'baixa' }, campo: 'prioridade' },
  ];

  for (const { dados, campo } of casos) {
    await context.test(`rejeita ${campo} inválido`, async () => {
      const response = await fetch(`${baseUrl}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.equal(typeof body.mensagem, 'string');
      assert.notEqual(body.mensagem.length, 0);
    });
  }
});

test('POST /pedidos rejeita valor não finito', async () => {
  const response = await fetch(`${baseUrl}/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"cliente":"Ana","tipo":"entrega","valor":1e309,"prioridade":"normal"}',
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.match(body.mensagem, /maior que zero/);
});

test('POST /pedidos rejeita JSON malformado com HTTP 400', async () => {
  const response = await fetch(`${baseUrl}/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"cliente":',
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(typeof body.mensagem, 'string');
});

test('GET /pedidos lista os pedidos cadastrados com HTTP 200', async () => {
  const criado = await criarPedidoParaTeste();
  const response = await fetch(`${baseUrl}/pedidos`);
  const pedidos = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(pedidos));
  assert.ok(pedidos.some((pedido) => pedido.id === criado.id));
});

test('GET /pedidos/:id consulta pedido existente e responde 404 para ID inexistente', async () => {
  const criado = await criarPedidoParaTeste();
  const encontradoResponse = await fetch(`${baseUrl}/pedidos/${criado.id}`);
  const encontrado = await encontradoResponse.json();
  const inexistenteResponse = await fetch(`${baseUrl}/pedidos/999999`);
  const inexistente = await inexistenteResponse.json();

  assert.equal(encontradoResponse.status, 200);
  assert.equal(encontrado.id, criado.id);
  assert.equal(inexistenteResponse.status, 404);
  assert.equal(typeof inexistente.mensagem, 'string');
});

test('PATCH /pedidos/:id/status permite transições válidas', async () => {
  const criado = await criarPedidoParaTeste();
  const transicoes = ['em_preparacao', 'enviado', 'entregue'];

  for (const status of transicoes) {
    const response = await fetch(`${baseUrl}/pedidos/${criado.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const pedido = await response.json();

    assert.equal(response.status, 200);
    assert.equal(pedido.status, status);
  }
});

test('PATCH /pedidos/:id/status normaliza status e permite cancelamento antes do envio', async () => {
  const criado = await criarPedidoParaTeste();
  const preparacaoResponse = await fetch(`${baseUrl}/pedidos/${criado.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: ' EM_PREPARACAO ' }),
  });
  const emPreparacao = await preparacaoResponse.json();
  const cancelamentoResponse = await fetch(`${baseUrl}/pedidos/${criado.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'CANCELADO' }),
  });
  const cancelado = await cancelamentoResponse.json();
  const transicaoFinalResponse = await fetch(`${baseUrl}/pedidos/${criado.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'em_preparacao' }),
  });

  assert.equal(preparacaoResponse.status, 200);
  assert.equal(emPreparacao.status, 'em_preparacao');
  assert.equal(cancelamentoResponse.status, 200);
  assert.equal(cancelado.status, 'cancelado');
  assert.equal(transicaoFinalResponse.status, 400);
});

test('PATCH /pedidos/:id/status rejeita status inválido e transição não permitida', async () => {
  const criado = await criarPedidoParaTeste();
  const statusInvalidoResponse = await fetch(`${baseUrl}/pedidos/${criado.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'concluido' }),
  });
  const statusInvalido = await statusInvalidoResponse.json();

  assert.equal(statusInvalidoResponse.status, 400);
  assert.match(statusInvalido.mensagem, /status deve ser um dos valores/);

  const transicaoResponse = await fetch(`${baseUrl}/pedidos/${criado.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'enviado' }),
  });
  const transicao = await transicaoResponse.json();

  assert.equal(transicaoResponse.status, 400);
  assert.match(transicao.mensagem, /transição/);
});

test('PATCH /pedidos/:id/status responde 400 para corpo inválido e 404 para ID inexistente', async () => {
  const criado = await criarPedidoParaTeste();
  const corpoInvalidoResponse = await fetch(`${baseUrl}/pedidos/${criado.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(null),
  });
  const corpoInvalido = await corpoInvalidoResponse.json();
  const inexistenteResponse = await fetch(`${baseUrl}/pedidos/999999/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'invalido' }),
  });
  const inexistente = await inexistenteResponse.json();

  assert.equal(corpoInvalidoResponse.status, 400);
  assert.equal(typeof corpoInvalido.mensagem, 'string');
  assert.equal(inexistenteResponse.status, 404);
  assert.equal(typeof inexistente.mensagem, 'string');
});

test('erros inesperados respondem HTTP 500 sem serem apresentados como validação', async () => {
  const listarPedidosOriginal = pedidosService.listarPedidos;
  const consoleErrorOriginal = console.error;
  let erroRegistrado;
  pedidosService.listarPedidos = async () => {
    throw new Error('Falha interna simulada.');
  };
  console.error = (error) => {
    erroRegistrado = error;
  };

  try {
    const response = await fetch(`${baseUrl}/pedidos`);
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.equal(body.mensagem, 'Erro interno do servidor.');
    assert.doesNotMatch(body.mensagem, /Falha interna simulada/);
    assert.equal(erroRegistrado.message, 'Falha interna simulada.');
  } finally {
    pedidosService.listarPedidos = listarPedidosOriginal;
    console.error = consoleErrorOriginal;
  }
});
