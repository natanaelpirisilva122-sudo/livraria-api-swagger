const repository = require('../repositories/LivrariaRepository');
const { validarObjeto, textoObrigatorio, falha } = require('../utils/validacao');

class AutorService {
  listarTodos() {
    return repository.listarAutores();
  }

  criar(dados) {
    validarObjeto(dados);
    const nome = textoObrigatorio(dados.nome, 'nome');
    let nacionalidade = 'Não informada';
    if (dados.nacionalidade !== undefined) {
      nacionalidade = textoObrigatorio(dados.nacionalidade, 'nacionalidade');
    }

    return repository.salvarAutor({ nome, nacionalidade });
  }
}

module.exports = new AutorService();
