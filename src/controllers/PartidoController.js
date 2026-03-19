const db = require('../config/db');

class PartidoController {
    static async index(req, res) {
        try {
            const [items] = await db.query('SELECT * FROM partidos');
            return res.json({ status: 200, message: 'Partidos obtenidos', data: items });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }

    static async show(req, res) {
        try {
            const [items] = await db.query('SELECT * FROM partidos WHERE id = ?', [req.params.id]);
            if (items[0]) return res.json({ status: 200, message: 'Partido obtenido', data: items[0] });
            return res.status(404).json({ status: 404, message: 'No encontrado' });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }

    static async showByFase(req, res) {
        try {
            const [items] = await db.query(`
                SELECT p.*, el.nombre as equipo_local_nombre, ev.nombre as equipo_visitante_nombre 
                FROM partidos p
                LEFT JOIN equipo el ON p.equipo_local_id = el.id
                LEFT JOIN equipo ev ON p.equipo_visitante_id = ev.id
                WHERE p.fase_id = ?
            `, [req.params.fase_id]);
            return res.json({ status: 200, message: 'Partidos obtenidos', data: items });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }

    static async buscarPorFecha(req, res) {
        try {
            const { inicio, fin } = req.params;
            const [items] = await db.query('SELECT * FROM partidos WHERE fecha BETWEEN ? AND ?', [inicio, fin]);
            return res.json({ status: 200, message: 'Partidos obtenidos', data: items });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }

    static async store(req, res) {
        try {
            const data = req.body;
            const [result] = await db.query(`
                INSERT INTO partidos (fase_id, fecha, escenario_id, equipo_local_id, equipo_visitante_id, puntos_local, puntos_visitante, estado) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [data.fase_id, data.fecha, data.escenario_id || null, data.equipo_local_id, data.equipo_visitante_id, data.puntos_local || null, data.puntos_visitante || null, data.estado || 'programado']);
            
            const [items] = await db.query('SELECT * FROM partidos WHERE id = ?', [result.insertId]);
            return res.status(201).json({ status: 201, message: 'Creado', data: items[0] });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }

    static async update(req, res) {
        try {
            const data = req.body;
            const id = req.params.id;

            // Verify the caller is the championship owner
            const [partidoRows] = await db.query(`
                SELECT c.propietario_id
                FROM partidos p
                JOIN fases f ON p.fase_id = f.id
                JOIN Campeonato c ON f.campeonato_id = c.id
                WHERE p.id = ?
            `, [id]);
            if (partidoRows.length === 0) {
                return res.status(404).json({ status: 404, message: 'Partido no encontrado' });
            }
            if (partidoRows[0].propietario_id != req.user.id) {
                return res.status(403).json({ status: 403, message: 'Solo el propietario del campeonato puede actualizar resultados' });
            }

            await db.query(`
                UPDATE partidos 
                SET fase_id = COALESCE(?, fase_id), 
                    fecha = COALESCE(?, fecha), 
                    escenario_id = COALESCE(?, escenario_id), 
                    equipo_local_id = COALESCE(?, equipo_local_id), 
                    equipo_visitante_id = COALESCE(?, equipo_visitante_id), 
                    puntos_local = COALESCE(?, puntos_local), 
                    puntos_visitante = COALESCE(?, puntos_visitante), 
                    estado = COALESCE(?, estado), 
                    actualizado_en = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [data.fase_id, data.fecha, data.escenario_id, data.equipo_local_id, data.equipo_visitante_id, data.puntos_local, data.puntos_visitante, data.estado, id]);
            
            if (data.estado === 'finalizado') {
                const [partidoActual] = await db.query(`
                    SELECT p.*, f.tipo as fase_tipo, f.campeonato_id 
                    FROM partidos p 
                    JOIN fases f ON p.fase_id = f.id 
                    WHERE p.id = ?
                `, [id]);
                
                if (partidoActual[0]) {
                    if (partidoActual[0].partido_siguiente_id && partidoActual[0].fase_tipo === 'eliminatoria') {
                        const localId = data.equipo_local_id || partidoActual[0].equipo_local_id;
                        const visitanteId = data.equipo_visitante_id || partidoActual[0].equipo_visitante_id;
                        const pL = parseInt(data.puntos_local !== undefined ? data.puntos_local : partidoActual[0].puntos_local || 0);
                        const pV = parseInt(data.puntos_visitante !== undefined ? data.puntos_visitante : partidoActual[0].puntos_visitante || 0);
                        
                        let winnerId = null;
                        if (pL > pV) winnerId = localId;
                        else if (pV > pL) winnerId = visitanteId;
                        
                        if (winnerId) {
                            const [nextMatch] = await db.query('SELECT * FROM partidos WHERE id = ?', [partidoActual[0].partido_siguiente_id]);
                            if (nextMatch[0]) {
                                if (!nextMatch[0].equipo_local_id || nextMatch[0].equipo_local_id === localId || nextMatch[0].equipo_local_id === visitanteId) {
                                    await db.query('UPDATE partidos SET equipo_local_id = ? WHERE id = ?', [winnerId, nextMatch[0].id]);
                                } else if (!nextMatch[0].equipo_visitante_id || nextMatch[0].equipo_visitante_id === localId || nextMatch[0].equipo_visitante_id === visitanteId) {
                                    await db.query('UPDATE partidos SET equipo_visitante_id = ? WHERE id = ?', [winnerId, nextMatch[0].id]);
                                }
                            }
                        }
                    }

                    if (partidoActual[0].fase_tipo === 'liga') {
                        const [matchCounts] = await db.query(`
                            SELECT COUNT(*) as total, SUM(IF(estado = 'finalizado', 1, 0)) as finished
                            FROM partidos WHERE fase_id = ?
                        `, [partidoActual[0].fase_id]);
                        
                        if (matchCounts[0].total > 0 && matchCounts[0].total === matchCounts[0].finished) {
                            // Determine champion: top team by pts, then dg, then gf
                            const [partidos] = await db.query(`
                                SELECT 
                                    e.id as equipo_id,
                                    SUM(IF(p.equipo_local_id = e.id AND p.puntos_local > p.puntos_visitante, 3,
                                        IF(p.equipo_local_id = e.id AND p.puntos_local = p.puntos_visitante, 1,
                                        IF(p.equipo_visitante_id = e.id AND p.puntos_visitante > p.puntos_local, 3,
                                        IF(p.equipo_visitante_id = e.id AND p.puntos_visitante = p.puntos_local, 1, 0))))) as pts,
                                    SUM(IF(p.equipo_local_id = e.id, p.puntos_local, p.puntos_visitante)) -
                                    SUM(IF(p.equipo_local_id = e.id, p.puntos_visitante, p.puntos_local)) as dg,
                                    SUM(IF(p.equipo_local_id = e.id, p.puntos_local, p.puntos_visitante)) as gf
                                FROM equipo e
                                JOIN partidos p ON (p.equipo_local_id = e.id OR p.equipo_visitante_id = e.id)
                                WHERE p.fase_id = ? AND p.estado = 'finalizado' AND e.id IS NOT NULL
                                GROUP BY e.id
                                ORDER BY pts DESC, dg DESC, gf DESC
                                LIMIT 1
                            `, [partidoActual[0].fase_id]);

                            const campeonId = partidos[0]?.equipo_id || null;
                            await db.query('UPDATE Campeonato SET estado = ?, campeon_id = ? WHERE id = ?', ['finalizado', campeonId, partidoActual[0].campeonato_id]);
                        }
                    }
                }
            }

            const [items] = await db.query('SELECT * FROM partidos WHERE id = ?', [id]);
            if (items[0]) return res.json({ status: 200, message: 'Actualizado', data: items[0] });
            return res.status(404).json({ status: 404, message: 'No encontrado' });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const [result] = await db.query('DELETE FROM partidos WHERE id = ?', [req.params.id]);
            if (result.affectedRows > 0) return res.json({ status: 200, message: 'Eliminado' });
            return res.status(404).json({ status: 404, message: 'No encontrado' });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }
}
module.exports = PartidoController;
