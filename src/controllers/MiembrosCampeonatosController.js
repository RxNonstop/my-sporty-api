const db = require('../config/db');

class MiembrosCampeonatosController {
    static async show(req, res) {
        try {
            const campeonatoId = req.params.id;
            const [miembros] = await db.query(`
                SELECT mc.*, e.nombre as equipo_nombre
                FROM miembros_campeonatos mc
                JOIN equipo e ON mc.equipo_id = e.id
                WHERE mc.campeonato_id = ? AND mc.activo = 1
            `, [campeonatoId]);

            return res.json({ status: 200, message: 'Miembros obtenidos', data: miembros });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }

    static async update(req, res) {
        try {
            const id = req.params.id;
            const data = req.body;
            if (!data.campeonato_id || !data.equipo_id) return res.status(400).json({ status: 400, message: 'Faltan campos' });

            const [result] = await db.query('UPDATE miembros_campeonatos SET activo = 0 WHERE campeonato_id = ? AND equipo_id = ?', [data.campeonato_id, data.equipo_id]);
            
            if (result.affectedRows > 0) return res.json({ status: 200, message: 'Desactivado' });
            return res.status(404).json({ status: 404, message: 'No encontrado' });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const [result] = await db.query('DELETE FROM miembros_campeonatos WHERE id = ?', [req.params.id]);
            if (result.affectedRows > 0) return res.json({ status: 200, message: 'Eliminado' });
            return res.status(404).json({ status: 404, message: 'No encontrado' });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }
}
module.exports = MiembrosCampeonatosController;
