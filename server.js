// Step 1: Import required modules
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Step 2: Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Step 3: Initialize Socket.IO on top of the HTTP server
const io = new Server(server);

// Step 4: Serve static files from the "public" folder
// This makes sure our frontend files (HTML, CSS, JS) are accessible
app.use(express.static(path.join(__dirname, 'public')));

// Track connected users
const users = {};

// Step 5: Handle real-time connections with Socket.IO
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle user joining
    socket.on('join', (username) => {
        users[socket.id] = username;
        console.log(`${username} joined.`);

        // Notify everyone that a user joined
        io.emit('system message', `${username} joined the chat`);
        
        // Update user count for everyone
        io.emit('user count', Object.keys(users).length);
    });

    // Listen for 'chat message' events from clients
    socket.on('chat message', (data) => {
        console.log('Message from ' + data.username + ':', data.text);
        
        // Broadcast the message to all connected users
        io.emit('chat message', {
            username: data.username,
            text: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            socketId: socket.id
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const username = users[socket.id];
        if (username) {
            console.log(`${username} disconnected.`);
            io.emit('system message', `${username} left the chat`);
            delete users[socket.id];
            
            // Update user count
            io.emit('user count', Object.keys(users).length);
        }
    });

    // Initial user count for the new connection
    socket.emit('user count', Object.keys(users).length);
});

// Step 6: Start the server on port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
