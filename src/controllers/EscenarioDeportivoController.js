const db = require('../config/db');

class EscenarioDeportivoController {
    static async index(req, res) {
        try {
            const [items] = await db.query('SELECT * FROM escenarios_deportivos');
            return res.json({ status: 200, message: 'Escenarios obtenidos', data: items });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }

    static async show(req, res) {
        try {
            const [items] = await db.query('SELECT * FROM escenarios_deportivos WHERE id = ?', [req.params.id]);
            if (items[0]) return res.json({ status: 200, message: 'Escenario obtenido', data: items[0] });
            return res.status(404).json({ status: 404, message: 'No encontrado' });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }

    static async showByName(req, res) {
        try {
            const nombre = req.params.nombre || (req.query.nombre) || '';
            const [items] = await db.query('SELECT * FROM escenarios_deportivos WHERE nombre LIKE ?', [`%${nombre}%`]);
            if (items.length > 0) return res.json({ status: 200, message: 'Escenarios obtenidos', data: items });
            return res.status(404).json({ status: 404, message: 'No encontrado' });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }

    static async store(req, res) {
        try {
            const data = req.body;
            const [result] = await db.query(`
                INSERT INTO escenarios_deportivos (nombre, capacidad_espectadores, tamano, activa, horario_operacion) 
                VALUES (?, ?, ?, ?, ?)
            `, [data.nombre, data.capacidad_espectadores || null, data.tamano || null, data.activa !== undefined ? data.activa : 1, data.horario_operacion || null]);
            
            const [items] = await db.query('SELECT * FROM escenarios_deportivos WHERE id = ?', [result.insertId]);
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
                UPDATE escenarios_deportivos 
                SET nombre = COALESCE(?, nombre),
                    capacidad_espectadores = COALESCE(?, capacidad_espectadores), 
                    tamano = COALESCE(?, tamano), 
                    activa = COALESCE(?, activa), 
                    horario_operacion = COALESCE(?, horario_operacion), 
                    actualizado_en = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [data.nombre, data.capacidad_espectadores, data.tamano, data.activa, data.horario_operacion, id]);
            
            const [items] = await db.query('SELECT * FROM escenarios_deportivos WHERE id = ?', [id]);
            if (items[0]) return res.json({ status: 200, message: 'Actualizado', data: items[0] });
            return res.status(404).json({ status: 404, message: 'No encontrado' });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const [result] = await db.query('DELETE FROM escenarios_deportivos WHERE id = ?', [req.params.id]);
            if (result.affectedRows > 0) return res.json({ status: 200, message: 'Eliminado' });
            return res.status(404).json({ status: 404, message: 'No encontrado' });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }
}
module.exports = EscenarioDeportivoController;
