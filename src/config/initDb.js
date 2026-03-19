const db = require('./db');

const tables = [
  {
    name: 'Usuario',
    query: `
      CREATE TABLE IF NOT EXISTS Usuario (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        cedula VARCHAR(50) NOT NULL UNIQUE,
        sexo ENUM('M', 'F', 'Otro') NOT NULL,
        fecha_nacimiento DATE NOT NULL,
        estado_salud TEXT,
        correo VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        telefono VARCHAR(50),
        direccion TEXT,
        ciudad VARCHAR(100),
        pais VARCHAR(100),
        url_foto_perfil TEXT,
        rol ENUM('player', 'owner', 'admin') DEFAULT 'player',
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        ultimo_login DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `
  },
  {
    name: 'Amistad',
    query: `
      CREATE TABLE IF NOT EXISTS Amistad (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario1_id INT NOT NULL,
        usuario2_id INT NOT NULL,
        activo TINYINT(1) DEFAULT 1,
        fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario1_id) REFERENCES Usuario(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario2_id) REFERENCES Usuario(id) ON DELETE CASCADE,
        UNIQUE KEY unique_friendship (usuario1_id, usuario2_id)
      ) ENGINE=InnoDB;
    `
  },
  {
    name: 'SolicitudAmistad',
    query: `
      CREATE TABLE IF NOT EXISTS SolicitudAmistad (
        id INT AUTO_INCREMENT PRIMARY KEY,
        de_usuario_id INT NOT NULL,
        para_usuario_id INT NOT NULL,
        estado ENUM('pendiente', 'aceptado', 'rechazado') DEFAULT 'pendiente',
        fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_respuesta DATETIME,
        FOREIGN KEY (de_usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE,
        FOREIGN KEY (para_usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `
  },
  {
    name: 'Equipo',
    query: `
      CREATE TABLE IF NOT EXISTS Equipo (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        estadio_local VARCHAR(255),
        ciudad VARCHAR(100),
        pais VARCHAR(100),
        url_logo TEXT,
        correo_contacto VARCHAR(255),
        telefono_contacto VARCHAR(50),
        url_web TEXT,
        propietario_id INT NOT NULL,
        deporte VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (propietario_id) REFERENCES Usuario(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `
  },
  {
    name: 'miembrosequipo',
    query: `
      CREATE TABLE IF NOT EXISTS miembrosequipo (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        equipo_id INT NOT NULL,
        rol_usuario ENUM('jugador', 'capitan', 'entrenador') DEFAULT 'jugador',
        activo TINYINT(1) DEFAULT 1,
        fecha_union DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE,
        FOREIGN KEY (equipo_id) REFERENCES Equipo(id) ON DELETE CASCADE,
        UNIQUE KEY unique_member (usuario_id, equipo_id)
      ) ENGINE=InnoDB;
    `
  },
  {
    name: 'invitacionequipo',
    query: `
      CREATE TABLE IF NOT EXISTS invitacionequipo (
        id INT AUTO_INCREMENT PRIMARY KEY,
        de_usuario_id INT NOT NULL,
        para_usuario_id INT NOT NULL,
        equipo_id INT NOT NULL,
        mensaje TEXT,
        estado ENUM('pendiente', 'aceptado', 'rechazado') DEFAULT 'pendiente',
        fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (de_usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE,
        FOREIGN KEY (para_usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE,
        FOREIGN KEY (equipo_id) REFERENCES Equipo(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `
  },
  {
    name: 'Campeonato',
    query: `
      CREATE TABLE IF NOT EXISTS Campeonato (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        telefono_contacto VARCHAR(50),
        estado ENUM('borrador', 'activo', 'programado', 'finalizado', 'cancelado') DEFAULT 'borrador',
        inscripciones_abiertas TINYINT(1) DEFAULT 1,
        fecha_inicio DATE,
        fecha_fin DATE,
        deporte VARCHAR(100),
        numero_jugadores INT,
        numero_suplentes INT,
        numero_equipos INT,
        propietario_id INT NOT NULL,
        privacidad ENUM('publico', 'privado') DEFAULT 'publico',
        campeon_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (propietario_id) REFERENCES Usuario(id) ON DELETE CASCADE,
        FOREIGN KEY (campeon_id) REFERENCES Equipo(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `
  },
  {
    name: 'miembroscampeonatos',
    query: `
      CREATE TABLE IF NOT EXISTS miembroscampeonatos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campeonato_id INT NOT NULL,
        equipo_id INT NOT NULL,
        activo TINYINT(1) DEFAULT 1,
        fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campeonato_id) REFERENCES Campeonato(id) ON DELETE CASCADE,
        FOREIGN KEY (equipo_id) REFERENCES Equipo(id) ON DELETE CASCADE,
        UNIQUE KEY unique_entry (campeonato_id, equipo_id)
      ) ENGINE=InnoDB;
    `
  },
  {
    name: 'invitacioncampeonatos',
    query: `
      CREATE TABLE IF NOT EXISTS invitacioncampeonatos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campeonato_id INT NOT NULL,
        equipo_id INT NOT NULL,
        de_usuario_id INT NOT NULL,
        para_usuario_id INT NOT NULL,
        mensaje TEXT,
        estado ENUM('pendiente', 'aceptado', 'rechazado') DEFAULT 'pendiente',
        tipo ENUM('invitacion', 'solicitud_union') DEFAULT 'invitacion',
        fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campeonato_id) REFERENCES Campeonato(id) ON DELETE CASCADE,
        FOREIGN KEY (equipo_id) REFERENCES Equipo(id) ON DELETE CASCADE,
        FOREIGN KEY (de_usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE,
        FOREIGN KEY (para_usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `
  },
  {
    name: 'fases',
    query: `
      CREATE TABLE IF NOT EXISTS fases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campeonato_id INT NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        orden INT DEFAULT 1,
        tipo ENUM('fase_grupos', 'eliminatoria', 'liga') DEFAULT 'fase_grupos',
        estado ENUM('activo', 'finalizado', 'pendiente') DEFAULT 'activo',
        fecha_inicio DATE,
        fecha_fin DATE,
        numero_equipos INT,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (campeonato_id) REFERENCES Campeonato(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `
  },
  {
    name: 'escenarios_deportivos',
    query: `
      CREATE TABLE IF NOT EXISTS escenarios_deportivos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        capacidad_espectadores INT,
        tamano VARCHAR(100),
        activa TINYINT(1) DEFAULT 1,
        horario_operacion TEXT,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `
  },
  {
    name: 'partidos',
    query: `
      CREATE TABLE IF NOT EXISTS partidos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fase_id INT NOT NULL,
        fecha DATETIME,
        escenario_id INT,
        equipo_local_id INT,
        equipo_visitante_id INT,
        puntos_local INT DEFAULT 0,
        puntos_visitante INT DEFAULT 0,
        estado ENUM('programado', 'en_curso', 'finalizado', 'cancelado') DEFAULT 'programado',
        partido_siguiente_id INT DEFAULT NULL,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (fase_id) REFERENCES fases(id) ON DELETE CASCADE,
        FOREIGN KEY (escenario_id) REFERENCES escenarios_deportivos(id) ON DELETE SET NULL,
        FOREIGN KEY (equipo_local_id) REFERENCES Equipo(id) ON DELETE CASCADE,
        FOREIGN KEY (equipo_visitante_id) REFERENCES Equipo(id) ON DELETE CASCADE,
        FOREIGN KEY (partido_siguiente_id) REFERENCES partidos(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `
  }
];

