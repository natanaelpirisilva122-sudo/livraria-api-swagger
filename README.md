# Livraria Comunitária — API RESTful com documentação OpenAPI 3.0

Projeto acadêmico desenvolvido em Node.js para demonstrar o uso de um **contrato formal de API** em uma aplicação de Livros e Autores. Nesta etapa, a API da atividade de segurança foi ampliada com uma documentação interativa em Swagger UI. O contrato descreve os dados esperados, os retornos HTTP, os exemplos de requisição e os privilégios necessários para executar cada operação.

A aplicação preserva a divisão entre **rotas, controllers, services, repository e middlewares**, bem como os recursos de **BCrypt**, **JWT** e **RBAC** já existentes. O objetivo não é apenas descrever os endpoints: é permitir que outra pessoa consiga explorá-los e testá-los com clareza, inclusive ao trabalhar com autenticação Bearer.

## 1. Tecnologias e requisitos

- Node.js **18 ou superior** e npm.
- Express para receber as requisições REST.
- `swagger-ui-express` para servir a documentação interativa.
- **OpenAPI Specification 3.0.3** no arquivo `docs/openapi.json`.
- `bcryptjs` para hash de senhas com salt e work factor.
- `jsonwebtoken` para emissão e verificação de JWT.
- `cors` e `dotenv` para integração e configuração.

A persistência didática é feita no arquivo local `database.txt`, criado automaticamente na primeira execução. **Não se trata de um banco de dados de produção**.

## 2. Instalação e execução no Mac, Linux ou Windows

Abra o terminal **dentro da pasta** do projeto. Execute:

```bash
npm install
```

No Mac/Linux, crie o arquivo local de configuração:

```bash
cp .env.example .env
```

No Windows, pode criar uma cópia de `.env.example` chamada `.env` pelo explorador de arquivos.

O arquivo `.env` precisa conter:

```env
PORT=3000
JWT_SECRET=substitua-esta-chave-de-exemplo-por-uma-chave-aleatoria-forte
JWT_EXPIRES_IN=2h
BCRYPT_ROUNDS=10
```

**Importante:** para um projeto real, substitua `JWT_SECRET` por uma chave aleatória privada. A aplicação exige uma chave de pelo menos 32 caracteres. O arquivo `.env` não deve ir para o GitHub; somente o `.env.example` deve ser enviado.

Para iniciar:

```bash
npm start
```

No terminal, serão apresentados os endereços da aplicação. Abra:

| Recurso | Endereço |
|---|---|
| **Swagger UI** | `http://localhost:3000/docs` |
| **Contrato OpenAPI JSON** | `http://localhost:3000/docs/api.json` |
| Alternativa para o JSON | `http://localhost:3000/api-docs.json` |
| Interface HTML da atividade anterior | Abrir `index.html` no navegador |
| API | `http://localhost:3000/api/v1` |

A interface Swagger **não depende do arquivo `index.html`**. Para avaliar esta atividade, use principalmente `/docs`.

## 3. Como utilizar o botão Authorize

O Swagger diferencia operações públicas de operações protegidas. As rotas que exigem token apresentam o cadeado e referenciam o esquema `BearerAuth`, configurado como `type: http`, `scheme: bearer` e `bearerFormat: JWT`.

**Passo a passo do teste interativo:**

1. Abra **`http://localhost:3000/docs`** com o servidor em execução.
2. Encontre **`POST /api/v1/auth/login`** e clique em **Try it out**.
3. Envie as credenciais de um dos usuários de teste, por exemplo:

   ```json
   {
     "email": "admin@livraria.com",
     "senha": "admin123"
   }
   ```

4. Clique em **Execute**. Uma resposta `200 OK` incluirá o objeto `usuario` e o campo `token`.
5. **Copie apenas o valor de `token`** (a sequência JWT, sem aspas).
6. No alto da documentação, clique em **Authorize** e cole o JWT no campo `BearerAuth`. **Não escreva `Bearer` antes do token:** o Swagger adiciona o prefixo automaticamente.
7. Confirme em **Authorize** e feche a janela. Agora execute uma operação protegida com **Try it out → Execute**.
8. Para testar as diferenças de permissão, faça login como Leitor e repita o teste em `POST /api/v1/autores` ou `POST /api/v1/livros`. O retorno deve ser **403 Forbidden**.
9. Clique novamente em **Authorize → Logout** para retirar o token do Swagger. Sem token, uma rota protegida deve retornar **401 Unauthorized**.

O botão **Authorize não faz o login por conta própria**. O login é feito na rota documentada; depois, o usuário copia o JWT retornado para o campo de autorização.

### Contas de demonstração

| Perfil | E-mail | Senha |
|---|---|---|
| `ADMIN` | `admin@livraria.com` | `admin123` |
| `USER` | `leitor@gmail.com` | `leitor123` |

Os usuários de demonstração são criados na primeira execução. A senha é gravada no arquivo local **somente na forma de hash BCrypt**. O cadastro público de novas contas concede exclusivamente o perfil `USER`.

## 4. Matriz de endpoints documentados

