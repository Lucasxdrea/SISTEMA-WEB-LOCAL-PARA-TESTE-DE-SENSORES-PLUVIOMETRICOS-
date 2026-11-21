"use strict";

(() => {
  const botaoConectar = document.getElementById("connectButton");
  const botaoReset = document.getElementById("resetButton");
  const status = document.getElementById("status");
  const avisoSerial = document.getElementById("serialMessage");
  const painel = criarPainel();
  const serialDisponivel = window.isSecureContext && Boolean(navigator.serial);
  const rotulos = {
    desconectado: "Desconectado",
    conectando: "Conectando…",
    conectado: "Conectado",
    desconectando: "Desconectando…",
    indisponivel: "Serial indisponível"
  };

  let estado = "desconectado";
  let enviandoReset = false;

  const serial = criarConexaoSerial({
    aoReceberLinha(linha) {
      const leitura = interpretarLeitura(linha);
      if (leitura) painel.receberLeitura(leitura);
    },
    aoEncerrar(mensagem) {
      atualizarEstado("desconectado");
      mostrarAviso(mensagem);
    }
  });

  function atualizarEstado(novoEstado) {
    estado = novoEstado;
    const conectado = estado === "conectado";
    const transicao = estado === "conectando" || estado === "desconectando";

    status.textContent = rotulos[estado];
    status.classList.toggle("connected", conectado);
    botaoConectar.textContent = conectado ? "Desconectar" : "Conectar ao Arduino";
    botaoConectar.disabled = !serialDisponivel || transicao;
    botaoReset.disabled = !conectado || enviandoReset;
  }

  function mostrarAviso(mensagem) {
    avisoSerial.textContent = mensagem;
    avisoSerial.hidden = !mensagem;
  }

  async function alternarConexao() {
    mostrarAviso("");

    if (estado === "conectado") {
      atualizarEstado("desconectando");
      await serial.desconectar();
      return;
    }

    atualizarEstado("conectando");
    try {
      await serial.conectar();
      atualizarEstado("conectado");
    } catch (erro) {
      atualizarEstado("desconectado");

      if (erro.name === "NotFoundError") {
        mostrarAviso("Nenhuma porta foi selecionada. Clique em Conectar ao Arduino para tentar novamente.");
      } else {
        console.error("Falha ao abrir a conexão serial.", erro);
        mostrarAviso("Não foi possível abrir a porta. Verifique a permissão e feche o Monitor Serial ou outro programa que esteja usando a porta.");
      }
    }
  }

  async function reiniciarTeste() {
    mostrarAviso("");
    enviandoReset = true;
    atualizarEstado(estado);

    try {
      // O painel é atualizado pela leitura zerada enviada pelo Arduino.
      await serial.enviar(COMANDO_RESET);
    } catch (erro) {
      console.error("Falha ao enviar RESET.", erro);
      if (estado === "conectado") {
        mostrarAviso("O comando de reinício não foi enviado. Verifique a conexão e tente novamente.");
      }
    } finally {
      enviandoReset = false;
      atualizarEstado(estado);
    }
  }

  botaoConectar.addEventListener("click", alternarConexao);
  botaoReset.addEventListener("click", reiniciarTeste);

  atualizarEstado(serialDisponivel ? "desconectado" : "indisponivel");
  if (!window.isSecureContext) {
    mostrarAviso("Para usar a porta serial, abra a página em HTTPS ou pelo endereço local http://localhost:8000.");
  } else if (!serialDisponivel) {
    mostrarAviso("A API Web Serial está indisponível neste navegador. No computador, use uma versão atual do Chrome ou do Microsoft Edge.");
  }
})();
