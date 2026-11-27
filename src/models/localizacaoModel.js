var database = require("../database/config");

async function buscarEmpresaDoUsuario(idUsuario) {
    var instrucaoSql = `
        SELECT fk_empresa
        FROM usuario
        WHERE id_usuario = ?
        LIMIT 1;
    `;

    var usuarios = await database.executar(instrucaoSql, [idUsuario]);
    return usuarios.length ? Number(usuarios[0].fk_empresa) : null;
}

function listarLocais(idEmpresa) {
    var instrucaoSql = `
        SELECT 'base' AS tipo, id_base AS id, nome_base AS nome, cep, numero
        FROM base
        WHERE fk_empresa = ?

        UNION ALL

        SELECT 'hospital' AS tipo, id_hospital AS id, nome_hospital AS nome, cep, numero
        FROM hospital
        WHERE fk_empresa = ?

        ORDER BY tipo, nome;
    `;

    return database.executar(instrucaoSql, [idEmpresa, idEmpresa]);
}

module.exports = {
    buscarEmpresaDoUsuario,
    listarLocais
};
