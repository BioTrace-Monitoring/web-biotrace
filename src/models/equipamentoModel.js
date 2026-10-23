var database = require("../database/config");

function listarModelos(idEmpresa) {
    return database.executar(`
        SELECT id_modelo_equipamento, nome_modelo
        FROM modelo_equipamento
        WHERE fk_empresa = ?
        ORDER BY nome_modelo, id_modelo_equipamento;
    `, [idEmpresa]);
}

function cadastrarModelo(nome, idEmpresa) {
    return database.executar(`
        INSERT INTO modelo_equipamento (nome_modelo, fk_empresa)
        SELECT ?, id_empresa FROM empresa WHERE id_empresa = ? AND ativo = TRUE;
    `, [nome, idEmpresa]);
}

function listarLotes(idEmpresa) {
    return database.executar(`
        SELECT l.id_lote_equipamento, l.numero_lote, l.fk_modelo_equipamento,
               m.nome_modelo, COUNT(e.id_equipamento) AS total_equipamentos
        FROM lote_equipamento l
        JOIN modelo_equipamento m ON m.id_modelo_equipamento = l.fk_modelo_equipamento
            AND m.fk_empresa = l.fk_empresa
        LEFT JOIN equipamento e ON e.fk_lote = l.id_lote_equipamento
        WHERE l.fk_empresa = ?
        GROUP BY l.id_lote_equipamento, l.numero_lote, l.fk_modelo_equipamento, m.nome_modelo
        ORDER BY l.numero_lote, l.id_lote_equipamento;
    `, [idEmpresa]);
}

function cadastrarLote(numero, idModelo, idEmpresa) {
    return database.executar(`
        INSERT INTO lote_equipamento (numero_lote, fk_empresa, fk_modelo_equipamento)
        SELECT ?, m.fk_empresa, m.id_modelo_equipamento
        FROM modelo_equipamento m
        JOIN empresa e ON e.id_empresa = m.fk_empresa AND e.ativo = TRUE
        WHERE m.id_modelo_equipamento = ? AND m.fk_empresa = ?;
    `, [numero, idModelo, idEmpresa]);
}

function listarEquipamentos(idEmpresa) {
    return database.executar(`
        SELECT e.id_equipamento, e.numero_serie, e.fk_lote, e.fk_hospital,
               l.numero_lote, m.nome_modelo, h.nome_hospital
        FROM equipamento e
        JOIN lote_equipamento l ON l.id_lote_equipamento = e.fk_lote
        JOIN modelo_equipamento m ON m.id_modelo_equipamento = l.fk_modelo_equipamento
            AND m.fk_empresa = l.fk_empresa
        LEFT JOIN hospital h ON h.id_hospital = e.fk_hospital AND h.fk_empresa = l.fk_empresa
        WHERE l.fk_empresa = ?
        ORDER BY e.numero_serie, e.id_equipamento;
    `, [idEmpresa]);
}

function cadastrarEquipamento(numeroSerie, idLote, idHospital, idEmpresa) {
    return cadastrarEquipamentos([numeroSerie], idLote, idHospital, idEmpresa);
}

function cadastrarEquipamentos(numerosSerie, idLote, idHospital, idEmpresa) {
    var seriesSql = numerosSerie.map(function () { return "SELECT ? AS numero_serie"; }).join(" UNION ALL ");
    return database.executar(`
        INSERT INTO equipamento (numero_serie, fk_hospital, fk_lote)
        SELECT series.numero_serie, ?, l.id_lote_equipamento
        FROM (${seriesSql}) series
        JOIN lote_equipamento l ON l.id_lote_equipamento = ?
        JOIN empresa emp ON emp.id_empresa = l.fk_empresa AND emp.ativo = TRUE
        JOIN modelo_equipamento m ON m.id_modelo_equipamento = l.fk_modelo_equipamento
            AND m.fk_empresa = l.fk_empresa
        WHERE l.fk_empresa = ?
          AND (? IS NULL OR EXISTS (
              SELECT 1 FROM hospital h WHERE h.id_hospital = ? AND h.fk_empresa = l.fk_empresa
          ));
    `, [idHospital].concat(numerosSerie, [idLote, idEmpresa, idHospital, idHospital]));
}

function atualizarHospital(idEquipamento, idHospital, idEmpresa) {
    return database.executar(`
        UPDATE equipamento e
        JOIN lote_equipamento l ON l.id_lote_equipamento = e.fk_lote
        SET e.fk_hospital = ?
        WHERE e.id_equipamento = ? AND l.fk_empresa = ?
          AND (? IS NULL OR EXISTS (
              SELECT 1 FROM hospital h WHERE h.id_hospital = ? AND h.fk_empresa = l.fk_empresa
          ));
    `, [idHospital, idEquipamento, idEmpresa, idHospital, idHospital]);
}

module.exports = {
    listarModelos, cadastrarModelo, listarLotes, cadastrarLote,
    listarEquipamentos, cadastrarEquipamento, cadastrarEquipamentos, atualizarHospital
};
