const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();
const client = require('prom-client');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));
 
const mongoUser = process.env.MONGO_USER;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoHost = process.env.MONGO_HOST || 'mongodb';
const apiURL = process.env.API_URL;

// Connect to MongoDB
mongoose.connect(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:27017/chatDB?authSource=admin'`, {
    useNewUrlParser: true,
    authSource: "admin" // Ensure authentication is done using the correct database
}).then(() => console.log("MongoDB connected successfully"))
.catch(err => console.error("MongoDB connection error:", err));


app.get('/api/config', (req, res) => {
    res.json({ apiUrl: process.env.API_URL || 'http://localhost:4001' });
});


// Define message schema
const messageSchema = new mongoose.Schema({
    username: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Prometheus Metrics
const activeUsersGauge = new client.Gauge({ name: 'chat_active_users', help: 'Number of active users' });
const cpuUsageGauge = new client.Gauge({ name: 'chat_cpu_usage', help: 'CPU usage percentage' });
const memoryUsageGauge = new client.Gauge({ name: 'chat_memory_usage', help: 'Memory usage percentage' });

let activeUsers = 0;

// Scrape CPU & Memory Usage
function updateMetrics() {
    const cpuLoad = os.loadavg()[0]; // 1-minute CPU load
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;

    cpuUsageGauge.set(cpuLoad);
    memoryUsageGauge.set(memoryUsage);
}

// Update metrics every 5 seconds
setInterval(updateMetrics, 5000);

// Prometheus Metrics Endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

// Socket.io Events
io.on('connection', async (socket) => {
    activeUsers++;
    activeUsersGauge.set(activeUsers);
    console.log(`A user connected. Active users: ${activeUsers}`);

     // Send the last 10 messages when a user connects
     const messages = await Message.find().sort({ timestamp: -1 }).limit(1000);
     socket.emit('chat history', messages.reverse());

    socket.on('set name', (name) => {
        socket.username = name;
        io.emit('chat message', { username: "System", message: `${name} has joined the chat` });
    });

    socket.on('chat message', async (msg) => {
        if (!socket.username) return;
        
        const chatMessage = new Message({ username: socket.username, message: msg });
        await chatMessage.save();

        io.emit('chat message', { username: socket.username, message: msg });
    });

    socket.on('disconnect', () => {
        activeUsers--;
        activeUsersGauge.set(activeUsers);
        console.log(`A user disconnected. Active users: ${activeUsers}`);

        if (socket.username) {
            io.emit('chat message', { username: "System", message: `${socket.username} has left the chat` });
        }
    });
});

server.listen(3001, () => {
    console.log('Server running on http://localhost:3001');
});
