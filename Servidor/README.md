# BeepApp — Servidor de referência (Node + socket.io)

Servidor que fecha o ciclo de **pareamento TV ↔ celular**, **saldo Beepix** e **reações/heartbeat** esperado por AppWeb (TV) e AppMobile (Expo).

> ⚠️ Este é um servidor de **referência/funcional**. O ambiente de produção roda em `192.168.15.3:3001`. Se já houver um backend real lá, este arquivo serve como documentação do contrato de eventos — ajuste para bater com a implementação existente.

## Eventos / Contrato

| Origem | Evento | Descrição |
|--------|--------|-----------|
| TV | `register_tv` | Registra a TV como destino de eventos. |
| TV | `ping_tv` | Heartbeat → servidor responde `pong_tv`. |
| TV | `tv_channel_changed` `{canal}` | Avisa o celular qual canal está tocando. |
| TV | `tv_reaction` `emoji` | Reação local da TV (broadcast p/ celular). |
| TV | `tv_score` `{amount}` | Gamificação: soma ao saldo do usuário pareado. |
| TV | `mobile_pair` `pin` | TV inicia pareamento por PIN (compat). |
| Celular | `register_mobile` | Registra o celular. |
| Celular | `pairTV` `{pin}` + ack | Pareia; ack `{status:'ok', pin, beepix}`. |
| Celular | `sendReaction` `emoji` | Reação → servidor emite `tv_reaction` na TV. |

| Servidor → destino | Evento | Descrição |
|--------------------|--------|-----------|
| TV / Celular | `pair_success` `{pin, beepix}` | Pareamento confirmado. |
| Celular | `paired` `{status, pin, beepix}` | Confirmação no celular. |
| TV | `pong_tv` `{ts}` | Resposta do heartbeat. |
| TV | `pair_lost` `{pin, reason}` | Par desconectou. |
| TV / Celular | `tv_reaction` `emoji` | Reação recebida. |
| TV / Celular | `tv_score` `{amount}` | Pontuação. |
| TV / Celular | `tv_alert` `data` | Alerta. |
| Celular | `pair_error` `err` | Falha de pareamento. |

## HTTP

- `GET /saldo` → saldo de referência (primeiro usuário).
- `GET /saldo/:pin` → saldo do PIN.
- `POST /saldo/:pin/add` corpo `{ "amount": N }` → soma ao saldo (testes).
- `GET /health` → `{ ok, tv, mobile }`.

## Rodar

```bash
npm install
npm start          # porta 3001 (ou PORT env)
# dev com reload:
npm run dev
```

No Windows (PowerShell), aponte AppWeb/AppMobile para `http://192.168.15.3:3001` (ou `localhost` se rodar na própria máquina).

## Validação

```bash
npm install --no-save socket.io-client
node test_client.js   # roda ciclo ping/pair/reaction/saldo/pair_lost
```

Estado persistido em `data.json` (PIN → saldo/pareamento).
