# API de Gerenciamento de Pedidos

API REST em Node.js e Express para cadastrar, listar, consultar e atualizar pedidos. A aplicação usa uma arquitetura em camadas e mantém os dados em memória; os pedidos são perdidos quando o processo é encerrado.

## Requisitos

- Node.js 18 ou superior
- npm
- Microsoft Edge para gerar capturas PNG das evidências Newman

## Instalação e execução

Na raiz do projeto, instale as dependências e inicie a API:

```bash
npm ci
npm start
```

O servidor fica disponível em `http://localhost:3000`. A porta padrão pode ser alterada pela variável de ambiente `PORT`. Para encerrar, use `Ctrl+C`.

## Rotas

| Método | Caminho | Sucesso | Descrição |
| --- | --- | --- | --- |
| `POST` | `/pedidos` | `201 Created` | Cadastra um pedido. |
| `GET` | `/pedidos` | `200 OK` | Lista os pedidos cadastrados. |
| `GET` | `/pedidos/:id` | `200 OK` | Consulta um pedido pelo identificador; se não existir, responde `404`. |
| `PATCH` | `/pedidos/:id/status` | `200 OK` | Atualiza o status; dados ou transições inválidos respondem `400`, e pedido inexistente responde `404`. |

### Cadastrar um pedido

Envie `POST http://localhost:3000/pedidos` com `Content-Type: application/json`:

```json
{
  "cliente": "Ana Souza",
  "tipo": "entrega",
  "valor": 35,
  "prioridade": "normal"
}
```

O pedido criado recebe um `id` sequencial e começa com status `recebido`. `cliente` deve ser texto não vazio; espaços nas extremidades são removidos. `valor` deve ser um número finito maior que zero. Os valores aceitos para `tipo` são `entrega` e `retirada`; para `prioridade`, `normal`, `alta` e `urgente`. Tipo e prioridade ignoram espaços externos e diferenças entre maiúsculas e minúsculas, e são armazenados em letras minúsculas.

### Listar e consultar pedidos

- `GET http://localhost:3000/pedidos` retorna uma lista JSON, vazia quando não há pedidos.
- `GET http://localhost:3000/pedidos/1` consulta o pedido de identificador `1`.
- Um identificador sem pedido correspondente responde `404 Not Found`.

### Atualizar status

Envie `PATCH http://localhost:3000/pedidos/1/status`:

```json
{
  "status": "em_preparacao"
}
```

Os status aceitos e as transições implementadas são:

| Status atual | Próximos status permitidos |
| --- | --- |
| `recebido` | `em_preparacao`, `cancelado` |
| `em_preparacao` | `enviado`, `cancelado` |
| `enviado` | `entregue` |
| `entregue` | Nenhum (estado final) |
| `cancelado` | Nenhum (estado final) |

Espaços externos e diferenças entre maiúsculas e minúsculas são normalizados. Status inválido ou transição não permitida responde `400 Bad Request`.

## Validações e erros

- Dados inválidos e JSON malformado respondem `400 Bad Request`.
- Pedido ou rota inexistente responde `404 Not Found`.
- Erros são enviados em JSON no formato `{ "mensagem": "..." }`.
- Erros inesperados são registrados no servidor e respondem `500 Internal Server Error`, sem expor detalhes internos.

## Arquitetura

```text
.
├── server.js
├── src/
│   ├── app.js
│   ├── routes/
│   │   └── pedidosRoutes.js
│   ├── controllers/
│   │   └── pedidosController.js
│   └── services/
│       └── pedidosService.js
├── postman/
│   └── api-pedidos.postman_collection.json
├── scripts/
│   └── gerar-evidencias.js
├── tests/
│   └── pedidos.test.js
└── evidencias/
    └── *.png
```

`server.js` inicia o servidor. `src/app.js` configura o Express e o tratamento de erros. As rotas encaminham as requisições aos controllers, que convertem os resultados em respostas HTTP; o service concentra as validações, regras de transição e operações sobre pedidos.

## Testes automatizados

Execute a suíte com Jest:

```bash
npm test
```

Os testes exercitam os endpoints, validações e normalizações do cadastro, consulta e listagem, transições válidas e inválidas, erros JSON e respostas para recursos inexistentes ou falhas internas. A execução serial evita concorrência sobre o armazenamento em memória.

## Evidências de execução com Newman

Não foi possível obter capturas pela interface do Postman: o aplicativo Desktop não pôde ser baixado neste ambiente e o Postman Web exigiu um login que não foi concluído. Por isso, os PNGs são capturas de relatórios gerados com os dados reais de requisição e resposta da execução do Newman, renderizados pelo Microsoft Edge em modo headless; não são imagens das interfaces do Postman ou do Newman.

Com a API em execução e o Microsoft Edge instalado, abra outro terminal na raiz do projeto e execute:

```bash
npm run evidencias
```

O comando executa a coleção [`postman/api-pedidos.postman_collection.json`](./postman/api-pedidos.postman_collection.json) contra a API e gera PNGs em `evidencias/`. Para usar outra URL base, defina `API_BASE_URL` antes do comando. No PowerShell:

```powershell
$env:API_BASE_URL = "http://localhost:3000"
npm run evidencias
```

As capturas mostram o método, a URL, o corpo enviado quando aplicável, a resposta real e o código HTTP. A coleção cobre criação válida (`201`), validação inválida (`400`), listagem (`200`), pedido inexistente (`404`) e atualização de status (`200`). O identificador usado na atualização é obtido da resposta real de criação. Não são usados resultados simulados. A execução gera `01-cadastrar-pedido-valido-201.png`, `02-rejeitar-pedido-invalido-400.png`, `03-listar-pedidos-200.png`, `04-consultar-pedido-inexistente-404.png` e `05-atualizar-status-do-pedido-criado-200.png` dentro de `evidencias/`.

## Entrega individual

O enunciado solicita pelo menos cinco commits significativos por integrante. Cada pessoa deve registrar suas próprias contribuições com a própria conta e entregar o link do seu repositório junto com o RA. Não conte commits inventados nem commits feitos por outra pessoa.

## Uso de IA

O grupo deve registrar somente o uso real de ferramentas de IA, identificando a ferramenta, a tarefa apoiada e ao menos uma sugestão aceita, modificada ou rejeitada, com a justificativa. Cada integrante deve confirmar e completar sua própria contribuição; esta seção não presume usos anteriores de outras pessoas.

| Etapa | Ferramenta usada | Tarefa apoiada | Sugestão e decisão, com justificativa |
| --- | --- | --- | --- |
| Pessoa 4 (esta etapa) | Assistente Copilot | Atualização da documentação, suíte Jest/Supertest, coleção Newman e geração das capturas a partir de respostas reais. | Sugestão aceita: testar o app Express exportado com Supertest sem abrir um servidor manualmente e usar Newman para executar a coleção e registrar respostas reais, já que o Postman não pôde ser acessado neste ambiente. |
| Demais integrantes | Preencher com a ferramenta realmente usada ou informar que não houve uso. | Registrar a tarefa real apoiada. | Registrar uma sugestão real, a decisão tomada e a justificativa. |
