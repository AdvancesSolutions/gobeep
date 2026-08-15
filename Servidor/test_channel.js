// Teste: troca de canal celular -> TV + request_channels -> channels_list
const { io } = require('socket.io-client');

const URL = 'http://192.168.15.3:3002';
const tv = io(URL, { transports: ['websocket'] });
const mobile = io(URL, { transports: ['websocket'] });

let pass = 0, fail = 0;
const ok = (m) => { pass++; console.log('[test] OK:', m); };
const bad = (m) => { fail++; console.log('[test] FAIL:', m); };

const PIN = '123456';

function finish(code) {
  console.log(`\n>>> ${fail === 0 ? 'TODOS OS TESTES PASSARAM' : 'HOUVE FALHAS'} (pass=${pass} fail=${fail})`);
  tv.close(); mobile.close();
  process.exit(code);
}

tv.on('connect', () => tv.emit('register_tv'));
mobile.on('connect', () => {
  // Parear
  mobile.emit('pairTV', { pin: PIN }, (resp) => {
    if (resp && resp.status === 'ok') ok('celular pareado'); else bad('pareamento falhou: ' + JSON.stringify(resp));
  });
});

// TV deve receber tv_channel_changed vindo do celular
let tvGotChannel = false;
tv.on('tv_channel_changed', (d) => {
  if (d && d.channelId === 'ch-999') { tvGotChannel = true; ok('TV recebeu troca de canal do celular (id ch-999)'); }
});

// TV responde request_channels com channels_list
tv.on('request_channels', (d) => {
  tv.emit('channels_list', { from: d.from, channels: [{ id: 'ch-999', name: 'Canal Teste' }] });
  ok('TV recebeu request_channels e respondeu');
});

let mobileGotList = false;
mobile.on('channels_list', (d) => {
  if (Array.isArray(d.channels) && d.channels.some(c => c.id === 'ch-999')) {
    mobileGotList = true;
    ok('celular recebeu channels_list com o canal da TV');
  }
});

// Sequência
setTimeout(() => {
  mobile.emit('request_channels');
}, 400);

setTimeout(() => {
  mobile.emit('tv_channel_changed', { channelId: 'ch-999' });
}, 900);

setTimeout(() => {
  if (!tvGotChannel) bad('TV NAO recebeu tv_channel_changed do celular');
  if (!mobileGotList) bad('celular NAO recebeu channels_list');
  finish(fail === 0 ? 0 : 1);
}, 1600);
