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
