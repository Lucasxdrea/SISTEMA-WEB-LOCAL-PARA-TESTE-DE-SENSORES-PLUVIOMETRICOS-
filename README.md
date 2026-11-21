# Pluviômetro Arduino Uno

O painel recebe a contagem de pulsos e a chuva acumulada do Arduino Uno por USB. O firmware `pluviometro_web_arduino_comentado.ino` aplica o fator de 0,2 mm por pulso e envia o valor já convertido. A página usa esse valor para atualizar os indicadores, a proveta, o gráfico e a tabela.

## Estrutura do projeto

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Estrutura do painel, controles e referências aos arquivos CSS e JavaScript. |
| `css/estilos.css` | Layout, estilos dos controles e animação da proveta. |
| `scripts/serial.js` | Seleção e abertura da porta, leitura em blocos, envio de comandos e encerramento da sessão serial. |
| `scripts/protocolo.js` | Validação e interpretação das linhas recebidas e definição do comando `RESET`. |
| `scripts/painel.js` | Atualização dos indicadores, da proveta, do gráfico e do histórico de leituras. |
| `scripts/app.js` | Integração dos botões e do status da conexão com a camada serial e o painel. |

O HTML carrega os scripts externos com `defer`, na ordem indicada pelas tags. O `app.js` é executado depois que os demais scripts e os elementos do painel estão disponíveis.

## Mecanismo de comunicação

A conexão é serial e bidirecional. A placa ligada por USB aparece como uma porta serial no sistema operacional. Ao clicar em **Conectar ao Arduino**, o navegador chama `navigator.serial.requestPort()` e o usuário escolhe a porta. Depois de abrir a conexão, a página recebe os dados pelo fluxo `readable` e envia comandos pelo fluxo `writable`. A troca de dados ocorre no próprio computador. [Chrome for Developers — Web Serial](https://developer.chrome.com/docs/capabilities/serial/)

## Bibliotecas utilizadas

O projeto usa HTML, CSS e JavaScript com APIs nativas. A **Web Serial API** dá acesso à porta, a **Streams API** permite leitura e escrita assíncronas, `TextDecoder` e `TextEncoder` convertem texto e bytes, e a **Canvas 2D API** desenha o gráfico. No firmware, `Serial` faz parte da plataforma Arduino. A instalação se resume aos arquivos do painel e ao firmware gravado na placa.

## Parâmetros da conexão

| Parâmetro | Valor |
|---|---|
| Interface física | USB, com porta serial reconhecida pelo sistema operacional |
| Velocidade | 9600 baud |
| Bits de dados | 8 |
| Paridade | Nenhuma |
| Bits de parada | 1 |
| Controle de fluxo | Nenhum |

A configuração **9600, 8N1** está explícita em `scripts/serial.js` e corresponde a `Serial.begin(9600)` no firmware. [Arduino — Serial.begin()](https://docs.arduino.cc/language-reference/en/functions/communication/serial/begin/) · [MDN — SerialPort.open()](https://developer.mozilla.org/en-US/docs/Web/API/SerialPort/open)

## Formato das mensagens

| Sentido | Exemplo | Interpretação |
|---|---|---|
| Arduino → página | `PULSOS=5;MM=1.0` | Contador com 5 pulsos e acumulado de 1,0 mm. O firmware termina a linha com `\r\n`. |
| Página → Arduino | `RESET\n` | Comando de zeragem do contador. `\n` representa a quebra de linha que delimita o comando. |
| Arduino → página após `RESET` | `PULSOS=0;MM=0.0` | Leitura zerada. Ao recebê-la, o painel zera os indicadores e limpa a tabela e o gráfico. |

Os campos `PULSOS` e `MM` são separados por ponto e vírgula. No texto transmitido, o ponto é o separador decimal. O Arduino envia a leitura na inicialização, a cada pulso válido e após `RESET`. O navegador aceita linhas terminadas em `\n` ou `\r\n`, guarda os trechos incompletos até a próxima leitura e descarta linhas que não correspondem ao formato. A hora da tabela é a hora local de recebimento no computador. [Arduino — Serial.println()](https://docs.arduino.cc/language-reference/en/functions/communication/serial/println/)

## Procedimento de conexão e reconexão

1. Extraia o ZIP mantendo `index.html`, `css/` e `scripts/` na mesma pasta. Abra `index.html` em uma aba própria do Chrome ou Edge no computador.
2. Ligue o Arduino com um cabo USB de dados. Se o Monitor Serial ou o Plotter Serial estiver usando a porta, feche-o.
3. Clique em **Conectar ao Arduino** e selecione a porta da placa no seletor do navegador. O status muda para **Conectado**.
4. Para encerrar a conexão pela página, clique em **Desconectar**. Em caso de remoção do cabo ou fim da leitura, a página também encerra a sessão, libera a porta e volta a habilitar **Conectar ao Arduino**.
5. Para reconectar, recoloque o cabo USB se tiver sido retirado. Clique novamente em **Conectar ao Arduino** e selecione a porta. A reconexão é manual.

O Arduino Uno pode reiniciar ao abrir a porta USB serial. Quando o firmware envia a leitura inicial zerada, o painel a trata como uma nova medição. [Arduino — Automatic (Software) Reset](https://docs.arduino.cc/retired/boards/arduino-uno-rev3-with-long-pins/#automatic-software-reset)

## Compatibilidade com navegadores

| Navegador | Disponibilidade da Web Serial |
|---|---|
| Google Chrome e Microsoft Edge no computador | Suporte nativo. São as opções indicadas para a primeira conexão. [Dados de compatibilidade da MDN](https://github.com/mdn/browser-compat-data/blob/main/api/Serial.json) |
| Firefox no computador | Suporte nativo a partir da versão 151. [Mozilla](https://hacks.mozilla.org/2026/05/web-serial-support-in-firefox/) |
| Chrome no Android | Suporte a portas USB seriais a partir da versão 148. A conexão depende da compatibilidade do telefone, do cabo ou adaptador USB e da placa. [Chrome 148](https://developer.chrome.com/release-notes/148#web-serial-api-on-android) |
| Safari no macOS e iOS e Firefox no Android | Sem acesso à porta pela Web Serial nativa. [Dados de compatibilidade da MDN](https://github.com/mdn/browser-compat-data/blob/main/api/Serial.json) |

A API exige um contexto seguro. Se a abertura direta de `index.html` tiver acesso à serial bloqueado, abra um terminal na pasta extraída, execute o comando abaixo e acesse [http://localhost:8000](http://localhost:8000) no navegador do mesmo computador. Em hospedagem remota, use HTTPS. [MDN — Contextos seguros](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts)

```powershell
py -m http.server 8000 --bind 127.0.0.1
```

O exemplo usa o iniciador do Python no Windows. No Linux ou macOS com Python instalado, use `python3` no lugar de `py`.
