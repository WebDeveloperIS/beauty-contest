const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {}; // RAM-da multiplayer

io.on("connection", (socket) => {

  socket.on("joinRoom", ({ username, room }) => {
    socket.username = username;
    socket.room = room;
    socket.join(room);

    if (!rooms[room]) rooms[room] = { players: [], numbers: [], scores: {}, timer: null };

    rooms[room].players.push(socket);
    if (!rooms[room].scores[username]) rooms[room].scores[username] = 0;

    io.to(room).emit("players", rooms[room].players.map(p => p.username));
    io.to(room).emit("scores", rooms[room].scores);
  });

  socket.on("submitNumber", (num) => {
    const room = rooms[socket.room];
    if (!room) return;
    if (room.numbers.find(n => n.name === socket.username)) return;

    room.numbers.push({ name: socket.username, value: num });
    if (room.numbers.length === room.players.length) endRound(socket.room);
  });

  socket.on("chat", (msg) => {
    io.to(socket.room).emit("chat", { name: socket.username, msg });
  });

  socket.on("disconnect", () => {
    const room = rooms[socket.room];
    if (!room) return;

    room.players = room.players.filter(p => p !== socket);
    io.to(socket.room).emit("players", room.players.map(p => p.username));
  });

});

function startTimer(roomName) {
  let time = 15;
  io.to(roomName).emit("timer", time);

  rooms[roomName].timer = setInterval(() => {
    time--;
    io.to(roomName).emit("timer", time);

    if (time <= 0) {
      clearInterval(rooms[roomName].timer);
      rooms[roomName].timer = null;
      endRound(roomName);
    }
  }, 1000);
}

function endRound(roomName) {
  const room = rooms[roomName];
  if (!room || room.numbers.length === 0) return;

  const values = room.numbers.map(n => n.value);
  const avg = values.reduce((a,b)=>a+b,0)/values.length;
  const target = avg*0.8;

  let winner = room.numbers[0];
  room.numbers.forEach(n=>{
    if(Math.abs(n.value-target)<Math.abs(winner.value-target)) winner=n;
  });

  room.scores[winner.name]++;

  io.to(roomName).emit("result", { numbers: room.numbers, target: target.toFixed(2), winner: winner.name });
  io.to(roomName).emit("scores", room.scores);

  room.players = room.players.filter(p => p.username === winner.name);
  room.numbers = [];

  if (room.players.length > 1) startTimer(roomName);
  else io.to(roomName).emit("gameOver", winner.name);
}

http.listen(process.env.PORT || 3000, () => console.log("Server running"));