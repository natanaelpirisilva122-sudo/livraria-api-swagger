function errorHandler(err, req, res, next) {
  const statusCode = Number(err.status || err.statusCode) || 500;
  const codigo = statusCode >= 400 && statusCode < 600 ? statusCode : 500;
  const mensagem = codigo === 500
    ? 'Ocorreu um erro interno no servidor.'
    : (err.message || 'Requisição inválida.');

  return res.status(codigo).json({ erro: mensagem });
}

module.exports = errorHandler;
