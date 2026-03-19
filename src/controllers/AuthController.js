const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthController {
    static async register(req, res) {
        const data = req.body;
        const requiredFields = ['nombre', 'cedula', 'sexo', 'fecha_nacimiento', 'correo', 'password'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                return res.status(400).json({ error: `El campo '${field}' es obligatorio` });
            }
        }

        try {
            const hashedPassword = await bcrypt.hash(data.password, 10);
            
            const [result] = await db.query(`
                INSERT INTO Usuario (
                    nombre, cedula, sexo, fecha_nacimiento,
                    estado_salud, correo, password,
                    telefono, direccion, ciudad, pais,
                    url_foto_perfil, rol, fecha_registro, ultimo_login
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL)
            `, [
                data.nombre, data.cedula, data.sexo, data.fecha_nacimiento,
                data.estado_salud || null, data.correo, hashedPassword,
                data.telefono || null, data.direccion || null, data.ciudad || null, data.pais || null,
                data.url_foto_perfil || null, data.rol || 'player'
            ]);

            const [users] = await db.query('SELECT * FROM Usuario WHERE id = ?', [result.insertId]);
            const usuario = users[0];
            delete usuario.password;

            const payload = {
                sub: usuario.id,
                correo: usuario.correo,
                rol: usuario.rol,
                exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
            };
            const token = jwt.sign(payload, process.env.JWT_SECRET || 'clave_predeterminada_segura');

            return res.status(201).json({
                status: 201,
                message: 'Usuario registrado correctamente',
                data: { user: usuario, token }
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'La cédula o el correo ya están registrados' });
            }
            return res.status(500).json({ error: 'Error al registrar usuario', detalles: error.message });
        }
    }

    static async login(req, res) {
        const { correo, password } = req.body;

        if (!correo || !password) {
            return res.status(400).json({
                status: 400,
                message: 'Correo y contraseña son requeridos'
            });
        }

        try {
            const [users] = await db.query('SELECT * FROM Usuario WHERE correo = ?', [correo]);
            const usuario = users[0];

            if (!usuario) {
               return res.status(401).json({ status: 401, message: 'Credenciales incorrectas' });
            }

            // bcryptjs should handle PHP's $2y$ transparently, 
            // but for safety we replace the prefix in memory to $2a$
            const valid = await bcrypt.compare(password, usuario.password.replace(/^\\$2y\\$/, '$2a$') || usuario.password);
            if (!valid) {
                return res.status(401).json({
                    status: 401,
                    message: 'Credenciales incorrectas'
                });
            }

            await db.query('UPDATE Usuario SET ultimo_login = NOW() WHERE id = ?', [usuario.id]);

            delete usuario.password;

            const payload = {
                sub: usuario.id,
                correo: usuario.correo,
                rol: usuario.rol,
                exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
            };
            const token = jwt.sign(payload, process.env.JWT_SECRET || 'clave_predeterminada_segura');

            return res.status(200).json({
                status: 200,
                message: 'Inicio de sesión exitoso',
                data: { user: usuario, token }
            });
        } catch (error) {
            return res.status(500).json({
                status: 500,
                message: 'Error al iniciar sesión',
                details: error.message
            });
        }
    }

    static async me(req, res) {
        try {
            const userId = req.user.id;
            const [users] = await db.query(`
                SELECT id, nombre, cedula, sexo, fecha_nacimiento,
                    estado_salud, correo, telefono, direccion, ciudad, pais,
                    url_foto_perfil, rol, fecha_registro, ultimo_login
                FROM Usuario
                WHERE id = ?
            `, [userId]);

            const user = users[0];

            if (!user) {
                return res.status(404).json({
                    status: 404,
                    message: 'Usuario no encontrado'
                });
            }

            return res.status(200).json({
                status: 200,
                message: 'Inicio de sesión exitoso',
                data: { user }
            });
        } catch (error) {
            return res.status(500).json({
                status: 500,
                message: 'Error al obtener datos',
                details: error.message
            });
        }
    }
}

module.exports = AuthController;
