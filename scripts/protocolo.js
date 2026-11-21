"use strict";

const COMANDO_RESET = "RESET\n";

function interpretarLeitura(linha) {
  const campos = /^PULSOS=(\d+);MM=(\d+(?:\.\d+)?)$/.exec(linha.trim());
  if (!campos) return null;

  const pulsos = Number(campos[1]);
  const mm = Number(campos[2]);

  if (!Number.isSafeInteger(pulsos) || !Number.isFinite(mm)) return null;

  return { pulsos, mm };
}
