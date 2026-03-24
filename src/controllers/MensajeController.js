const db = require('../config/db');

exports.getHistorialAmigo = async (req, res) => {
    try {
        const userId = req.user.id;
        const amigoId = req.params.amigoId;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;
        const offset = (page - 1) * limit;

        const [rows] = await db.query(`
            SELECT m.*, u.nombre as emisor_nombre
            FROM Mensajes m
            JOIN Usuario u ON m.emisor_id = u.id
            WHERE (m.emisor_id = ? AND m.receptor_id = ?)
               OR (m.emisor_id = ? AND m.receptor_id = ?)
            ORDER BY m.fecha_envio DESC
            LIMIT ? OFFSET ?
        `, [userId, amigoId, amigoId, userId, limit, offset]);

        res.json({
            error: false,
            data: rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Error al obtener historial' });
    }
};

exports.getHistorialEquipo = async (req, res) => {
    try {
        const equipoId = req.params.equipoId;

        // Optionally, check if req.user.id is a member of the team here

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;
        const offset = (page - 1) * limit;

        const [rows] = await db.query(`
            SELECT m.*, u.nombre as emisor_nombre, u.url_foto_perfil
            FROM Mensajes m
            JOIN Usuario u ON m.emisor_id = u.id
            WHERE m.equipo_id = ?
            ORDER BY m.fecha_envio DESC
            LIMIT ? OFFSET ?
        `, [equipoId, limit, offset]);

        res.json({
            error: false,
            data: rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Error al obtener historial grupal' });
    }
};

exports.getResumen = async (req, res) => {
    try {
        const userId = req.user.id;

        const [amigosMensajes] = await db.query(`
            SELECT 
                CASE WHEN m.emisor_id = ? THEN m.receptor_id ELSE m.emisor_id END AS id,
                SUM(CASE WHEN m.receptor_id = ? AND m.leido = 0 THEN 1 ELSE 0 END) as unread_count,
                MAX(m.id) as last_msg_id
            FROM Mensajes m
            WHERE (m.emisor_id = ? AND m.receptor_id IS NOT NULL) 
               OR (m.receptor_id = ? AND m.emisor_id IS NOT NULL)
            GROUP BY id
        `, [userId, userId, userId, userId]);

        const [equiposMensajes] = await db.query(`
            SELECT 
                m.equipo_id as id,
                SUM(CASE WHEN m.fecha_envio > IFNULL(ecl.ultima_lectura, '2000-01-01') AND m.emisor_id != ? THEN 1 ELSE 0 END) as unread_count,
                MAX(m.id) as last_msg_id
            FROM Mensajes m
            LEFT JOIN EquipoChatLecturas ecl ON m.equipo_id = ecl.equipo_id AND ecl.usuario_id = ?
            WHERE m.equipo_id IN (
                SELECT id FROM Equipo WHERE propietario_id = ?
                UNION
                SELECT equipo_id FROM miembrosequipo WHERE usuario_id = ? AND activo = 1
            )
            GROUP BY m.equipo_id
        `, [userId, userId, userId, userId]);

        let resumenAmigos = {};
        for (const meta of amigosMensajes) {
            if (meta.last_msg_id) {
                const [lastMsgRows] = await db.query('SELECT mensaje, fecha_envio FROM Mensajes WHERE id = ?', [meta.last_msg_id]);
                resumenAmigos[meta.id] = {
                    unread_count: Number(meta.unread_count) || 0,
                    ultimo_mensaje: lastMsgRows[0] ? lastMsgRows[0].mensaje : null,
                    fecha_ultimo_mensaje: lastMsgRows[0] ? lastMsgRows[0].fecha_envio : null
                };
            }
        }

        let resumenEquipos = {};
        for (const meta of equiposMensajes) {
            if (meta.last_msg_id) {
                const [lastMsgRows] = await db.query('SELECT mensaje, fecha_envio FROM Mensajes WHERE id = ?', [meta.last_msg_id]);
                resumenEquipos[meta.id] = {
                    unread_count: Number(meta.unread_count) || 0,
                    ultimo_mensaje: lastMsgRows[0] ? lastMsgRows[0].mensaje : null,
                    fecha_ultimo_mensaje: lastMsgRows[0] ? lastMsgRows[0].fecha_envio : null
                };
            }
        }

        res.json({
            error: false,
            data: {
                amigos: resumenAmigos,
                equipos: resumenEquipos
            }
        });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Error al obtener resumen de chats' });
    }
};

exports.marcarAmigoLeido = async (req, res) => {
    try {
        const userId = req.user.id;
        const amigoId = req.params.amigoId;
        await db.query('UPDATE Mensajes SET leido = 1 WHERE emisor_id = ? AND receptor_id = ? AND leido = 0', [amigoId, userId]);
        res.json({ error: false, message: 'Mensajes marcados' });
    } catch (err) {
        res.status(500).json({ error: true, message: 'Error al marcar leído' });
    }
};

exports.marcarEquipoLeido = async (req, res) => {
    try {
        const userId = req.user.id;
        const equipoId = req.params.equipoId;
        await db.query('INSERT INTO EquipoChatLecturas (usuario_id, equipo_id, ultima_lectura) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE ultima_lectura = NOW()', [userId, equipoId]);
        res.json({ error: false, message: 'Chat grupal marcado' });
    } catch (err) {
        res.status(500).json({ error: true, message: 'Error al marcar equipo' });
    }
};
