/*
  PLUVIOMETRO + PAGINA WEB
  VERSAO PARA REED SWITCH AO CONTRARIO
  (NORMALMENTE FECHADO / LOGICA INVERTIDA)

  Ligacao mantida:
  - Um fio do sensor -> pino digital 2
  - Outro fio do sensor -> GND

  Com INPUT_PULLUP:
  - Contato FECHADO = LOW
  - Contato ABERTO  = HIGH

  Nesta versao, o pulso e contado quando o contato ABRE:
  LOW -> HIGH

  Calibracao:
  - 1 pulso = 0,2 mm
*/

const int pinoSensor = 2;
const float mmPorPulso = 0.2;

int estadoAtual;
int estadoAnterior;

unsigned long totalPulsos = 0;

unsigned long ultimoEvento = 0;
const unsigned long debounceMs = 50;

String comandoSerial = "";

void enviarDados() {
  float chuvaAcumulada = totalPulsos * mmPorPulso;

  Serial.print("PULSOS=");
  Serial.print(totalPulsos);
  Serial.print(";MM=");
  Serial.println(chuvaAcumulada, 1);
}

void setup() {
  pinMode(pinoSensor, INPUT_PULLUP);

  Serial.begin(9600);
  delay(300);

  // Le o estado real do reed ao ligar.
  // Isso evita contar um pulso falso na inicializacao.
  estadoAnterior = digitalRead(pinoSensor);

  enviarDados();
}

void loop() {
  estadoAtual = digitalRead(pinoSensor);

  if (estadoAtual != estadoAnterior) {

    if (millis() - ultimoEvento >= debounceMs) {

      ultimoEvento = millis();

      /*
        REED SWITCH INVERTIDO:
        estado normal = LOW
        acionado      = HIGH

        Conta apenas na abertura do contato.
      */
      if (estadoAtual == HIGH) {
        totalPulsos++;
        enviarDados();
      }

      estadoAnterior = estadoAtual;
    }
  }

  // Comando RESET enviado pela pagina web
  while (Serial.available() > 0) {
    char c = Serial.read();

    if (c == '\n' || c == '\r') {
      comandoSerial.trim();

      if (comandoSerial == "RESET") {
        totalPulsos = 0;
        enviarDados();
      }

      comandoSerial = "";
    } else {
      comandoSerial += c;
    }
  }
}
