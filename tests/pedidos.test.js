const request = require('supertest');
const app = require('../src/app');
const pedidosService = require('../src/services/pedidosService');

const pedidoValido = {
  cliente: 'Ana Souza',
  tipo: 'entrega',
  valor: 35,
  prioridade: 'normal',
};

async function criarPedido(overrides = {}) {
  const response = await request(app)
    .post('/pedidos')
    .send({ ...pedidoValido, ...overrides });

  expect(response.status).toBe(201);
  return response.body;
}

describe('POST /pedidos', () => {
  test('cria pedido normalizado com status inicial recebido', async () => {
    const response = await request(app).post('/pedidos').send({
      ...pedidoValido,
      cliente: '  Ana Souza  ',
      tipo: ' ENTREGA ',
      prioridade: ' ALTA ',
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(expect.objectContaining({
      id: expect.any(Number),
      cliente: 'Ana Souza',
      tipo: 'entrega',
      valor: 35,
      prioridade: 'alta',
      status: 'recebido',
    }));
  });

  test.each([
    ['cliente vazio', { cliente: '   ' }],
    ['tipo inválido', { tipo: 'balcão' }],
    ['valor zero', { valor: 0 }],
    ['valor textual', { valor: '35' }],
    ['prioridade inválida', { prioridade: 'baixa' }],
  ])('rejeita %s com HTTP 400', async (_caso, overrides) => {
    const response = await request(app)
      .post('/pedidos')
      .send({ ...pedidoValido, ...overrides });

    expect(response.status).toBe(400);
    expect(response.body.mensagem).toEqual(expect.any(String));
    expect(response.body.mensagem.length).toBeGreaterThan(0);
  });

  test('rejeita valor não finito e JSON malformado', async () => {
    const valorNaoFinito = await request(app)
      .post('/pedidos')
      .set('Content-Type', 'application/json')
      .send('{"cliente":"Ana","tipo":"entrega","valor":1e309,"prioridade":"normal"}');
    const jsonMalformado = await request(app)
      .post('/pedidos')
      .set('Content-Type', 'application/json')
      .send('{"cliente":');

    expect(valorNaoFinito.status).toBe(400);
    expect(valorNaoFinito.body.mensagem).toMatch(/maior que zero/);
    expect(jsonMalformado.status).toBe(400);
    expect(jsonMalformado.body.mensagem).toEqual(expect.any(String));
  });
});

describe('GET /pedidos', () => {
  test('lista pedidos cadastrados como uma lista JSON', async () => {
    const criado = await criarPedido();
    const response = await request(app).get('/pedidos');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toContainEqual(expect.objectContaining({ id: criado.id }));
  });
});

describe('GET /pedidos/:id', () => {
  test('consulta pedido existente e responde 404 para IDs inexistentes ou inválidos', async () => {
    const criado = await criarPedido();
    const encontrado = await request(app).get(`/pedidos/${criado.id}`);
    const inexistentes = await Promise.all(
      ['999999', '0', '1.5', 'abc'].map((id) => request(app).get(`/pedidos/${id}`)),
    );

    expect(encontrado.status).toBe(200);
    expect(encontrado.body).toEqual(expect.objectContaining({ id: criado.id }));
    for (const response of inexistentes) {
      expect(response.status).toBe(404);
      expect(response.body.mensagem).toEqual(expect.any(String));
    }
  });
});

describe('PATCH /pedidos/:id/status', () => {
  test('permite as transições válidas até a entrega', async () => {
    const criado = await criarPedido();

    for (const status of ['em_preparacao', 'enviado', 'entregue']) {
      const response = await request(app)
        .patch(`/pedidos/${criado.id}/status`)
        .send({ status });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(status);
    }
  });

  test('permite cancelamento antes do envio e impede transições de estado final', async () => {
    const criado = await criarPedido();
    const cancelado = await request(app)
      .patch(`/pedidos/${criado.id}/status`)
      .send({ status: ' CANCELADO ' });
    const transicaoFinal = await request(app)
      .patch(`/pedidos/${criado.id}/status`)
      .send({ status: 'em_preparacao' });

    expect(cancelado.status).toBe(200);
    expect(cancelado.body.status).toBe('cancelado');
    expect(transicaoFinal.status).toBe(400);
  });

  test('rejeita status inválido, salto de etapa, corpo inválido e pedido inexistente', async () => {
    const criado = await criarPedido();
    const statusInvalido = await request(app)
      .patch(`/pedidos/${criado.id}/status`)
      .send({ status: 'concluido' });
    const salto = await request(app)
      .patch(`/pedidos/${criado.id}/status`)
      .send({ status: 'enviado' });
    const corpoInvalido = await request(app)
      .patch(`/pedidos/${criado.id}/status`)
      .send(null);
    const inexistente = await request(app)
      .patch('/pedidos/999999/status')
      .send({ status: 'recebido' });

    expect(statusInvalido.status).toBe(400);
    expect(statusInvalido.body.mensagem).toMatch(/status deve ser um dos valores/);
    expect(salto.status).toBe(400);
    expect(salto.body.mensagem).toMatch(/transição/);
    expect(corpoInvalido.status).toBe(400);
    expect(corpoInvalido.body.mensagem).toEqual(expect.any(String));
    expect(inexistente.status).toBe(404);
    expect(inexistente.body.mensagem).toEqual(expect.any(String));
  });
});

test('responde 404 em JSON para uma rota inexistente', async () => {
  const response = await request(app).get('/rota-inexistente');

  expect(response.status).toBe(404);
  expect(response.body.mensagem).toEqual(expect.any(String));
});

test('registra erros inesperados e responde HTTP 500 sem expor detalhes internos', async () => {
  const erroInterno = new Error('Falha interna simulada.');
  const listarPedidos = jest.spyOn(pedidosService, 'listarPedidos').mockRejectedValue(erroInterno);
  const registrarErro = jest.spyOn(console, 'error').mockImplementation(() => {});

  try {
    const response = await request(app).get('/pedidos');

    expect(response.status).toBe(500);
    expect(response.body.mensagem).toBe('Erro interno do servidor.');
    expect(response.body.mensagem).not.toContain('Falha interna simulada');
    expect(registrarErro).toHaveBeenCalledWith(erroInterno);
  } finally {
    listarPedidos.mockRestore();
    registrarErro.mockRestore();
  }
});
