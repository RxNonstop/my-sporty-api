const db = require('../config/db');

class EstadisticaController {
    static async getPosicionesPorFase(req, res) {
        try {
            const fase_id = req.params.fase_id;
            
            // Get all finalized matches for this phase
            const [partidos] = await db.query(`
                SELECT * FROM partidos 
                WHERE fase_id = ? AND estado = 'finalizado'
            `, [fase_id]);
            
            // Get all teams in this phase (even if no matches played yet)
            const stats = {};
            
            const [equiposDb] = await db.query(`
                SELECT DISTINCT e.id, e.nombre 
                FROM partidos p
                JOIN equipo e ON (e.id = p.equipo_local_id OR e.id = p.equipo_visitante_id)
                WHERE p.fase_id = ? AND e.id IS NOT NULL
            `, [fase_id]);
            
            equiposDb.forEach(e => {
                stats[e.id] = {
                    equipo_id: e.id,
                    nombre: e.nombre,
                    pj: 0, // Partidos Jugados
                    pg: 0, // Partidos Ganados
                    pe: 0, // Partidos Empatados
                    pp: 0, // Partidos Perdidos
                    gf: 0, // Goles a Favor
                    gc: 0, // Goles en Contra
                    dg: 0, // Diferencia de Goles
                    pts: 0 // Puntos
                };
            });
            
            partidos.forEach(p => {
                const local = p.equipo_local_id;
                const visitante = p.equipo_visitante_id;
                const gl = parseInt(p.puntos_local || 0);
                const gv = parseInt(p.puntos_visitante || 0);
                
                if (local && stats[local] && visitante) {
                    stats[local].pj++;
                    stats[local].gf += gl;
                    stats[local].gc += gv;
                    stats[local].dg += (gl - gv);
                    
                    if (gl > gv) { stats[local].pg++; stats[local].pts += 3; }
                    else if (gl === gv) { stats[local].pe++; stats[local].pts += 1; }
                    else { stats[local].pp++; }
                }
                
                if (visitante && stats[visitante] && local) {
                    stats[visitante].pj++;
                    stats[visitante].gf += gv;
                    stats[visitante].gc += gl;
                    stats[visitante].dg += (gv - gl);
                    
                    if (gv > gl) { stats[visitante].pg++; stats[visitante].pts += 3; }
                    else if (gv === gl) { stats[visitante].pe++; stats[visitante].pts += 1; }
                    else { stats[visitante].pp++; }
                }
            });
            
            // Convert to array and sort: Pts, DG, GF
            const tabla = Object.values(stats).sort((a, b) => {
                if (b.pts !== a.pts) return b.pts - a.pts;
                if (b.dg !== a.dg) return b.dg - a.dg;
                return b.gf - a.gf;
            });
            
            return res.json({ status: 200, message: 'Tabla de posiciones', data: tabla });
        } catch (error) {
            return res.status(500).json({ status: 500, message: 'Error', details: error.message });
        }
    }
}

module.exports = EstadisticaController;
