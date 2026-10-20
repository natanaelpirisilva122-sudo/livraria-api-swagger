require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./docs/openapi.json');

const authRoutes = require('./routes/authRoutes');
const livroRoutes = require('./routes/livroRoutes');
const autorRoutes = require('./routes/autorRoutes');
const errorHandler = require('./middlewares/errorMiddleware');
const authService = require('./services/AuthService');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(cors());
app.use(express.json());

// OpenAPI 3.0 em JSON, também disponível fora da interface gráfica.
app.get(['/docs/api.json', '/api-docs.json'], (req, res) => res.json(openapi));

// Swagger UI: o botão Authorize injeta o JWT nas rotas com BearerAuth.
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, {
  customSiteTitle: 'Livraria Comunitária | Documentação da API',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    tryItOutEnabled: true
  }
}));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/livros', livroRoutes);
app.use('/api/v1/autores', autorRoutes);

app.use(errorHandler);

async function iniciar() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Defina JWT_SECRET com pelo menos 32 caracteres no arquivo .env antes de iniciar a API.');
  }

  await authService.garantirUsuariosIniciais();
  app.listen(PORT, () => {
    console.log(`Livraria API rodando em http://localhost:${PORT}`);
    console.log(`Swagger UI: http://localhost:${PORT}/docs`);
    console.log(`OpenAPI JSON: http://localhost:${PORT}/docs/api.json`);
  });
}

if (require.main === module) {
  iniciar().catch(error => {
    console.error('Falha ao iniciar a aplicação:', error.message);
    process.exit(1);
  });
}

module.exports = app;
