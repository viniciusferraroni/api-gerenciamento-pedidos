const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const app = require('../src/app');

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
