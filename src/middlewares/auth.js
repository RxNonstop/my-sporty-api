const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization || req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No autenticado o token inválido' });
    }

    const token = authHeader.split(' ')[1].replace(/"/g, ''); // Limpiar comillas si las hay
    const secret = process.env.JWT_SECRET || 'clave_predeterminada_segura';

    try {
        const decoded = jwt.verify(token, secret);
        req.user = {
            id: decoded.sub || decoded.id,
            correo: decoded.correo,
            rol: decoded.rol,
            exp: decoded.exp
        };
        next();
    } catch (e) {
        return res.status(401).json({ error: 'No autenticado o token inválido' });
    }
};
