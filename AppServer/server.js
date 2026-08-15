const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const TV_ROOM = 'tv';

io.on('connection', (socket) => {
  console.log('[BeepServer] client connected', socket.id);

  socket.on('tv_join', () => {
    socket.join(TV_ROOM);
    console.log('[BeepServer] TV joined');
  });

  socket.on('mobile_pair', ({ pin }) => {
    if (pin) {
      socket.join(TV_ROOM);
      socket.join('pin:' + pin);
      console.log('[BeepServer] Mobile paired room', pin);
    }
  });

  socket.on('tv_reaction', (emoji) => {
    io.to(TV_ROOM).emit('tv_reaction', emoji);
    console.log('[BeepServer] reaction ->', emoji);
  });

  socket.on('tv_alert', (data) => {
    io.to(TV_ROOM).emit('tv_alert', data);
  });

  socket.on('tv_channel_changed', (data) => {
    socket.to(TV_ROOM).emit('tv_channel_changed', data);
  });

  socket.on('disconnect', () => console.log('[BeepServer] disconnected', socket.id));
});

server.listen(3001, '0.0.0.0', () => console.log('[BeepServer] listening on :3001'));
