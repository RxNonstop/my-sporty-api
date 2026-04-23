const db = require('./src/config/db');

/**
 * Script para migrar la tabla de partidos, añadiendo el campo grupo_numero
 * para fases de grupos.
 *
 * Ejecutar: node migrate-partidos.js
 */

const migrationQuery = `
  ALTER TABLE partidos
  ADD COLUMN grupo_numero INT DEFAULT NULL;
`;

async function runMigration() {
  const connection = await db.getConnection();
  try {
    console.log('Iniciando migración de tabla partidos...');

    // Verificar si la columna ya existe
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'partidos'
      AND TABLE_SCHEMA = DATABASE()
      AND COLUMN_NAME = 'grupo_numero'
    `);

    if (columns.length > 0) {
      console.log('✓ La columna grupo_numero ya existe en la tabla partidos');
      return;
    }

    await connection.query(migrationQuery);
    console.log('✓ Migración completada exitosamente');
    console.log('  - Agregado: grupo_numero (para identificar grupos en fases de grupos)');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✓ La columna grupo_numero ya existe en la tabla');
    } else {
      console.error('✗ Error en la migración:', error.message);
      throw error;
    }
  } finally {
    connection.release();
    process.exit(0);
  }
}

runMigration().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});