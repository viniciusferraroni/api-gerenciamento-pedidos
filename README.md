# API de Gerenciamento de Pedidos

Estrutura inicial de uma API REST em Node.js e Express, organizada em rotas,
controllers e services.

## Instalação e execução

```bash
npm install
npm start
```

Por padrão, a API inicia em `http://localhost:3000`. A porta pode ser alterada
pela variável de ambiente `PORT`.

## Rotas previstas

| Método | Caminho | Responsabilidade |
| --- | --- | --- |
| `POST` | `/pedidos` | Encaminhar a criação de um pedido |
| `GET` | `/pedidos` | Encaminhar a listagem de pedidos |
| `GET` | `/pedidos/:id` | Encaminhar a consulta de um pedido |
| `PATCH` | `/pedidos/:id/status` | Encaminhar a atualização de status |

As rotas já são encaminhadas pelos controllers para os métodos correspondentes
do service. Esses métodos ainda são stubs e respondem com HTTP 501; cadastro,
consultas, atualização e validações ainda precisam ser implementados.

Quando implementados, os métodos do service devem receber os dados do pedido,
nenhum argumento para listar, o identificador para consultar e identificador
mais status para atualizar. A consulta e a atualização devem retornar `null`
quando o pedido não existir, permitindo ao controller responder HTTP 404.

O middleware da aplicação responde em JSON para rotas inexistentes e erros.
Dados inválidos devem ser tratados pela implementação do service com erro
`statusCode` 400 e uma mensagem explicativa.
