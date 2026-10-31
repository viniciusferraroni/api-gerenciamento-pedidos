# API de Gerenciamento de Pedidos

API REST em Node.js + Express para cadastro, listagem, consulta e atualização de status de pedidos.

## Requisitos

- Node.js 18 ou superior
- npm

## Instalação

```bash
npm install
```

## Execução

```bash
npm start
```

A API ficará disponível em `http://localhost:3000`.

## Rotas

### POST /pedidos
Cria um novo pedido.

Exemplo de corpo:

```json
{
  "cliente": "Carlos Dias Jesus",
  "tipo": "entrega",
  "valor": 150,
  "prioridade": "normal"
}
```

### GET /pedidos
Lista todos os pedidos cadastrados.

### GET /pedidos/:id
Retorna um pedido pelo identificador.

### PATCH /pedidos/:id/status
Atualiza o status do pedido.

Exemplo:

```json
{
  "status": "cancelado"
}
```

### GET /health
Verifica se a API está ativa.

## Validações

- `cliente` é obrigatório.
- `tipo` é obrigatório.
- `valor` deve ser numérico e maior que zero.
- `prioridade` aceita: `normal`, `alta` ou `urgente`.
- `status` aceita: `recebido`, `em_preparacao`, `enviado`, `entregue` ou `cancelado`.

## Estrutura do projeto

```text
projeto-pedidos-api/
├── src/
│   ├── app.js
│   └── server.js
├── tests/
│   └── pedidos-api.test.js
├── .gitignore
├── package.json
├── README.md
└── package-lock.json
```

## Testes

```bash
npm test
```

## Observações

- Os dados são armazenados em memória durante a execução da API.
- Não há uso de banco de dados, senhas, tokens ou variáveis de ambiente.
- O projeto foi implementado seguindo um padrão simples de API REST com validações básicas e testes automatizados.