| Método | Endpoint | Acesso | Sucesso | Falhas previstas |
|---|---|---|---|---|
| GET | `/api/v1/livros` | Público | 200 | 500 |
| GET | `/api/v1/livros/{id}` | Público | 200 | 400, 404 |
| POST | `/api/v1/auth/register` | Público | 201 | 400, 409 |
| POST | `/api/v1/auth/login` | Público | 200 | 400, 401 |
| POST | `/api/v1/livros/{id}/comentarios` | USER ou ADMIN | 201 | 400, 401, 404 |
| POST | `/api/v1/autores` | ADMIN | 201 | 400, 401, 403 |
| POST | `/api/v1/livros` | ADMIN | 201 | 400, 401, 403, 404 |
| GET | `/api/v1/autores` | Público | 200 | 500 |

**Observações:** a listagem pública de autores já existia na aplicação e também foi documentada. O código 404 na criação de livros informa que o autor referenciado não foi localizado. Para entradas inválidas foi adotado **400 Bad Request**, uma das alternativas previstas no enunciado (400 ou 422).

### Exemplos dos contratos de entrada

Cadastro de usuário (`POST /api/v1/auth/register`):

```json
{
  "nome": "Ana Martins",
  "email": "ana.martins@gmail.com",
  "senha": "senhaSegura123"
}
```

Criação de autor (`POST /api/v1/autores`, ADMIN):

```json
{
  "nome": "Clarice Lispector",
  "nacionalidade": "Brasileira"
}
```

Criação de livro (`POST /api/v1/livros`, ADMIN):

```json
{
  "titulo": "A Hora da Estrela",
  "ano": 1977,
  "autor_id": 1
}
```

Comentário (`POST /api/v1/livros/{id}/comentarios`, usuário autenticado):

```json
{
  "texto": "Uma leitura emocionante e inesquecível."
}
```

O identificador `autor_id` deve corresponder a um autor realmente existente; consulte a rota pública `GET /api/v1/autores`. Todos os **schemas**, seus campos `required`, tipos, descrições e exemplos estão no contrato `docs/openapi.json` e são exibidos pelo Swagger UI.

## 5. Significado dos códigos HTTP

- **200 OK:** consulta realizada ou login válido.
- **201 Created:** usuário, autor, livro ou comentário cadastrado.
- **400 Bad Request:** corpo incompleto, formato inválido, campo obrigatório ausente ou ID inválido.
- **401 Unauthorized:** credenciais inválidas, ausência de token, token corrompido ou expirado.
- **403 Forbidden:** token válido de usuário sem a permissão `ADMIN` necessária.
- **404 Not Found:** livro não encontrado ou autor inexistente ao criar livro.
- **409 Conflict:** tentativa de cadastrar endereço de e-mail já existente.
- **500 Internal Server Error:** falha imprevista durante o processamento.

Os erros são padronizados com a propriedade `erro`. Exemplo:

```json
{
  "erro": "Acesso proibido: privilégio de ADMIN exigido."
}
```

## 6. Organização do projeto

```text
livraria-api-swagger/
├── controllers/           # Entrada e resposta HTTP
├── docs/
│   └── openapi.json       # Contrato OpenAPI 3.0.3
├── middlewares/           # JWT, RBAC e tratamento de erros
├── repositories/          # Persistência local da aplicação
├── routes/                # Endpoints e regras de acesso
├── services/              # Regras de negócio e autenticação
├── utils/                 # Validações de entrada
├── scripts/
│   └── validar-openapi.js
├── tests/
│   └── api.test.js
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── README.md
└── server.js
```

O documento OpenAPI foi mantido em um arquivo separado, facilitando a revisão do contrato sem misturar exemplos JSON com a implementação das regras de negócio. A rota `/docs/api.json` entrega o conteúdo desse mesmo arquivo, evitando divergências entre a versão visual e a especificação bruta.

## 7. Verificações e testes

Depois de executar `npm install`, use:

```bash
npm run check:openapi
npm test
```

O primeiro comando confere as sete operações da matriz, os schemas obrigatórios, o esquema de segurança e a presença dos códigos de retorno. O segundo inicia uma instância temporária da aplicação, exercita a interface e a API, e valida os principais cenários de sucesso e falha. Os testes utilizam uma pasta temporária, sem modificar os dados que você cadastrou manualmente.

Também é possível conferir a especificação pelo terminal:

```bash
curl http://localhost:3000/docs/api.json
```

**Para entregar no GitHub:** envie os arquivos e pastas do código-fonte descompactado, inclusive `docs/openapi.json`, `tests/`, `.env.example` e `README.md`. Não envie `node_modules/`, `.env` ou `database.txt`. O professor deve conseguir baixar o repositório, executar `npm install`, configurar `.env`, iniciar com `npm start` e abrir `/docs`.

## Considerações finais

A documentação explicita as obrigações de cada cliente da API: quais dados enviar, como interpretar as respostas e em quais situações o token JWT é necessário. Assim, a aplicação preserva as restrições de segurança implementadas anteriormente e passa a fornecer um contrato verificável e interativo para integração com outros sistemas e para a avaliação acadêmica.
