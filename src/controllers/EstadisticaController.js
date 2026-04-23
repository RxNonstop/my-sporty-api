const db = require("../config/db");

class EstadisticaController {
  static async getPosicionesPorFase(req, res) {
    try {
      const fase_id = req.params.fase_id;

      // Get phase information to check if it's a group phase
      const [faseInfo] = await db.query(
        `SELECT tipo, numero_grupos FROM fases WHERE id = ?`,
        [fase_id]
      );

      const isGroupPhase = faseInfo[0] && (faseInfo[0].tipo === 'fase_grupos' || faseInfo[0].tipo === 'grupos');
      const numeroGrupos = faseInfo[0]?.numero_grupos || 1;

      if (isGroupPhase && numeroGrupos > 1) {
        // Get positions by groups
        const grupos = [];

        for (let grupoNum = 1; grupoNum <= numeroGrupos; grupoNum++) {
          // Get finalized matches for this specific group
          const [partidos] = await db.query(
            `
                    SELECT * FROM partidos
                    WHERE fase_id = ? AND estado = 'finalizado' AND grupo_numero = ?
                `,
            [fase_id, grupoNum],
          );

          // Get all teams in this group - for group phases, get teams from championship
          const [equiposDb] = await db.query(
            `
                    SELECT DISTINCT e.id, e.nombre
                    FROM equipo e
                    JOIN miembros_campeonatos mc ON e.id = mc.equipo_id
                    JOIN fases f ON mc.campeonato_id = f.campeonato_id
                    WHERE f.id = ? AND mc.activo = 1
                `,
            [fase_id],
          );

          // For group phases, we need to assign teams to groups
          // Since we don't have a direct relationship, we'll simulate based on existing matches
          const equiposEnGrupos = {};
          const [partidosProgramados] = await db.query(
            `
                    SELECT DISTINCT grupo_numero, equipo_local_id, equipo_visitante_id
                    FROM partidos
                    WHERE fase_id = ? AND grupo_numero IS NOT NULL
                `,
            [fase_id],
          );

          // Build group assignments from existing matches
          partidosProgramados.forEach(p => {
            if (!equiposEnGrupos[p.grupo_numero]) {
              equiposEnGrupos[p.grupo_numero] = new Set();
            }
            if (p.equipo_local_id) equiposEnGrupos[p.grupo_numero].add(p.equipo_local_id);
            if (p.equipo_visitante_id) equiposEnGrupos[p.grupo_numero].add(p.equipo_visitante_id);
          });

          // Filter teams for this specific group
          const equiposGrupo = equiposDb.filter(e =>
            equiposEnGrupos[grupoNum] && equiposEnGrupos[grupoNum].has(e.id)
          );

          const stats = {};
          console.log(`[Stats DEBUG] Grupo ${grupoNum} - Fase ${fase_id}: ${partidos.length} partidos finalizados, ${equiposGrupo.length} equipos encontrados.`);

          equiposGrupo.forEach((e) => {
            stats[e.id] = {
              equipo_id: e.id,
              nombre: e.nombre,
              pj: 0,
              pg: 0,
              pe: 0,
              pp: 0,
              gf: 0,
              gc: 0,
              dg: 0,
              pts: 0,
            };
          });

          // Calculate stats for each match in this group
          partidos.forEach((p) => {
            const local = p.equipo_local_id;
            const visitante = p.equipo_visitante_id;
            const gl = parseInt(p.puntos_local || 0);
            const gv = parseInt(p.puntos_visitante || 0);

            if (local && stats[local]) {
              stats[local].pj++;
              stats[local].gf += gl;
              stats[local].gc += gv;
              stats[local].dg += gl - gv;

              if (visitante) {
                if (gl > gv) {
                  stats[local].pg++;
                  stats[local].pts += 3;
                } else if (gl === gv) {
                  stats[local].pe++;
                  stats[local].pts += 1;
                } else {
                  stats[local].pp++;
                }
              } else {
                stats[local].pg++;
                stats[local].pts += 3;
              }
            }

            if (visitante && stats[visitante]) {
              stats[visitante].pj++;
              stats[visitante].gf += gv;
              stats[visitante].gc += gl;
              stats[visitante].dg += gv - gl;

              if (local) {
                if (gv > gl) {
                  stats[visitante].pg++;
                  stats[visitante].pts += 3;
                } else if (gv === gl) {
                  stats[visitante].pe++;
                  stats[visitante].pts += 1;
                } else {
                  stats[visitante].pp++;
                }
              } else {
                stats[visitante].pg++;
                stats[visitante].pts += 3;
              }
            }
          });

          // Convert to array and sort
          const tablaGrupo = Object.values(stats).sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            if (b.dg !== a.dg) return b.dg - a.dg;
            return b.gf - a.gf;
          });

          grupos.push({
            grupo: grupoNum,
            nombre: `Grupo ${grupoNum}`,
            posiciones: tablaGrupo
          });
        }

        console.log(`[Stats DEBUG] Tablas de grupos enviadas al cliente:`, JSON.stringify(grupos));
        return res.json({
          status: 200,
          message: "Tablas de posiciones por grupos",
          data: grupos,
        });
      }

      // Get all finalized matches for this phase
      const [partidos] = await db.query(
        `
                SELECT * FROM partidos
                WHERE fase_id = ? AND estado = 'finalizado'
            `,
        [fase_id],
      );

