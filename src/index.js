const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const routes = require('./routes');
const db = require('./config/db');

const initDb = require('./config/initDb');

const app = express();

// ... existing code ...

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Servidor de la API DeportProyect (Node+Express) escuchando en puerto ${PORT}`);
    
    // Run database initialization/migrations
    try {
        await initDb();
    } catch(err) {
        console.error('CRITICAL: Database initialization failed:', err.message);
    }
});
