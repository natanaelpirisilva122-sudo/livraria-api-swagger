const assert = require('node:assert/strict');
const spec = require('../docs/openapi.json');

assert.equal(spec.openapi, '3.0.3');
assert.equal(spec.components.securitySchemes.BearerAuth.type, 'http');
assert.equal(spec.components.securitySchemes.BearerAuth.scheme, 'bearer');

const obrigatorias = [
  ['GET', '/api/v1/livros'],
  ['GET', '/api/v1/livros/{id}'],
  ['POST', '/api/v1/auth/register'],
  ['POST', '/api/v1/auth/login'],
  ['POST', '/api/v1/livros/{id}/comentarios'],
  ['POST', '/api/v1/autores'],
  ['POST', '/api/v1/livros']
];

for (const [metodo, rota] of obrigatorias) {
  const op = spec.paths[rota]?.[metodo.toLowerCase()];
  assert.ok(op, `Operação não documentada: ${metodo} ${rota}`);
  assert.ok(op.summary && op.description, `${metodo} ${rota}: descrição faltando`);
  assert.ok(op.responses?.[metodo === 'GET' || rota.endsWith('/login') ? '200' : '201']);
  if (metodo === 'POST') {
    assert.ok(op.requestBody?.content?.['application/json']?.schema, 'Corpo JSON não documentado');
  }
  if (['/api/v1/livros/{id}/comentarios', '/api/v1/autores', '/api/v1/livros'].includes(rota) && metodo === 'POST') {
    assert.deepEqual(op.security, [{ BearerAuth: [] }], 'BearerAuth obrigatório');
    assert.ok(op.responses['401'], 'Resposta 401 ausente');
  }
  if (metodo === 'POST' && ['/api/v1/autores', '/api/v1/livros'].includes(rota)) {
    assert.ok(op.responses['403'], 'Resposta 403 ausente');
  }
}

for (const nome of ['RegisterRequest','LoginRequest','AutorRequest','LivroRequest','ComentarioRequest']) {
  const s = spec.components.schemas[nome];
  assert.ok(s.required && s.required.length > 0, `Sem campos required: ${nome}`);
  for (const campo of s.required) assert.ok(s.properties[campo]?.type, `${nome}.${campo} sem tipo primitivo`);
}
console.log('Contrato OpenAPI 3.0: 7 rotas obrigatórias, BearerAuth, códigos e schemas verificados.');
