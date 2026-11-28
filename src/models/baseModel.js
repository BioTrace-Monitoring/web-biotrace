const database = require("../database/config");

function cadastrar(idEmpresa, nome, cep, numero) {
    return database.executar(`
        INSERT INTO base (fk_empresa, nome_base, cep, numero)
        VALUES (?, ?, ?, ?);
    `, [idEmpresa, nome, cep, numero]);
}

function listarFuncionarios(idEmpresa) {
    return database.executar(`
        SELECT u.id_usuario AS id, u.nome_usuario AS nome, c.nome AS cargo,
               b.id_base AS baseId, b.nome_base AS baseNome
        FROM usuario u
        JOIN cargo c ON c.id_cargo = u.fk_cargo
        LEFT JOIN base b ON b.id_base = u.fk_base AND b.fk_empresa = u.fk_empresa
        WHERE u.fk_empresa = ?
        ORDER BY u.nome_usuario, u.id_usuario;
    `, [idEmpresa]);
}

function realocarFuncionario(idEmpresa, idFuncionario, idBase) {
    return database.executar(`
        UPDATE usuario u
        JOIN base b ON b.id_base = ? AND b.fk_empresa = u.fk_empresa
        SET u.fk_base = b.id_base
        WHERE u.id_usuario = ? AND u.fk_empresa = ?;
    `, [idBase, idFuncionario, idEmpresa]);
}

module.exports = { cadastrar, listarFuncionarios, realocarFuncionario };
