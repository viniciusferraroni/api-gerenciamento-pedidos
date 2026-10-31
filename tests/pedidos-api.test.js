const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../src/app');

test('GET /health responde OK', async () => {
  const response = await request(app).get('/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
});

test('POST /pedidos cadastra um novo pedido', async () => {
  const response = await request(app).post('/pedidos').send({
    cliente: 'Carlos Silva',
    tipo: 'entrega',
    valor: 150,
    prioridade: 'normal'
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.cliente, 'Carlos Silva');
  assert.equal(response.body.status, 'recebido');
  assert.equal(response.body.prioridade, 'normal');
});

test('GET /pedidos retorna a lista de pedidos', async () => {
  const response = await request(app).get('/pedidos');

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body));
});

test('GET /pedidos/:id retorna um pedido específico', async () => {
  const response = await request(app).get('/pedidos/1');

  assert.equal(response.status, 200);
  assert.equal(response.body.id, 1);
});

test('PATCH /pedidos/:id/status atualiza o status', async () => {
  const response = await request(app).patch('/pedidos/1/status').send({ status: 'cancelado' });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'cancelado');
});

test('POST /pedidos rejeita valor inválido', async () => {
  const response = await request(app).post('/pedidos').send({
    cliente: 'João',
    tipo: 'retirada',
    valor: 0,
    prioridade: 'normal'
  });

  assert.equal(response.status, 400);
  assert.match(response.body.message, /maior que zero/);
});

test('PATCH /pedidos/:id/status rejeita status inválido', async () => {
  const response = await request(app).patch('/pedidos/1/status').send({ status: 'invalido' });

  assert.equal(response.status, 400);
  assert.match(response.body.message, /status inválido/);
});

test('POST /pedidos rejeita cliente vazio, tipo desconhecido e prioridade inválida', async () => {
  const dadosValidos = {
    cliente: 'João',
    tipo: 'entrega',
    valor: 35,
    prioridade: 'normal'
  };
  const casosInvalidos = [
    { ...dadosValidos, cliente: '   ' },
    { ...dadosValidos, tipo: 'balcão' },
    { ...dadosValidos, prioridade: 'baixa' },
    { ...dadosValidos, valor: '35' }
  ];

  for (const pedido of casosInvalidos) {
    const response = await request(app).post('/pedidos').send(pedido);
    assert.equal(response.status, 400);
    assert.equal(typeof response.body.message, 'string');
  }
});

test('POST /pedidos normaliza espaços e caixa nos campos reconhecidos', async () => {
  const response = await request(app).post('/pedidos').send({
    cliente: '  Ana  ',
    tipo: ' ENTREGA ',
    valor: 55,
    prioridade: ' ALTA '
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.cliente, 'Ana');
  assert.equal(response.body.tipo, 'entrega');
  assert.equal(response.body.prioridade, 'alta');
});

test('PATCH /pedidos/:id/status permite avanço válido e bloqueia saltos e estados finais', async () => {
  const created = await request(app).post('/pedidos').send({
    cliente: 'Fluxo de status',
    tipo: 'retirada',
    valor: 80,
    prioridade: 'urgente'
  });
  const id = created.body.id;

  assert.equal(created.status, 201);
  assert.equal((await request(app).patch(`/pedidos/${id}/status`).send({ status: 'enviado' })).status, 400);
  assert.equal((await request(app).patch(`/pedidos/${id}/status`).send({ status: 'em_preparacao' })).status, 200);
  assert.equal((await request(app).patch(`/pedidos/${id}/status`).send({ status: 'enviado' })).status, 200);
  assert.equal((await request(app).patch(`/pedidos/${id}/status`).send({ status: 'entregue' })).status, 200);
  assert.equal((await request(app).patch(`/pedidos/${id}/status`).send({ status: 'cancelado' })).status, 400);
});

test('GET /pedidos/:id responde 404 para IDs inexistentes ou malformados', async () => {
  for (const id of ['999999', '1.5', 'abc', '0']) {
    const response = await request(app).get(`/pedidos/${id}`);
    assert.equal(response.status, 404);
    assert.equal(typeof response.body.message, 'string');
  }
});

test('corpo JSON malformado retorna erro explicativo em JSON', async () => {
  const response = await request(app)
    .post('/pedidos')
    .set('Content-Type', 'application/json')
    .send('{"cliente":');

  assert.equal(response.status, 400);
  assert.equal(response.body.message, 'Corpo JSON inválido.');
});
