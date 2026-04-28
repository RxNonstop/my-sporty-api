const db = require('../config/db');
const socketManager = require('../sockets/socketManager');

class InvitacionEquipoController {
    static async index(req, res) {
        try {
            const [invitaciones] = await db.query(`
                SELECT ie.*, u.nombre as de_usuario_nombre, e.nombre as equipo_nombre 
                FROM invitacion_equipo ie 
                JOIN usuario u ON ie.de_usuario_id = u.id 
                JOIN equipo e ON ie.equipo_id = e.id 
                WHERE ie.para_usuario_id = ? AND ie.estado = 'pendiente'
            `, [req.user.id]);
            return res.json({ status: 200, message: 'Invitaciones obtenidas', data: { invitaciones } });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', data: { detalles: error.message } });
        }
    }

    static async store(req, res) {
        try {
            const data = req.body;
            if (!data.para_usuario_id || !data.equipo_id) {
                return res.status(400).json({ status: 400, message: 'Faltan campos obligatorios' });
            }
            if (req.user.id == data.para_usuario_id) {
                return res.status(400).json({ status: 400, message: 'No puedes invitarte a ti mismo' });
            }

            const [existente] = await db.query("SELECT * FROM invitacion_equipo WHERE para_usuario_id = ? AND equipo_id = ? AND estado = 'pendiente'", [data.para_usuario_id, data.equipo_id]);
            if (existente.length > 0) return res.status(409).json({ status: 409, message: 'La invitación ya existe', data: null });

            await db.query(`
                INSERT INTO invitacion_equipo (de_usuario_id, para_usuario_id, equipo_id, mensaje, estado, fecha_envio) 
                VALUES (?, ?, ?, ?, 'pendiente', NOW())
            `, [req.user.id, data.para_usuario_id, data.equipo_id, data.mensaje || null]);

            socketManager.notifyUser(data.para_usuario_id, 'nueva_notificacion');

            return res.status(201).json({ status: 201, message: 'Invitacion enviada' });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', data: { detalles: error.message } });
        }
    }

    static async update(req, res) {
        const connection = await db.getConnection();
        try {
            const data = req.body;
            const estado = data.estado;
            const id = req.params.id;

            if (!['aceptado', 'rechazado'].includes(estado)) {
                return res.status(400).json({ status: 400, message: 'Estado inválido' });
            }

            await connection.beginTransaction();

            const [invCheck] = await connection.query('SELECT * FROM invitacion_equipo WHERE id = ? AND para_usuario_id = ?', [id, req.user.id]);
            if (!invCheck[0]) {
                await connection.rollback();
                return res.status(404).json({ status: 404, message: 'No encontrado' });
            }

            if (estado === 'aceptado') {
                const [miembroExistente] = await connection.query('SELECT * FROM miembros_equipo WHERE usuario_id = ? AND equipo_id = ?', [req.user.id, invCheck[0].equipo_id]);
                if (miembroExistente.length > 0) {
                    await connection.query('UPDATE miembros_equipo SET activo = 1 WHERE id = ?', [miembroExistente[0].id]);
                } else {
                    console.log('Aceptando invitación para usuario', req.user.id, 'al equipo', invCheck[0].equipo_id);
                    await connection.query('INSERT INTO miembros_equipo (usuario_id, equipo_id, rol_usuario, activo) VALUES (?, ?, "jugador", 1)', [req.user.id, invCheck[0].equipo_id]);
                }
            }

            await connection.query('DELETE FROM invitacion_equipo WHERE id = ?', [id]);
            
            await connection.commit();
            return res.json({ status: 200, message: 'Invitación procesada', data: null });
        } catch (error) {
            if (connection) await connection.rollback();
            return res.status(500).json({ 
                status: 500, 
                message: 'Error al Aceptar', 
                sqlError: error.sqlMessage || error.message,
                code: error.code
            });
        } finally {
            connection.release();
        }
    }

    static async delete(req, res) {
        try {
            const [result] = await db.query('DELETE FROM invitacion_equipo WHERE id = ? AND para_usuario_id = ?', [req.params.id, req.user.id]);
            if (result.affectedRows > 0) return res.json({ status: 200, message: 'Eliminado' });
            return res.status(404).json({ status: 404, message: 'No encontrado' });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', data: error.message });
        }
    }
}

module.exports = InvitacionEquipoController;
