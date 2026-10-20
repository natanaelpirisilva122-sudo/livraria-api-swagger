// Testes de integração: npm test
// Usa a própria API Express e o fetch nativo do Node >=18, sem dependências extras.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Ambiente isolado para não tocar no database.txt usado manualmente.
const diretorioOriginal = process.cwd();
const temporario = fs.mkdtempSync(path.join(os.tmpdir(), 'livraria-test-'));
process.chdir(temporario);
process.env.JWT_SECRET = 'jwt-de-teste-com-mais-de-trinta-e-dois-caracteres-123';
process.env.BCRYPT_ROUNDS = '4'; // acelera testes; produção usa BCRYPT_ROUNDS=10

const app = require('../server');
const authService = require('../services/AuthService');
const repository = require('../repositories/LivrariaRepository');

const json = (response) => response.json();

async function requisicao(base, url, metodo='GET', dados, token) {
  const headers = {};
  if (dados !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${base}${url}`, {method:metodo,headers,body:dados === undefined ? undefined : JSON.stringify(dados)});
}

test('Swagger UI, especificação OpenAPI e matriz de segurança da Livraria', async t => {
  await authService.garantirUsuariosIniciais();
  const server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  let adminToken, userToken, autorId, livroId;
  try {
    await t.test('GET /docs abre interface Swagger', async () => {
      const r = await requisicao(base,'/docs');
      assert.equal(r.status,200);
      assert.match(await r.text(),/swagger-ui/i);
    });
    await t.test('GET /docs/api.json fornece contrato OpenAPI 3.0', async () => {
      const r = await requisicao(base,'/docs/api.json');
      assert.equal(r.status,200);
      const spec = await json(r);
      assert.equal(spec.openapi,'3.0.3');
      assert.equal(spec.components.securitySchemes.BearerAuth.scheme,'bearer');
      assert.ok(spec.paths['/api/v1/livros/{id}/comentarios'].post.responses['401']);
    });
    await t.test('Catálogo e autores são públicos; IDs não encontrados geram 404', async () => {
      const lista = await requisicao(base,'/api/v1/livros');
      assert.equal(lista.status,200);
      assert.ok(Array.isArray(await json(lista)));
      assert.equal((await requisicao(base,'/api/v1/livros/1')).status,200);
      assert.equal((await requisicao(base,'/api/v1/autores')).status,200);
      assert.equal((await requisicao(base,'/api/v1/livros/99999')).status,404);
      assert.equal((await requisicao(base,'/api/v1/livros/abc')).status,400);
    });
    await t.test('Cadastro: 201, 400, 409 e perfil USER obrigatório', async () => {
      const cadastro = {nome:'Ana Martins', email:'ana@gmail.com', senha:'senhaTeste123',role:'ADMIN'};
      const r = await requisicao(base,'/api/v1/auth/register','POST',cadastro);
      assert.equal(r.status,201);
      const usuario = await json(r);
      assert.equal(usuario.role,'USER');
      assert.ok(!('senha_hash' in usuario));
      assert.match(repository.buscarUsuarioPorEmail('ana@gmail.com').senha_hash,/^\$2[aby]\$/);
      assert.equal((await requisicao(base,'/api/v1/auth/register','POST',cadastro)).status,409);
      assert.equal((await requisicao(base,'/api/v1/auth/register','POST',{nome:'Ana',email:'email-ruim',senha:'123456'})).status,400);
    });
    await t.test('Login: 200, 400 e 401; tokens USER e ADMIN', async () => {
      const admin = await requisicao(base,'/api/v1/auth/login','POST',{email:'admin@livraria.com',senha:'admin123'});
      assert.equal(admin.status,200);
      const dadosAdmin = await json(admin);
      assert.equal(dadosAdmin.usuario.role,'ADMIN');
      adminToken = dadosAdmin.token;
      const leitor = await requisicao(base,'/api/v1/auth/login','POST',{email:'leitor@gmail.com',senha:'leitor123'});
      assert.equal(leitor.status,200);
      const dadosLeitor = await json(leitor);
      assert.equal(dadosLeitor.usuario.role,'USER');
      userToken = dadosLeitor.token;
      assert.equal((await requisicao(base,'/api/v1/auth/login','POST',{email:'leitor@gmail.com',senha:'errada'})).status,401);
      assert.equal((await requisicao(base,'/api/v1/auth/login','POST',{email:'',senha:''})).status,400);
    });
    await t.test('ADMIN pode criar autor; sem JWT 401 e USER 403', async () => {
      const url='/api/v1/autores', corpo={nome:'Clarice Lispector',nacionalidade:'Brasileira'};
      assert.equal((await requisicao(base,url,'POST',corpo)).status,401);
      assert.equal((await requisicao(base,url,'POST',corpo,userToken)).status,403);
      assert.equal((await requisicao(base,url,'POST',{nome:''},adminToken)).status,400);
      const r=await requisicao(base,url,'POST',corpo,adminToken);
      assert.equal(r.status,201);
      autorId=(await json(r)).id;
    });
    await t.test('ADMIN pode criar livro; USER 403, autor inexistente 404', async () => {
      const url='/api/v1/livros', corpo={titulo:'A Hora da Estrela',ano:1977,autor_id:autorId};
      assert.equal((await requisicao(base,url,'POST',corpo,userToken)).status,403);
      assert.equal((await requisicao(base,url,'POST',corpo)).status,401);
      assert.equal((await requisicao(base,url,'POST',{...corpo,ano:'ano inválido'},adminToken)).status,400);
      assert.equal((await requisicao(base,url,'POST',{...corpo,autor_id:999999},adminToken)).status,404);
      const r=await requisicao(base,url,'POST',corpo,adminToken);
      assert.equal(r.status,201);
      livroId=(await json(r)).id;
    });
    await t.test('Comentários: anônimo 401, token corrompido 401, validação 400, USER 201', async () => {
      const url=`/api/v1/livros/${livroId}/comentarios`;
      assert.equal((await requisicao(base,url,'POST',{texto:'Gostei'})).status,401);
      assert.equal((await requisicao(base,url,'POST',{texto:'Gostei'},'token-invalido')).status,401);
      assert.equal((await requisicao(base,url,'POST',{texto:''},userToken)).status,400);
      assert.equal((await requisicao(base,'/api/v1/livros/99999/comentarios','POST',{texto:'Gostei'},userToken)).status,404);
      const r=await requisicao(base,url,'POST',{texto:'Leitura emocionante.'},userToken);
      assert.equal(r.status,201);
      const comentario=await json(r);
      assert.equal(comentario.autor_nome,'Leitor');
      const livro=await json(await requisicao(base,`/api/v1/livros/${livroId}`));
      assert.ok(livro.comentarios.some(item=>item.texto==='Leitura emocionante.'));
    });
  } finally {
    await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));
    process.chdir(diretorioOriginal);
    fs.rmSync(temporario,{recursive:true,force:true});
  }
});
