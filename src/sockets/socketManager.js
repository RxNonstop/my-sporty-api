const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Needed to interact with the database if we want to save chat history directly via socket

let io;
// We map user IDs to socket IDs to easily lookup individual sockets (for Amigos or Notifications)
const connectedUsers = new Map(); 

const init = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "*", // Adjust for production
            methods: ["GET", "POST", "PATCH"]
        }
    });

    // Authentication Middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }
        try {
            const secret = process.env.JWT_SECRET || 'clave_predeterminada_segura';
            const decoded = jwt.verify(token, secret);
            socket.user = {
                id: decoded.sub || decoded.id,
                ...decoded
            };
            next();
        } catch (err) {
            next(new Error("Authentication error: Invalid token"));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user.id;
        console.log(`[Sockets] Usuario conectado: ${userId} (${socket.id})`);
        
        connectedUsers.set(userId, socket.id);

        // When a user enters the app, we can subscribe them to the chat rooms of all their teams
        socket.on('join_teams', async () => {
             try {
                // Fetch user's teams (both owned and memberships)
                const [owned] = await db.query('SELECT id FROM Equipo WHERE propietario_id = ?', [userId]);
                const [memberships] = await db.query('SELECT equipo_id as id FROM miembrosequipo WHERE usuario_id = ? AND activo = 1', [userId]);
                
                const allTeamIds = new Set([...owned.map(r => r.id), ...memberships.map(r => r.id)]);
                
                allTeamIds.forEach(teamId => {
                    socket.join(`team_${teamId}`);
                    console.log(`[Sockets] Usuario ${userId} se unió al room: team_${teamId}`);
                });
             } catch (err) {
                 console.error('[Sockets] Error uniéndose a los equipos:', err);
             }
        });

        // Receiving a direct message (Amigos)
        socket.on('send_message_amigo', async (data) => {
            // data obj: { receptor_id, mensaje }
            console.log(`[Sockets] Mensaje amigo: ${userId} -> ${data.receptor_id}`);
            try {
                // Determine if they are friends first (optional validation)
                
                // Save to Database
                const [result] = await db.query(
                    'INSERT INTO Mensajes (emisor_id, receptor_id, mensaje) VALUES (?, ?, ?)',
                    [userId, data.receptor_id, data.mensaje]
                );

                const msgObj = {
                    id: result.insertId,
                    emisor_id: userId,
                    receptor_id: data.receptor_id,
                    mensaje: data.mensaje,
                    fecha_envio: new Date()
                };

                // Emit back to sender (to confirm and show in their UI if they sent it via generic event)
                socket.emit('receive_message_amigo', msgObj);

                // Find recipient and emit
                const destSocketId = connectedUsers.get(Number(data.receptor_id));
                if (destSocketId) {
                    io.to(destSocketId).emit('receive_message_amigo', msgObj);
                }
            } catch (err) {
                console.error('[Sockets] Error en send_message_amigo:', err);
            }
        });

        // Receiving a group message (Equipos)
        socket.on('send_message_equipo', async (data) => {
            // data obj: { equipo_id, mensaje }
            console.log(`[Sockets] Mensaje equipo ${data.equipo_id} de ${userId}`);
            try {
                // Save to Database
                const [result] = await db.query(
                    'INSERT INTO Mensajes (emisor_id, equipo_id, mensaje) VALUES (?, ?, ?)',
                    [userId, data.equipo_id, data.mensaje]
                );

                const [userRows] = await db.query('SELECT nombre FROM Usuario WHERE id = ?', [userId]);

                const msgObj = {
                    id: result.insertId,
                    emisor_id: userId,
                    emisor_nombre: userRows[0]?.nombre || 'Usuario',
                    equipo_id: data.equipo_id,
                    mensaje: data.mensaje,
                    fecha_envio: new Date()
                };

                // Emit directly to the sender so it reflects immediately
                socket.emit('receive_message_equipo', msgObj);
                
                // Broadcast to the rest of the team room
                socket.to(`team_${data.equipo_id}`).emit('receive_message_equipo', msgObj);
            } catch (err) {
                console.error('[Sockets] Error en send_message_equipo:', err);
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Sockets] Usuario desconectado: ${userId}`);
            // Check if socket.id matches (in case of multiple tabs, map might have the latest socket ID)
            if (connectedUsers.get(userId) === socket.id) {
                connectedUsers.delete(userId);
            }
        });
    });
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io is not initialized!");
    }
    return io;
};

const getConnectedUsers = () => connectedUsers;

const notifyUser = (userId, eventName, data = {}) => {
    if (!io) return;
    const destSocketId = connectedUsers.get(Number(userId));
    if (destSocketId) {
        io.to(destSocketId).emit(eventName, data);
    }
};

module.exports = {
    init,
    getIo,
    getConnectedUsers,
    notifyUser
};
