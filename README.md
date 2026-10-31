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
| `GET` | `/pedidos` | Listar os pedidos cadastrados (HTTP 200) |
| `GET` | `/pedidos/:id` | Consultar um pedido (HTTP 200 ou 404) |
| `PATCH` | `/pedidos/:id/status` | Atualizar o status (HTTP 200, 400 ou 404) |

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
`{ "mensagem": "..." }`. Erros inesperados respondem HTTP 500 sem expor detalhes
internos.

### Consultar e atualizar pedidos

`GET /pedidos` responde com uma lista JSON, vazia quando não há pedidos.
`GET /pedidos/:id` responde com o pedido encontrado ou HTTP 404 quando o
identificador não existe.

`PATCH /pedidos/:id/status` recebe o novo status, por exemplo:

```json
{
  "status": "em_preparacao"
}
```

Os status aceitos são `recebido`, `em_preparacao`, `enviado`, `entregue` e
`cancelado`. Espaços externos e diferenças entre maiúsculas e minúsculas são
normalizados como no tipo e na prioridade. Transições permitidas:

| Status atual | Próximos status permitidos |
| --- | --- |
| `recebido` | `em_preparacao`, `cancelado` |
| `em_preparacao` | `enviado`, `cancelado` |
| `enviado` | `entregue` |
| `entregue` | Nenhum (estado final) |
| `cancelado` | Nenhum (estado final) |

Status inválido ou transição não permitida respondem HTTP 400. Um identificador
inexistente responde HTTP 404.

## Testes

Execute `npm test` para verificar o cadastro, as normalizações, as validações,
a listagem, a consulta, as transições de status e o tratamento de erros.
Rotas inexistentes e erros são respondidos em JSON.

## Uso de IA

Foi utilizado o Copilot como apoio para implementar a listagem, a consulta por
identificador e a atualização de status, além de criar testes e documentar as
transições. Foi aceita e adaptada a sugestão de permitir cancelamento antes do
envio e tratar pedidos entregues ou cancelados como estados finais. A
implementação e seus testes foram revisados neste projeto; quem entrega o
trabalho permanece responsável por compreender, validar e justificar o código.
