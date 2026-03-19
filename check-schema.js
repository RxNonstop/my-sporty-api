const db = require('./src/config/db');

async function checkSchema() {
    try {
        const [rows] = await db.query('SHOW COLUMNS FROM invitacioncampeonatos');
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkSchema();