      // Get all teams in this phase (even if no matches played yet)
      const stats = {};

      const [equiposDb] = await db.query(
        `
                SELECT DISTINCT e.id, e.nombre
                FROM equipo e
                JOIN miembros_campeonatos mc ON e.id = mc.equipo_id
                JOIN fases f ON mc.campeonato_id = f.campeonato_id
                WHERE f.id = ? AND mc.activo = 1
            `,
        [fase_id],
      );

      console.log(`[Stats DEBUG] Fase ${fase_id}: ${partidos.length} partidos finalizados, ${equiposDb.length} equipos encontrados.`);

      equiposDb.forEach((e) => {
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
          pts: 0, // Puntos
        };
      });

      partidos.forEach((p) => {
        const local = p.equipo_local_id;
        const visitante = p.equipo_visitante_id;
        const gl = parseInt(p.puntos_local || 0);
        const gv = parseInt(p.puntos_visitante || 0);

        if (local && stats[local]) {
          stats[local].pj++;
          stats[local].gf += gl;
          stats[local].gc += gv;
          stats[local].dg += gl - gv;

          if (visitante) {
            if (gl > gv) {
              stats[local].pg++;
              stats[local].pts += 3;
            } else if (gl === gv) {
              stats[local].pe++;
              stats[local].pts += 1;
            } else {
              stats[local].pp++;
            }
          } else {
            // BYE handles (usually 3 pts or just 0 pts but 1 PJ)
            stats[local].pg++;
            stats[local].pts += 3;
          }
        }

        if (visitante && stats[visitante]) {
          stats[visitante].pj++;
          stats[visitante].gf += gv;
          stats[visitante].gc += gl;
          stats[visitante].dg += gv - gl;

          if (local) {
            if (gv > gl) {
              stats[visitante].pg++;
              stats[visitante].pts += 3;
            } else if (gv === gl) {
              stats[visitante].pe++;
              stats[visitante].pts += 1;
            } else {
              stats[visitante].pp++;
            }
          } else {
            stats[visitante].pg++;
            stats[visitante].pts += 3;
          }
        }
      });

      // Convert to array and sort: Pts, DG, GF
      const tabla = Object.values(stats).sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.dg !== a.dg) return b.dg - a.dg;
        return b.gf - a.gf;
      });

      console.log(`[Stats DEBUG] Tabla final enviada al cliente:`, JSON.stringify(tabla));
      return res.json({
        status: 200,
        message: "Tabla de posiciones",
        data: tabla,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: 500, message: "Error", details: error.message });
    }
  }

  static async getEstadisticasEquipo(req, res) {
    try {
      const team_id = req.params.equipo_id;

      // Get all finalized matches for this team
      const [partidos] = await db.query(
        `
                SELECT p.*, f.nombre as fase_nombre, c.nombre as campeonato_nombre
                FROM partidos p
                JOIN fases f ON p.fase_id = f.id
                JOIN campeonato c ON f.campeonato_id = c.id
                WHERE (p.equipo_local_id = ? OR p.equipo_visitante_id = ?) 
                AND p.estado = 'finalizado'
                ORDER BY p.id DESC
            `,
        [team_id, team_id],
      );

      const stats = {
        pj: 0,
        pg: 0,
        pe: 0,
        pp: 0,
        gf: 0,
        gc: 0,
        dg: 0,
        pts: 0,
        promedioGoles: 0,
        rendimiento: 0,
        rachas: [], // Last 5 matches: 'W', 'D', 'L'
        golesPorPartido: [], // For line chart
        distribucionResultados: [0, 0, 0], // PG, PE, PP for pie chart
        datosGoles: { favor: [], contra: [] }, // For bar chart
      };

      partidos.forEach((p, index) => {
        const isLocal = p.equipo_local_id == team_id;
        const gl = parseInt(p.puntos_local || 0);
        const gv = parseInt(p.puntos_visitante || 0);

        const gf = isLocal ? gl : gv;
        const gc = isLocal ? gv : gl;

        stats.pj++;
        stats.gf += gf;
        stats.gc += gc;

        if (index < 10) {
          stats.golesPorPartido.unshift({
            label: `M${partidos.length - index}`,
            gf,
            gc,
          });
        }

        if (gf > gc) {
          stats.pg++;
          stats.pts += 3;
          if (index < 5) stats.rachas.unshift("W");
          stats.distribucionResultados[0]++;
        } else if (gf === gc) {
          stats.pe++;
          stats.pts += 1;
          if (index < 5) stats.rachas.unshift("D");
          stats.distribucionResultados[1]++;
        } else {
          stats.pp++;
          if (index < 5) stats.rachas.unshift("L");
          stats.distribucionResultados[2]++;
        }
      });

      stats.dg = stats.gf - stats.gc;
      stats.promedioGoles = stats.pj > 0 ? (stats.gf / stats.pj).toFixed(2) : 0;
      stats.rendimiento =
        stats.pj > 0 ? ((stats.pts / (stats.pj * 3)) * 100).toFixed(1) : 0;

      return res.json({
        status: 200,
        message: "Estadísticas del equipo",
        data: stats,
      });
    } catch (error) {
      return res
        .status(500)
        .json({
          status: 500,
          message: "Error al obtener estadísticas",
          details: error.message,
        });
    }
  }
}

module.exports = EstadisticaController;
