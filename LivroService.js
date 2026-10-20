const repository = require('../repositories/LivrariaRepository');
const { validarObjeto, textoObrigatorio, inteiroPositivo, falha } = require('../utils/validacao');

class LivroService {
  listarTodos() {
    const livros = repository.listarLivros();
    const autores = repository.listarAutores();

    return livros.map(livro => {
      const autor = autores.find(a => a.id === livro.autor_id);
      return { ...livro, autor_nome: autor ? autor.nome : 'Autor Desconhecido' };
    });
  }

  buscarPorId(id) {
    const livroId = inteiroPositivo(id, 'id');
    const livro = repository.buscarLivroPorId(livroId);
    if (!livro) throw falha('Livro não localizado.', 404);

    const autor = repository.buscarAutorPorId(livro.autor_id);
    return { ...livro, autor_nome: autor ? autor.nome : 'Autor Desconhecido' };
  }

  criar(dados) {
    validarObjeto(dados);
    const titulo = textoObrigatorio(dados.titulo, 'titulo');
    const autor_id = inteiroPositivo(dados.autor_id, 'autor_id');
    const ano = dados.ano === undefined ? new Date().getFullYear() : inteiroPositivo(dados.ano, 'ano', 9999);

    const autor = repository.buscarAutorPorId(autor_id);
    if (!autor) throw falha('O autor informado não existe.', 404);

    return repository.salvarLivro({ titulo, ano, autor_id });
  }

  adicionarComentario(livroId, dados) {
    validarObjeto(dados);
    const texto = textoObrigatorio(dados.texto, 'texto');
    const livro = this.buscarPorId(livroId);
    return repository.adicionarComentario(livro.id, {
      autor_nome: dados.usuario.nome,
      texto
    });
  }
}

module.exports = new LivroService();
