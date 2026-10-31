# API de Gerenciamento de Pedidos

API REST em Node.js e Express para cadastrar, listar, consultar e atualizar pedidos de uma loja pequena. Os dados ficam em memória e são reiniciados quando o servidor para.

## Requisitos

- Node.js 18 ou superior
- npm

## Instalação e execução

```bash
npm ci
npm start
```

A API fica disponível em `http://localhost:3000`. Para verificar se está ativa, acesse `GET /health`.

## Rotas

| Método | Rota | Resultado |
|---|---|---|
| POST | `/pedidos` | Cadastra um pedido e responde `201`. |
| GET | `/pedidos` | Lista os pedidos e aceita filtros opcionais por status e prioridade. |
| GET | `/pedidos/:id` | Consulta um pedido; responde `404` se o ID não existir. |
| PATCH | `/pedidos/:id/status` | Atualiza o status; responde `404` se o pedido não existir. |
| GET | `/health` | Verifica se a API está ativa. |

### Criar um pedido

`POST /pedidos`

```json
{
  "cliente": "Carlos Dias Jesus",
  "tipo": "entrega",
  "valor": 150,
  "prioridade": "normal"
}
```

`cliente` não pode ser vazio. `tipo` deve ser `entrega` ou `retirada`; `prioridade` deve ser `normal`, `alta` ou `urgente`; e `valor` deve ser um número finito maior que zero. Os campos textuais reconhecidos são normalizados removendo espaços externos e usando letras minúsculas nos campos enumerados.

O pedido criado recebe um identificador e começa com status `recebido`.

### Listar e consultar pedidos

- `GET /pedidos` retorna todos os pedidos em uma lista JSON.
- `GET /pedidos?status=recebido` filtra pelo status.
- `GET /pedidos?prioridade=urgente` filtra pela prioridade.
- `GET /pedidos?status=recebido&prioridade=urgente` combina os dois filtros.
- `GET /pedidos/1` retorna o pedido de ID `1`.

Os filtros aceitam apenas os valores documentados para status e prioridade; valores desconhecidos respondem `400` com uma mensagem JSON. IDs inexistentes ou malformados respondem `404` com uma mensagem JSON explicativa.

### Atualizar status

`PATCH /pedidos/:id/status`

```json
{
  "status": "em_preparacao"
}
```

Os status reconhecidos e as transições permitidas são:

```text
recebido -> em_preparacao ou cancelado
em_preparacao -> enviado ou cancelado
enviado -> entregue
entregue -> nenhum próximo status
cancelado -> nenhum próximo status
```

Transições inválidas respondem `400`; um pedido entregue ou cancelado é um estado final.

## Validações e erros

- Dados inválidos respondem `400` com JSON no formato `{ "message": "..." }`.
- JSON malformado também responde `400` com uma mensagem JSON explicativa.
- IDs inexistentes respondem `404`.
- Erros inesperados são registrados no servidor e respondem `500` sem expor detalhes internos.

## Testes

```bash
npm test
```

Os testes automatizados são executados com Jest e cobrem as rotas, validações, erros de entrada, consulta por ID e fluxo de atualização do status. O modo serial é usado porque os pedidos são mantidos em memória durante a execução dos testes.

## Testes manuais com Postman

Importe [`postman/api-pedidos.postman_collection.json`](./postman/api-pedidos.postman_collection.json) no Postman e execute as requisições na ordem da coleção. A variável `baseUrl` usa `http://localhost:3000` por padrão; o ID retornado pela criação é salvo automaticamente como `pedidoId`.

Esta coleção também pode ser executada com Newman, o executor de coleções do Postman:

```bash
npx --yes newman run ./postman/api-pedidos.postman_collection.json
```

As capturas e relatórios desta execução estão em [`evidencias/`](./evidencias/). Os PNGs foram capturados do relatório HTML real do Newman e mostram método, URL, corpo, status e resposta de cada cenário; não são capturas da interface do Postman Desktop. O relatório HTML e o JSON registram a execução completa da coleção. Para entregar capturas especificamente da interface do Postman, importe a coleção no Postman Desktop e faça as capturas por lá.

## Arquitetura

```text
src/
├── app.js
├── server.js
├── controllers/
│   └── pedidoController.js
├── routes/
│   └── pedidoRoutes.js
└── services/
    └── pedidoService.js
tests/
└── pedidos-api.test.js
postman/
└── api-pedidos.postman_collection.json
```

As rotas encaminham as requisições aos controllers, que cuidam das respostas HTTP. O service concentra validações e operações sobre pedidos. O servidor só inicia quando `src/server.js` é executado, permitindo que os testes importem o app sem abrir uma porta.

## Uso de inteligência artificial

Foi usado GitCopilot para auxiliar no desenvolvimento do projeto, além das operações de commit e push.
