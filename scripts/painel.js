"use strict";

const LIMITE_PROVETA_MM = 10;

function criarPainel() {
  const valorPulsos = document.getElementById("pulseValue");
  const valorChuva = document.getElementById("mmValue");
  const valorProveta = document.getElementById("insideValue");
  const agua = document.getElementById("water");
  const tabela = document.getElementById("tableBody");
  const aviso = document.getElementById("warning");
  const escala = document.getElementById("scale");
  const canvas = document.getElementById("chart");
  const ctx = canvas.getContext("2d");

  const historico = [];
  let pulsosAtuais = 0;
  let chuvaAtual = 0;

  function montarEscala() {
    for (let mm = 0; mm <= LIMITE_PROVETA_MM; mm++) {
      const marca = document.createElement("div");
      marca.className = "scale-mark";
      marca.style.bottom = `${(mm / LIMITE_PROVETA_MM) * 100}%`;
      marca.textContent = mm;
      escala.appendChild(marca);
    }
  }

  function receberLeitura({ pulsos, mm }) {
    if (pulsos === pulsosAtuais && mm === chuvaAtual) return;

    pulsosAtuais = pulsos;
    chuvaAtual = mm;

    if (pulsos === 0 && mm === 0) {
      historico.length = 0;
      tabela.replaceChildren();
    } else {
      const leitura = { horario: new Date(), pulsos, mm };
      historico.push(leitura);
      adicionarLinha(leitura);
    }

    atualizarIndicadores();
  }

  function adicionarLinha({ horario, pulsos, mm }) {
    const linha = tabela.insertRow();
    const valores = [historico.length, horario.toLocaleTimeString("pt-BR"), pulsos, `${mm.toFixed(1)} mm`];

    for (const valor of valores) {
      linha.insertCell().textContent = valor;
    }

    const areaRolagem = tabela.closest(".table-wrap");
    areaRolagem.scrollTop = areaRolagem.scrollHeight;
  }

  function atualizarIndicadores() {
    valorPulsos.textContent = pulsosAtuais;
    valorChuva.textContent = chuvaAtual.toFixed(1);
    valorProveta.textContent = chuvaAtual.toFixed(1);

    const preenchimento = Math.min(100, (chuvaAtual / LIMITE_PROVETA_MM) * 100);
    agua.style.height = `${preenchimento}%`;
    aviso.hidden = chuvaAtual <= LIMITE_PROVETA_MM;

    desenharGrafico();
  }

  function desenharGrafico() {
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const padLeft = 55;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 42;

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#98a2b3";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, h - padBottom);
    ctx.lineTo(w - padRight, h - padBottom);
    ctx.stroke();

    const maxY = historico.reduce((max, leitura) => Math.max(max, leitura.mm), LIMITE_PROVETA_MM);

    ctx.font = "12px Arial";
    ctx.fillStyle = "#667085";
    ctx.textAlign = "right";

    for (let i = 0; i <= 5; i++) {
      const yValue = (maxY / 5) * i;
      const y = h - padBottom - (i / 5) * plotH;

      ctx.strokeStyle = "#e5e7eb";
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      ctx.fillText(yValue.toFixed(1), padLeft - 8, y + 4);
    }

    ctx.save();
    ctx.translate(15, padTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("Chuva acumulada (mm)", 0, 0);
    ctx.restore();

    if (historico.length === 0) {
      ctx.fillStyle = "#98a2b3";
      ctx.textAlign = "center";
      ctx.font = "14px Arial";
      ctx.fillText("Aguardando pulsos do pluviômetro...", padLeft + plotW / 2, padTop + plotH / 2);
      return;
    }

    ctx.strokeStyle = "#1677ff";
    ctx.lineWidth = 3;
    ctx.beginPath();

    historico.forEach((r, index) => {
      const x = historico.length === 1
        ? padLeft
        : padLeft + (index / (historico.length - 1)) * plotW;

      const y = h - padBottom - (r.mm / maxY) * plotH;

      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    ctx.fillStyle = "#1677ff";
    historico.forEach((r, index) => {
      const x = historico.length === 1
        ? padLeft
        : padLeft + (index / (historico.length - 1)) * plotW;

      const y = h - padBottom - (r.mm / maxY) * plotH;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "#667085";
    ctx.textAlign = "center";
    ctx.font = "12px Arial";
    ctx.fillText("Leituras / pulsos", padLeft + plotW / 2, h - 12);
  }

  montarEscala();
  atualizarIndicadores();
  return { receberLeitura };
}
