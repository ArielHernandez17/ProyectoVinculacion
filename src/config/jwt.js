const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_para_fes_aragon_2025';

function generarToken(usuario) {
    return jwt.sign(
        { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
        JWT_SECRET,
        { expiresIn: '8h' }
    );
}

function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido o expirado' });
    }
}

function verificarRol(rolesPermitidos) {
    return (req, res, next) => {
        if (!req.usuario) return res.status(401).json({ error: 'No autenticado' });
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ error: 'No tiene permiso para esta acción' });
        }
        next();
    };
}

module.exports = { generarToken, verificarToken, verificarRol };