async function initDb() {
  console.log('Iniciando verificación de base de datos...');
  for (const table of tables) {
    try {
      await db.query(table.query);
      console.log('✅ Tabla "' + table.name + '" verificada/creada.');
    } catch (error) {
      console.error('❌ Error al crear tabla "' + table.name + '":', error.message);
    }
  }
  console.log('✅ Proceso de creación de tablas finalizado.');

  console.log('Iniciando migraciones incrementales...');
  const migrations = [
    {
      name: 'Add campeon_id to Campeonato',
      query: 'ALTER TABLE Campeonato ADD COLUMN IF NOT EXISTS campeon_id INT NULL'
    },
    {
      name: 'Add fk_campeon_equipo to Campeonato',
      query: 'ALTER TABLE Campeonato ADD CONSTRAINT fk_campeon_equipo FOREIGN KEY (campeon_id) REFERENCES Equipo(id) ON DELETE SET NULL',
      ignoreError: true
    },
    {
      name: 'Add tipo to invitacioncampeonatos',
      query: "ALTER TABLE invitacioncampeonatos ADD COLUMN IF NOT EXISTS tipo ENUM('invitacion', 'solicitud_union') DEFAULT 'invitacion'"
    }
  ];

  for (const m of migrations) {
    try {
      await db.query(m.query);
      console.log('✅ Migración "' + m.name + '" aplicada o ya existente.');
    } catch (error) {
      if (!m.ignoreError) {
        console.warn('⚠️ Advertencia en migración "' + m.name + '":', error.message);
      }
    }
  }

  console.log('🚀 Todo el proceso de base de datos ha finalizado.');
}

if (require.main === module) {
  initDb().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = initDb;
