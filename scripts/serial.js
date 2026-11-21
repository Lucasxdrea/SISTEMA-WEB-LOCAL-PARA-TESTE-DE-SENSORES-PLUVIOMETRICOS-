"use strict";

const CONFIGURACAO_SERIAL = Object.freeze({
  baudRate: 9600,
  dataBits: 8,
  parity: "none",
  stopBits: 1,
  flowControl: "none"
});

function criarConexaoSerial({ aoReceberLinha, aoEncerrar }) {
  const codificador = new TextEncoder();
  let sessao = null;

  async function conectar() {
    const porta = await navigator.serial.requestPort();
    await porta.open(CONFIGURACAO_SERIAL);

    const atual = { porta, leitor: null, leitura: null, envio: null, fechamento: null };
    sessao = atual;
    porta.addEventListener("disconnect", aoDesconectarDispositivo);

    atual.leitura = lerLinhas(atual);
    atual.leitura.then(
      () => fechar(atual, "A leitura serial terminou. Conecte ao Arduino novamente."),
      (erro) => {
        if (!atual.fechamento) console.error("Falha na leitura serial.", erro);
        return fechar(atual, "A leitura serial foi interrompida. Conecte ao Arduino novamente.");
      }
    );
  }

  async function lerLinhas(atual) {
    if (!atual.porta.readable) return;

    const leitor = atual.porta.readable.getReader();
    const decodificador = new TextDecoder();
    let trechoPendente = "";
    atual.leitor = leitor;

    try {
      while (!atual.fechamento) {
        const { value, done } = await leitor.read();
        if (done || atual.fechamento) break;

        trechoPendente += decodificador.decode(value, { stream: true });
        const linhas = trechoPendente.split("\n");
        trechoPendente = linhas.pop();

        for (const linha of linhas) {
          aoReceberLinha(linha);
        }
      }
    } finally {
      leitor.releaseLock();
      atual.leitor = null;
    }
  }

  async function enviar(texto) {
    const atual = sessao;
    if (!atual?.porta.writable || atual.fechamento) {
      throw new Error("A porta serial está indisponível para envio.");
    }
    if (atual.envio) {
      throw new Error("Já existe um envio pela porta serial em andamento.");
    }

    const escritor = atual.porta.writable.getWriter();
    atual.envio = escrever(escritor, texto);

    try {
      await atual.envio;
    } finally {
      atual.envio = null;
    }
  }

  async function escrever(escritor, texto) {
    try {
      await escritor.write(codificador.encode(texto));
    } finally {
      escritor.releaseLock();
    }
  }

  function aoDesconectarDispositivo(evento) {
    if (sessao?.porta === evento.target) {
      fechar(sessao, "Arduino desconectado. Reconecte o cabo USB e selecione a porta novamente.");
    }
  }

  function fechar(atual, mensagem = "") {
    if (!atual) return Promise.resolve();

    // A leitura e o evento disconnect podem sinalizar a mesma queda da porta.
    atual.fechamento ??= liberarPorta(atual, mensagem);
    return atual.fechamento;
  }

  async function liberarPorta(atual, mensagem) {
    atual.porta.removeEventListener("disconnect", aoDesconectarDispositivo);

    // Cancela a leitura pendente e aguarda a liberação dos acessos à porta.
    await atual.leitor?.cancel().catch(() => {});
    await atual.leitura.catch(() => {});
    await atual.envio?.catch(() => {});

    try {
      await atual.porta.close();
    } catch (erro) {
      if (atual.porta.connected !== false) {
        console.error("Falha ao fechar a porta serial.", erro);
        mensagem ||= "A porta serial não pôde ser fechada. Reconecte o cabo USB e tente novamente.";
      }
    }

    if (sessao === atual) {
      sessao = null;
      aoEncerrar(mensagem);
    }
  }

  return { conectar, desconectar: () => fechar(sessao), enviar };
}
