# API de Gerenciamento de Pedidos

API REST em Node.js e Express, organizada em rotas, controllers e services.

## Instalação e execução

```bash
npm install
npm start
```

Por padrão, a API inicia em `http://localhost:3000`. A porta pode ser alterada
pela variável de ambiente `PORT`.

## Rotas

| Método | Caminho | Responsabilidade |
| --- | --- | --- |
| `POST` | `/pedidos` | Cadastrar um pedido válido (HTTP 201) |
| `GET` | `/pedidos` | Encaminhar a listagem de pedidos |
| `GET` | `/pedidos/:id` | Encaminhar a consulta de um pedido |
| `PATCH` | `/pedidos/:id/status` | Encaminhar a atualização de status |

### Cadastrar pedido

`POST /pedidos` recebe um JSON com `cliente`, `tipo`, `valor` e `prioridade`:

```json
{
  "cliente": "Carlos Silva",
  "tipo": "entrega",
  "valor": 35,
  "prioridade": "normal"
}
```

`cliente` deve ser texto não vazio após remover espaços das extremidades.
`valor` deve ser um número finito maior que zero. Os tipos aceitos são
`entrega` e `retirada`; as prioridades aceitas são `normal`, `alta` e `urgente`.
Tipo e prioridade ignoram espaços externos e diferenças entre maiúsculas e
minúsculas, e são gravados em letras minúsculas. O cliente também é gravado sem
espaços externos. O pedido criado recebe um identificador sequencial e começa
com status `recebido`.

Dados inválidos respondem HTTP 400 com JSON no formato
`{ "mensagem": "..." }`. Os demais métodos do service ainda respondem HTTP 501
até serem implementados.

## Testes

Execute `npm test` para verificar o cadastro, as normalizações e as validações.

Os métodos de listagem, consulta e atualização ainda são stubs. Quando
implementados, a consulta e a atualização devem retornar `null` quando o
pedido não existir, permitindo ao controller responder HTTP 404. O middleware
da aplicação responde em JSON para rotas inexistentes e erros.
