const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let players = {};

io.on('connection', (socket) => {
    // Init joueur
    players[socket.id] = {
        id: socket.id,
        x: 400, y: 300,
        coins: 100,
        status: 'Sober',
        username: "Guest_" + socket.id.substr(0, 3)
    };

    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Mouvement
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // BAR : Consommation
    socket.on('buyDrink', (drink) => {
        const p = players[socket.id];
        if (p.coins >= drink.price) {
            p.coins -= drink.price;
            p.status = "Drunk";
            io.emit('announcement', `${p.username} est bourré ! 🍺`);
            io.emit('updateStats', p);
        }
    });

    // CASINO : Pile ou Face (Simple pour le MVP)
    socket.on('gamble', (bet) => {
        const p = players[socket.id];
        if (p.coins >= bet) {
            const win = Math.random() > 0.5;
            p.coins += win ? bet : -bet;
            const msg = win ? `gagne ${bet}!` : `perd tout...`;
            io.emit('announcement', `${p.username} ${msg} 🎰`);
            io.emit('updateStats', p);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerLeft', socket.id);
    });
});

server.listen(3000, () => console.log('Cracked Town live on port 3000'));