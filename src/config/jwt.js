// ----------------------------------------------------------------------
// MÓDULO: jwt.js
// Propósito: Gestión de autenticación y autorización con JSON Web Tokens (JWT)
// ----------------------------------------------------------------------

// Importamos la librería jsonwebtoken para crear y verificar tokens JWT
const jwt = require('jsonwebtoken');

// Clave secreta para firmar y verificar los tokens.
// En producción, esta clave DEBE estar en una variable de entorno y ser compleja.
// Se proporciona un valor por defecto solo para desarrollo local.
const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_para_fes_aragon_2025';

// --------------------------------------------------------------
// Función: generarToken
// Propósito: Crea un token JWT para un usuario autenticado
// Parámetro: usuario - objeto con al menos { id, correo, rol }
// Retorna: string - token firmado
// --------------------------------------------------------------
function generarToken(usuario) {
    // jwt.sign(payload, secret, options)
    // payload: datos que se incrustarán en el token (NO información sensible como contraseñas)
    // secret: clave con la que se firma el token
    // options: expiresIn define el tiempo de vida del token (8 horas es razonable para una jornada laboral)
    return jwt.sign(
        { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
        JWT_SECRET,
        { expiresIn: '8h' }
    );
}

// --------------------------------------------------------------
// Middleware: verificarToken
// Propósito: Valida que la petición tenga un token JWT válido y no expirado
// Flujo: 
//   1. Extrae el header Authorization.
//   2. Verifica que tenga formato "Bearer <token>".
//   3. Verifica la firma y expiración con jwt.verify.
//   4. Si todo es correcto, guarda los datos del usuario en req.usuario y continúa.
//   5. Si falla, responde con error 401 (no autorizado) o 403 (token inválido).
// --------------------------------------------------------------
function verificarToken(req, res, next) {
    // El header Authorization suele venir como: "Bearer eyJhbGciOiJIUzI1NiIs..."
    const authHeader = req.headers.authorization;

    // Si no hay header, el cliente no envió token → error 401 (No autenticado)
    if (!authHeader) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    // Extraemos el token después de "Bearer " (el espacio es importante)
    // Ejemplo: "Bearer abc123".split(' ') → ['Bearer', 'abc123']
    const token = authHeader.split(' ')[1];

    try {
        // jwt.verify decodifica, verifica la firma y la expiración.
        // Si el token es válido, devuelve el payload decodificado.
        const decoded = jwt.verify(token, JWT_SECRET);

        // Adjuntamos la información del usuario al objeto `req` para que
        // los siguientes middlewares o controladores puedan acceder a ella
        // (por ejemplo, para saber qué rol tiene o qué usuario hizo la petición)
        req.usuario = decoded;

        // Pasamos al siguiente middleware o controlador
        next();
    } catch (err) {
        // Cualquier error (token mal formado, firma inválida, expirado, etc.)
        // retorna 403 (Prohibido/Token inválido)
        return res.status(403).json({ error: 'Token inválido o expirado' });
    }
}

// --------------------------------------------------------------
// Función de orden superior: verificarRol
// Propósito: Genera un middleware que verifica si el usuario autenticado
//            tiene uno de los roles permitidos para la acción.
// Parámetro: rolesPermitidos - array de strings (ej: ['admin', 'revisor'])
// Retorna: una función middleware (req, res, next) que ejecuta la comprobación.
// --------------------------------------------------------------
function verificarRol(rolesPermitidos) {
    // Retornamos el middleware real
    return (req, res, next) => {
        // Si no hay usuario en req (porque no pasó por verificarToken o falló),
        // respondemos con 401 (No autenticado)
        if (!req.usuario) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        // Verificamos si el rol del usuario está dentro de los roles permitidos
        // Ejemplo: rolesPermitidos = ['admin'] y req.usuario.rol = 'revisor' → false
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ error: 'No tiene permiso para esta acción' });
        }

        // Si el rol es válido, continuamos con la siguiente función
        next();
    };
}

// Exportamos las tres funciones para que puedan ser usadas en otros módulos,
// por ejemplo en las rutas o controladores.
module.exports = { generarToken, verificarToken, verificarRol };