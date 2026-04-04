const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const routes = require('./routes');
const initDb = require('./config/initDb');
const socketManager = require('./sockets/socketManager');

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api', routes);

socketManager.init(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
    console.log(`Servidor de la API DeportProyect (Node+Express+Sockets) escuchando en puerto ${PORT}`);
    
    // Run database initialization/migrations
    try {
        await initDb();
    } catch(err) {
        console.error('CRITICAL: Database initialization failed:', err.message);
    }
});
