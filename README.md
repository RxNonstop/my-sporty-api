# API Node.js - DeportProyect

Este proyecto es la migración a Node.js y Express del backend original estructurado en PHP.

## Comandos Útiles

- **Instalar dependencias:** 
  ```bash
  npm install
  ```
- **Iniciar el servidor:** 
  ```bash
  node src/index.js
  ```
- **Instalar modo desarrollo (opcional para reinicios automáticos):** 
  ```bash
  npm install -D nodemon
  npx nodemon src/index.js
  ```
*(Asegúrate siempre de tener configurado tu archivo `.env` en la raíz de `api-node-deport` con los datos de tu base de datos).*

---

## Estructura del Proyecto

- `src/config/`: Contiene la configuración (conexión a la base de datos MySQL).
- `src/controllers/`: Contiene la lógica y las operaciones transaccionales para cada módulo.
- `src/middlewares/`: Funciones interceptoras, como validación y protección JWT (`auth.js`).
- `src/routes/`: Declaración de URLs y mapeo hacia los métodos de los controladores.
- `src/index.js`: Archivo principal. Monta Express, inyecta los middlewares generales y enruta las peticiones iniciales.

---

## Cómo crear un nuevo módulo (Paso a Paso)

Si en el futuro necesitas agregar nueva lógica (por ejemplo, para una funcionalidad llamada **Notificaciones**), debes aplicar el modelo arquitectónico implementado. Solo sigue estos tres pasos:

### 1. Crear el Controlador
Crea un archivo en `src/controllers/NotificacionController.js`. Este se encargará de interactuar con la Base de Datos usando consultas (queries) y responder al cliente con JSON, equivalente a tus antiguos Controladores + Modelos de PHP en un solo lugar centralizado:

```javascript
const db = require('../config/db');

class NotificacionController {
    static async index(req, res) {
        try {
            // "req.user.id" existe si aplicas authMiddleware en la ruta
            const [notificaciones] = await db.query('SELECT * FROM notificaciones WHERE usuario_id = ?', [req.user.id]);
            return res.json({ status: 200, message: 'Éxito', data: notificaciones });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error en el servidor', details: error.message });
        }
    }

    static async store(req, res) {
        try {
            const data = req.body; // Equivale a json_decode(file_get_contents("php://input"))
            await db.query('INSERT INTO notificaciones (titulo, usuario_id) VALUES (?, ?)', [data.titulo, req.user.id]);
            return res.status(201).json({ status: 201, message: 'Creada exitosamente' });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }
}

module.exports = NotificacionController;
```

### 2. Crear las Rutas (Endpoints)
Crea una definición en `src/routes/notificaciones.js` indicando con qué método HTTP (`GET`, `POST`, `PUT`, `DELETE`) será accesible tu nuevo controlador.

```javascript
const express = require('express');
const router = express.Router();
const NotificacionController = require('../controllers/NotificacionController');
const authMiddleware = require('../middlewares/auth'); 

// 1. Proteger las rutas debajo de esta línea (exige el header "Authorization: Bearer <token>")
router.use(authMiddleware);

// 2. Definir los endpoints
router.get('/', NotificacionController.index);
router.post('/', NotificacionController.store);
// router.get('/:id', NotificacionController.show);
// router.patch('/:id', NotificacionController.update);
// router.delete('/:id', NotificacionController.delete);

module.exports = router;
```

### 3. Registrar el archivo de Rutas en la aplicación principal
Para que Express interprete las peticiones a la URL de notificaciones, debes vincular tu archivo en el archivo maestro de rutas. 

Dirígete a `src/routes/index.js` y añade:

```javascript
// ... otros imports ...
const notificacionesRoutes = require('./notificaciones');

// ... otras rutas
router.use('/notificaciones', notificacionesRoutes);

module.exports = router;
```

**Resultado:** Al encender el servidor podrás hacer peticiones asíncronas hacia el prefijo asignado: `GET http://localhost:3000/api/notificaciones` o `POST http://localhost:3000/api/notificaciones`.

---

## 🛠 Ejemplos Prácticos para Postman

A continuación, tienes ejemplos directos sobre cómo estructurar tus peticiones hacia la API desde Postman (asumiendo que corre en `localhost:3000`).

### 1. Registrar un Usuario (Auth Exenta)
- **Método:** `POST`
- **URL:** `http://localhost:3000/api/auth/register`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "nombre": "Juan Perez",
  "correo": "juan.perez@example.com",
  "password": "Mypassword123",
  "fecha_nacimiento": "1990-05-15"
}
```

### 2. Iniciar Sesión (Login)
- **Método:** `POST`
- **URL:** `http://localhost:3000/api/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "correo": "juan.perez@example.com",
  "password": "Mypassword123"
}
```
*(Guarda el `token` que te devuelva la respuesta porque será usado en todas las peticiones protegidas).*

### 3. Configurar Autorización (Bearer Token) en Postman
Para cualquier ruta protegida (las que pasan por `authMiddleware`), debes configurar tu token en Postman:
1. Dirígete a la pestaña **Authorization**.
2. Selecciona el tipo **Bearer Token**.
3. Pega en la casilla derecha el token JWT devuelto en el inicio de sesión.

### 4. Consultar tu Perfil (/me)
- **Método:** `GET`
- **URL:** `http://localhost:3000/api/auth/me`
- **Authorization:** `Bearer Token` (El configurado en el paso anterior).
- **Body:** Ninguno (el token contiene internamente el `user_id`).

### 5. Crear un Campeonato (Protegido)
- **Método:** `POST`
- **URL:** `http://localhost:3000/api/campeonatos`
- **Authorization:** `Bearer Token`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "nombre": "Torneo Relámpago",
  "descripcion": "Campeonato de prueba",
  "deporte": "Fútbol 5",
  "tipo": "publico",
  "estado": "borrador"
}
```

### 6. Buscar un Escenario Deportivo
- **Método:** `GET`
- **URL:** `http://localhost:3000/api/escenarios-deportivos/buscar/Cancha`
- **Authorization:** `Bearer Token`

### 7. Enviar una solicitud de Amistad
- **Método:** `POST`
- **URL:** `http://localhost:3000/api/solicitudes-amistad`
- **Authorization:** `Bearer Token`
- **Body (raw JSON):**
```json
{
  "para_usuario_id": 2
}
```
