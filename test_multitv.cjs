const { io } = require('socket.io-client');
const URL = 'http://127.0.0.1:3001';
const tvA = io(URL, { transports: ['websocket'] });
const tvB = io(URL, { transports: ['websocket'] });
const mobile = io(URL, { transports: ['websocket'] });
let pass = 0, fail = 0;
const ok = (m) => { pass++; console.log('OK:', m); };
const bad = (m) => { fail++; console.log('FAIL:', m); };
const PIN_A = '111111', PIN_B = '222222';
let tvAChannel = null, tvBChannel = null, pairedA = false, pairedB = false;
tvA.on('tv_channel_changed', (d) => { if (d?.channelId) tvAChannel = d.channelId; });
tvB.on('tv_channel_changed', (d) => { if (d?.channelId) tvBChannel = d.channelId; });
tvA.on('connect', () => tvA.emit('register_tv', { pin: PIN_A }));
tvB.on('connect', () => tvB.emit('register_tv', { pin: PIN_B }));
mobile.on('connect', () => { mobile.emit('mobile_pair', { pin: PIN_A }); mobile.emit('mobile_pair', { pin: PIN_B }); });
mobile.on('pair_success', (p) => {
  if (p?.pin === PIN_A) { pairedA = true; ok('pareou TV A'); }
  if (p?.pin === PIN_B) { pairedB = true; ok('pareou TV B'); }
  if (pairedA && pairedB) {
    setTimeout(() => mobile.emit('tv_channel_changed', { channelId: 'CHA', pin: PIN_A }), 150);
    setTimeout(() => mobile.emit('tv_channel_changed', { channelId: 'CHB', pin: PIN_B }), 300);
  }
});
setTimeout(() => {
  if (tvAChannel === 'CHA') ok('TV A recebeu CHA'); else bad('TV A nao CHA');
  if (tvBChannel === 'CHB') ok('TV B recebeu CHB'); else bad('TV B nao CHB');
  if (tvAChannel !== 'CHB') ok('isolamento A'); else bad('vazamento A');
  if (tvBChannel !== 'CHA') ok('isolamento B'); else bad('vazamento B');
  console.log(`>>> ${fail === 0 ? 'TODOS PASSARAM' : 'FALHAS'} pass=${pass} fail=${fail}`);
  tvA.close(); tvB.close(); mobile.close();
  process.exit(fail === 0 ? 0 : 1);
}, 900);
