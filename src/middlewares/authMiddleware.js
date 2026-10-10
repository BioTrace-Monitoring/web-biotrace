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

// Funções referentes a recuperação de senha ->

function gerarTokenRecSenha(usuarioId) {    
    return jwt.sign(
        { id: usuarioId, tipo: "recSenha" },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );
}

function validarTokenRecSenha(token) {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.tipo != 'recSenha') {
        throw new Error("Token inválido para essa operação");
    }
    return payload;
}

module.exports = {
    verificarToken,
    verificarCargo,
    gerarTokenRecSenha,
    validarTokenRecSenha
};