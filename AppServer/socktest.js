const { io } = require('D:\\Clientes\\BeepApp\\Projeto\\AppServer\\node_modules\\socket.io-client');
const s = io('http://192.168.15.3:3001', { transports: ['websocket'] });
s.on('connect', () => { s.emit('tv_reaction', '🔥'); console.log('CONNECTED_AND_EMITTED'); s.disconnect(); process.exit(0); });
s.on('connect_error', (e) => { console.log('ERR', e.message); process.exit(1); });
setTimeout(() => { console.log('TIMEOUT'); process.exit(1); }, 5000);
