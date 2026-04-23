const db = require('./src/config/db');

/**
 * Script para migrar la tabla de fases, añadiendo nuevos campos:
 * - numero_grupos
 * - tamano_grupo
 * - clasificados_por_grupo
 * 
 * Ejecutar: node migrate-phases.js
 */

const migrationQuery = `
  ALTER TABLE fases
  ADD COLUMN numero_grupos INT DEFAULT NULL AFTER numero_equipos,
  ADD COLUMN tamano_grupo INT DEFAULT NULL AFTER numero_grupos,
  ADD COLUMN clasificados_por_grupo INT DEFAULT NULL AFTER tamano_grupo;
`;

async function runMigration() {
  const connection = await db.getConnection();
  try {
    console.log('Iniciando migración de tabla fases...');
    
    // Verificar si las columnas ya existen
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'fases' 
      AND TABLE_SCHEMA = DATABASE()
      AND COLUMN_NAME IN ('numero_grupos', 'tamano_grupo', 'clasificados_por_grupo')
    `);
    
    if (columns.length === 3) {
      console.log('✓ Las columnas ya existen en la tabla fases');
      return;
    }
    
    await connection.query(migrationQuery);
    console.log('✓ Migración completada exitosamente');
    console.log('  - Agregado: numero_grupos');
    console.log('  - Agregado: tamano_grupo');
    console.log('  - Agregado: clasificados_por_grupo');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✓ Las columnas ya existen en la tabla');
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
