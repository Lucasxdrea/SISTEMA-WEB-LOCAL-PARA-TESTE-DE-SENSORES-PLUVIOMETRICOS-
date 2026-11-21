/*
  Projeto Pluviometro + Pagina Web
  Arduino Uno

  Ligacao:
  - Um fio do sensor -> pino digital 2
  - Outro fio do sensor -> GND

  Calibracao:
  - 1 pulso = 0,2 mm de chuva

  Comunicacao serial:
  Arduino -> PC:
      PULSOS=5;MM=1.0

  PC -> Arduino:
      RESET

  Ao receber RESET, o Arduino zera o contador e responde:
      PULSOS=0;MM=0.0
*/

const int pinoSensor = 2;
const float mmPorPulso = 0.2;

int estadoAtual = HIGH;
int estadoAnterior = HIGH;

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

  enviarDados();
}

void loop() {
  // -------- LEITURA DO PLUVIOMETRO --------
  estadoAtual = digitalRead(pinoSensor);

  if (estadoAtual != estadoAnterior) {
    if (millis() - ultimoEvento >= debounceMs) {
      ultimoEvento = millis();

      // Conta somente quando o contato fecha
      if (estadoAtual == LOW) {
        totalPulsos++;
        enviarDados();
      }

      estadoAnterior = estadoAtual;
    }
  }

  // -------- COMANDOS VINDOS DA PAGINA WEB --------
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
