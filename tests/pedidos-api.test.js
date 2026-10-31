const request = require('supertest');

const app = require('../src/app');

test('GET /health responde OK', async () => {
  const response = await request(app).get('/health');

  expect(response.status).toBe(200);
  expect(response.body.ok).toBe(true);
});

test('POST /pedidos cadastra um novo pedido', async () => {
  const response = await request(app).post('/pedidos').send({
    cliente: 'Carlos Silva',
    tipo: 'entrega',
    valor: 150,
    prioridade: 'normal'
  });

  expect(response.status).toBe(201);
  expect(response.body.cliente).toBe('Carlos Silva');
  expect(response.body.status).toBe('recebido');
  expect(response.body.prioridade).toBe('normal');
});

test('GET /pedidos retorna a lista de pedidos', async () => {
  const response = await request(app).get('/pedidos');

  expect(response.status).toBe(200);
  expect(response.body).toEqual(expect.any(Array));
});

test('GET /pedidos/:id retorna um pedido específico', async () => {
  const response = await request(app).get('/pedidos/1');

  expect(response.status).toBe(200);
  expect(response.body.id).toBe(1);
});

test('PATCH /pedidos/:id/status atualiza o status', async () => {
  const response = await request(app).patch('/pedidos/1/status').send({ status: 'cancelado' });

  expect(response.status).toBe(200);
  expect(response.body.status).toBe('cancelado');
});

test('POST /pedidos rejeita valor inválido', async () => {
  const response = await request(app).post('/pedidos').send({
    cliente: 'João',
    tipo: 'retirada',
    valor: 0,
    prioridade: 'normal'
  });

  expect(response.status).toBe(400);
  expect(response.body.message).toMatch(/maior que zero/);
});

test('PATCH /pedidos/:id/status rejeita status inválido', async () => {
  const response = await request(app).patch('/pedidos/1/status').send({ status: 'invalido' });

  expect(response.status).toBe(400);
  expect(response.body.message).toMatch(/status inválido/);
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
    expect(response.status).toBe(400);
    expect(typeof response.body.message).toBe('string');
  }
});

test('POST /pedidos normaliza espaços e caixa nos campos reconhecidos', async () => {
  const response = await request(app).post('/pedidos').send({
    cliente: '  Ana  ',
    tipo: ' ENTREGA ',
    valor: 55,
    prioridade: ' ALTA '
  });

  expect(response.status).toBe(201);
  expect(response.body.cliente).toBe('Ana');
  expect(response.body.tipo).toBe('entrega');
  expect(response.body.prioridade).toBe('alta');
});

test('PATCH /pedidos/:id/status permite avanço válido e bloqueia saltos e estados finais', async () => {
  const created = await request(app).post('/pedidos').send({
    cliente: 'Fluxo de status',
    tipo: 'retirada',
    valor: 80,
    prioridade: 'urgente'
  });
  const id = created.body.id;

  expect(created.status).toBe(201);
  expect((await request(app).patch(`/pedidos/${id}/status`).send({ status: 'enviado' })).status).toBe(400);
  expect((await request(app).patch(`/pedidos/${id}/status`).send({ status: 'em_preparacao' })).status).toBe(200);
  expect((await request(app).patch(`/pedidos/${id}/status`).send({ status: 'enviado' })).status).toBe(200);
  expect((await request(app).patch(`/pedidos/${id}/status`).send({ status: 'entregue' })).status).toBe(200);
  expect((await request(app).patch(`/pedidos/${id}/status`).send({ status: 'cancelado' })).status).toBe(400);
});

test('GET /pedidos/:id responde 404 para IDs inexistentes ou malformados', async () => {
  for (const id of ['999999', '1.5', 'abc', '0']) {
    const response = await request(app).get(`/pedidos/${id}`);
    expect(response.status).toBe(404);
    expect(typeof response.body.message).toBe('string');
  }
});

test('corpo JSON malformado retorna erro explicativo em JSON', async () => {
  const response = await request(app)
    .post('/pedidos')
    .set('Content-Type', 'application/json')
    .send('{"cliente":');

  expect(response.status).toBe(400);
  expect(response.body.message).toBe('Corpo JSON inválido.');
});

test('GET /pedidos filtra por status e prioridade combinados', async () => {
  const created = await request(app).post('/pedidos').send({
    cliente: 'Filtro combinado',
    tipo: 'entrega',
    valor: 99,
    prioridade: 'urgente'
  });
  const response = await request(app).get('/pedidos?status=recebido&prioridade=urgente');

  expect(created.status).toBe(201);
  expect(response.status).toBe(200);
  expect(response.body.some((pedido) => pedido.id === created.body.id)).toBe(true);
  expect(response.body.every((pedido) => pedido.status === 'recebido' && pedido.prioridade === 'urgente')).toBe(true);
});

test('GET /pedidos rejeita filtros desconhecidos com HTTP 400', async () => {
  const invalidStatus = await request(app).get('/pedidos?status=desconhecido');
  const invalidPriority = await request(app).get('/pedidos?prioridade=baixa');

  expect(invalidStatus.status).toBe(400);
  expect(invalidStatus.body.message).toMatch(/status inválido/);
  expect(invalidPriority.status).toBe(400);
  expect(invalidPriority.body.message).toMatch(/prioridade inválida/);
});
