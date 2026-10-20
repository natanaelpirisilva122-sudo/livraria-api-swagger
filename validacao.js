// Validações simples usadas na camada de serviços para evitar respostas 500
// em entradas incompletas e manter os contratos descritos no OpenAPI.
function falha(mensagem, status = 400) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

function validarObjeto(valor) {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
    throw falha('O corpo da requisição deve ser um objeto JSON.');
  }
  return valor;
}

function textoObrigatorio(valor, campo) {
  if (typeof valor !== 'string' || valor.trim().length === 0) {
    throw falha(`O campo ${campo} é obrigatório e deve ser um texto não vazio.`);
  }
  return valor.trim();
}

function inteiroPositivo(valor, campo, maximo = Number.MAX_SAFE_INTEGER) {
  // Aceita inteiros JSON e suas representações numéricas (compatibilidade
  // com a interface HTML anterior, que envia valores de input como string).
  if (!(typeof valor === 'number' || (typeof valor === 'string' && /^\d+$/.test(valor.trim())))) {
    throw falha(`O campo ${campo} deve ser um número inteiro positivo.`);
  }
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero) || numero < 1 || numero > maximo) {
    throw falha(`O campo ${campo} deve ser um número inteiro positivo válido.`);
  }
  return numero;
}

function emailValido(valor) {
  const email = textoObrigatorio(valor, 'email').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw falha('Informe um endereço de e-mail válido.');
  }
  return email;
}

module.exports = { falha, validarObjeto, textoObrigatorio, inteiroPositivo, emailValido };
