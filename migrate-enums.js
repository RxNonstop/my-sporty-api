const db = require('./src/config/db');

async function migrate() {
    try {
        console.log('--- Migrando ENUMs de deporte y estado ---');
        
        // 1. Update Campeonato.deporte
        await db.query(`ALTER TABLE Campeonato MODIFY COLUMN deporte ENUM('futbol', 'baloncesto', 'beisbol', 'voleibol', 'futbol_sala', 'bate_tapita') DEFAULT 'futbol'`);
        console.log('OK: Campeonato.deporte actualizado');

        // 2. Update equipo.deporte
        await db.query(`ALTER TABLE equipo MODIFY COLUMN deporte ENUM('futbol', 'baloncesto', 'beisbol', 'voleibol', 'futbol_sala', 'bate_tapite') NOT NULL DEFAULT 'futbol'`);
        console.log('OK: equipo.deporte actualizado');

        // 3. Update Campeonato.estado
        await db.query(`ALTER TABLE Campeonato MODIFY COLUMN estado ENUM('borrador', 'activo', 'programado', 'finalizado', 'cancelado') DEFAULT 'borrador'`);
        console.log('OK: Campeonato.estado actualizado');

        process.exit(0);
    } catch (error) {
        console.error('ERROR during migration:', error);
        process.exit(1);
    }
}

migrate();
