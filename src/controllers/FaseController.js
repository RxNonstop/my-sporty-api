const db = require('../config/db');
const FixtureService = require('../services/FixtureService');

class FaseController {
    static async index(req, res) {
        try {
            const [items] = await db.query('SELECT * FROM fases');
            return res.json({ status: 200, message: 'Fases obtenidas', data: items });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }

    static async show(req, res) {
        try {
            const [items] = await db.query('SELECT * FROM fases WHERE id = ?', [req.params.id]);
            if (items[0]) return res.json({ status: 200, message: 'Fase obtenida', data: items[0] });
            return res.status(404).json({ status: 404, message: 'No encontrado' });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }

    static async showByCampeonato(req, res) {
        try {
            const [items] = await db.query('SELECT * FROM fases WHERE campeonato_id = ?', [req.params.campeonato_id]);
            return res.json({ status: 200, message: 'Fases obtenidas', data: items });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }

    static async store(req, res) {
        try {
            const data = req.body;
            const [result] = await db.query(`
                INSERT INTO fases (campeonato_id, nombre, orden, tipo, estado, fecha_inicio, fecha_fin, numero_equipos) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [data.campeonato_id, data.nombre, data.orden || 1, data.tipo || 'fase_grupos', data.estado || 'activo', data.fecha_inicio || null, data.fecha_fin || null, data.numero_equipos || null]);
            
            await FixtureService.regenerate(data.campeonato_id);

            const [items] = await db.query('SELECT * FROM fases WHERE id = ?', [result.insertId]);
            return res.status(201).json({ status: 201, message: 'Creado', data: items[0] });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }

    static async update(req, res) {
        try {
            const data = req.body;
            const id = req.params.id;
            await db.query(`
                UPDATE fases 
                SET campeonato_id = COALESCE(?, campeonato_id), 
                    nombre = COALESCE(?, nombre), 
                    orden = COALESCE(?, orden), 
                    tipo = COALESCE(?, tipo), 
                    estado = COALESCE(?, estado), 
                    fecha_inicio = COALESCE(?, fecha_inicio), 
                    fecha_fin = COALESCE(?, fecha_fin), 
                    numero_equipos = COALESCE(?, numero_equipos), 
                    actualizado_en = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [data.campeonato_id, data.nombre, data.orden, data.tipo, data.estado, data.fecha_inicio, data.fecha_fin, data.numero_equipos, id]);
            
            const [items] = await db.query('SELECT * FROM fases WHERE id = ?', [id]);
            if (items[0]) return res.json({ status: 200, message: 'Actualizado', data: items[0] });
            return res.status(404).json({ status: 404, message: 'No encontrado' });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const [fase] = await db.query('SELECT campeonato_id FROM fases WHERE id = ?', [req.params.id]);
            if (!fase[0]) return res.status(404).json({ status: 404, message: 'No encontrado' });

            const [result] = await db.query('DELETE FROM fases WHERE id = ?', [req.params.id]);
            if (result.affectedRows > 0) {
                await FixtureService.regenerate(fase[0].campeonato_id);
                return res.json({ status: 200, message: 'Eliminado' });
            }
            return res.status(404).json({ status: 404, message: 'No encontrado' });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }
}
module.exports = FaseController;
