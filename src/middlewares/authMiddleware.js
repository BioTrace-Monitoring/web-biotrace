const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ erro: 'Token não fornecido' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ erro: 'Token inválido ou expirado' });
        }
        req.usuario = decoded;
        next();
    })
}

function verificarCargo(cargosPermitidos) {
    return function (req, res, next) {
        const cargoUsuario = req.usuario.cargo;

        if (!cargosPermitidos.includes(cargoUsuario)) {
            return res.status(403).json({ erro: "Você não tem permissão para realizar essa ação"})
        }
        
        next();
    }
}

module.exports = {
    verificarToken,
    verificarCargo
};