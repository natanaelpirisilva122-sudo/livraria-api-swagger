const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const repository = require('../repositories/LivrariaRepository');
const { falha, validarObjeto, textoObrigatorio, emailValido } = require('../utils/validacao');

const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

class AuthService {
  async registrar(dados) {
    validarObjeto(dados);
    const nome = textoObrigatorio(dados.nome, 'nome');
    const email = emailValido(dados.email);
    const senha = textoObrigatorio(dados.senha, 'senha');

    if (senha.length < 6) {
      throw falha('A senha deve possuir pelo menos 6 caracteres.');
    }
    if (repository.buscarUsuarioPorEmail(email)) {
      throw falha('E-mail já cadastrado no sistema.', 409);
    }

    const senha_hash = await bcrypt.hash(senha, SALT_ROUNDS);
    const novoUsuario = repository.salvarUsuario({
      nome,
      email,
      senha_hash,
      role: 'USER' // Nunca aceitar role informado em registro público.
    });

    const { senha_hash: _, ...usuarioRetorno } = novoUsuario;
    return usuarioRetorno;
  }

  async login(dados) {
    validarObjeto(dados);
    const email = emailValido(dados.email);
    const senha = textoObrigatorio(dados.senha, 'senha');

    const usuario = repository.buscarUsuarioPorEmail(email);
    if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash))) {
      throw falha('Credenciais inválidas.', 401);
    }

    const token = jwt.sign(
      { sub: usuario.id, nome: usuario.nome, role: usuario.role },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
      token
    };
  }

  async garantirUsuariosIniciais() {
    const iniciais = [
      { nome: 'Admin', email: 'admin@livraria.com', senha: 'admin123', role: 'ADMIN' },
      { nome: 'Leitor', email: 'leitor@gmail.com', senha: 'leitor123', role: 'USER' }
    ];

    for (const usuario of iniciais) {
      if (!repository.buscarUsuarioPorEmail(usuario.email)) {
        repository.salvarUsuario({
          nome: usuario.nome,
          email: usuario.email,
          senha_hash: await bcrypt.hash(usuario.senha, SALT_ROUNDS),
          role: usuario.role
        });
      }
    }
  }
}

module.exports = new AuthService();
