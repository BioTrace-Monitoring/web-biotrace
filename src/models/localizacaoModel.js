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

async function listarLocais(idEmpresa, somenteBases = false) {
    var basesSql = `
        SELECT 'base' AS tipo, id_base AS id, nome_base AS nome, cep, numero
        FROM base
        WHERE fk_empresa = ?
    `;

    if (somenteBases) return database.executar(basesSql + " ORDER BY nome, id;", [idEmpresa]);

    var hospitaisSql = `
        SELECT 'hospital' AS tipo, h.id_hospital AS id, h.nome_hospital AS nome, h.cep, h.numero
        FROM hospital h
    `;
    var locaisSql = basesSql + " UNION ALL " + hospitaisSql;
    var parametros = [idEmpresa, idEmpresa];
    try {
        return await database.executar(locaisSql + " WHERE h.fk_empresa = ? ORDER BY tipo, nome;", parametros);
    } catch (erro) {
        // O schema de desenvolvimento associa hospitais à empresa pelos equipamentos.
        if (erro.code !== "ER_BAD_FIELD_ERROR" || !erro.sqlMessage?.includes("h.fk_empresa")) throw erro;
        return database.executar(locaisSql + `
            WHERE EXISTS (
                SELECT 1 FROM equipamento e
                WHERE e.fk_hospital = h.id_hospital AND e.fk_empresa = ?
            )
            ORDER BY tipo, nome;
        `, parametros);
    }
}

module.exports = {
    buscarEmpresaDoUsuario,
    listarLocais
};
