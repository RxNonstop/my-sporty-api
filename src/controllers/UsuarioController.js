const db = require('../config/db');
const bcrypt = require('bcryptjs');

class UsuarioController {
    static async index(req, res) {
        try {
            const [usuarios] = await db.query('SELECT * FROM usuario');
            return res.json({
                status: 200,
                message: 'Usuarios obtenidos correctamente',
                data: usuarios
            });
        } catch (error) {
            return res.status(500).json({
                status: 500,
                message: 'Error al obtener usuarios',
                details: error.message
            });
        }
    }

    static async show(req, res) {
        try {
            const [users] = await db.query('SELECT * FROM usuario WHERE id = ?', [req.params.id]);
            const usuario = users[0];

            if (usuario) {
                return res.json({
                    status: 200,
                    message: 'Usuario obtenido correctamente',
                    data: usuario
                });
            } else {
                return res.status(404).json({
                    status: 404,
                    message: 'Usuario no encontrado'
                });
            }
        } catch (error) {
            return res.status(500).json({
                status: 500,
                message: 'Error al obtener usuario',
                details: error.message
            });
        }
    }

    static async showByEmail(req, res) {
        try {
            const { email } = req.body;
            const [users] = await db.query('SELECT * FROM usuario WHERE correo = ?', [email]);
            const usuario = users[0];

            if (usuario) {
                return res.json({
                    status: 200,
                    message: 'Usuario obtenido correctamente',
                    data: usuario
                });
            } else {
                return res.status(404).json({
                    status: 404,
                    message: 'Usuario no encontrado'
                });
            }
        } catch (error) {
            return res.status(500).json({
                status: 500,
                message: 'Error al obtener usuario',
                details: error.message
            });
        }
    }

    static async update(req, res) {
        const data = req.body;
        const id = req.params.id;

        if (!data || Object.keys(data).length === 0) {
            return res.status(400).json({
                status: 400,
                message: 'No se proporcionaron datos para actualizar'
            });
        }

        try {
            const hashedPassword = data.contraseña ? await bcrypt.hash(data.contraseña, 10) : undefined;
            const passwordField = data.contraseña || data.password;
            const finalPassword = hashedPassword || passwordField ? await bcrypt.hash(passwordField, 10) : undefined;

            const [result] = await db.query(`
                UPDATE usuario SET
                    nombre = COALESCE(?, nombre),
                    cedula = COALESCE(?, cedula),
                    sexo = COALESCE(?, sexo),
                    fecha_nacimiento = COALESCE(?, fecha_nacimiento),
                    estado_salud = COALESCE(?, estado_salud),
                    correo = COALESCE(?, correo),
                    password = COALESCE(?, password),
                    telefono = COALESCE(?, telefono),
                    direccion = COALESCE(?, direccion),
                    ciudad = COALESCE(?, ciudad),
                    pais = COALESCE(?, pais),
                    url_foto_perfil = COALESCE(?, url_foto_perfil),
                    rol = COALESCE(?, rol)
                WHERE id = ?
            `, [
                data.nombre,
                data.cedula,
                data.sexo,
                data.fecha_nacimiento,
                data.estado_salud,
                data.correo,
                finalPassword,
                data.telefono,
                data.direccion,
                data.ciudad,
                data.pais,
                data.url_foto_perfil,
                data.rol,
                id
            ]);

            if (result.affectedRows > 0) {
                const [users] = await db.query('SELECT * FROM usuario WHERE id = ?', [id]);
                return res.json({
                    status: 200,
                    message: 'Usuario actualizado correctamente',
                    data: users[0]
                });
            } else {
                return res.status(404).json({
                    status: 404,
                    message: 'Usuario no encontrado o sin cambios'
                });
            }
        } catch (error) {
            return res.status(500).json({
                status: 500,
                message: 'Error al actualizar usuario',
                details: error.message
            });
        }
    }

    static async delete(req, res) {
        try {
            const [result] = await db.query('DELETE FROM usuario WHERE id = ?', [req.params.id]);

            if (result.affectedRows > 0) {
                return res.json({
                    status: 200,
                    message: 'Usuario eliminado correctamente'
                });
            } else {
                return res.status(404).json({
                    status: 404,
                    message: 'Usuario no encontrado'
                });
            }
        } catch (error) {
            return res.status(500).json({
                status: 500,
                message: 'Error al eliminar usuario',
                details: error.message
            });
        }
    }

    static async updatePushToken(req, res) {
        const { token } = req.body;
        const userId = req.user.id; // Asumiendo que viene del middleware de auth

        if (!token) {
            return res.status(400).json({
                status: 400,
                message: 'No se proporcionó un token'
            });
        }

        try {
            console.log(`[Push] Intentando actualizar token para usuario ${userId}: ${token}`);
            await db.query('UPDATE usuario SET push_token = ? WHERE id = ?', [token, userId]);
            return res.json({
                status: 200,
                message: 'Token de notificación actualizado correctamente'
            });
        } catch (error) {
            return res.status(500).json({
                status: 500,
                message: 'Error al actualizar el token de notificación',
                details: error.message
            });
        }
    }
}

module.exports = UsuarioController;
