const { Expo } = require('expo-server-sdk');
const db = require('../config/db');

let expo = new Expo();

/**
 * Envía una notificación push a un usuario específico
 * @param {number} usuarioId - ID del destinatario
 * @param {string} title - Título de la notificación
 * @param {string} body - Cuerpo del mensaje
 * @param {object} data - Datos adicionales (opcional)
 */
exports.enviarPushNotification = async (usuarioId, title, body, data = {}) => {
    try {
        // Obtener el push_token del usuario
        const [rows] = await db.query('SELECT push_token FROM usuario WHERE id = ?', [usuarioId]);
        
        if (rows.length === 0 || !rows[0].push_token) {
            return; // El usuario no tiene token registrado
        }

        const pushToken = rows[0].push_token;

        // Validar que el token sea un token de Expo válido
        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`Push token ${pushToken} no es un token de Expo válido`);
            return;
        }

        // Construir el mensaje
        const messages = [{
            to: pushToken,
            sound: 'default',
            title: title,
            body: body,
            data: data,
        }];

        // Enviar la notificación
        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];
        
        for (let chunk of chunks) {
            try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log('[Push] Ticket recibido de Expo:', ticketChunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error enviando chunk de notificaciones:', error);
            }
        }
        
        return tickets;
    } catch (error) {
        console.error('Error en enviarPushNotification:', error);
    }
};
