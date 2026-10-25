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

async function cadastrarEquipamento(numeroSerie, idLote, idHospital, idEmpresa) {
    var resultado = await database.executar(`
        INSERT INTO equipamento (numero_serie, fk_hospital, fk_lote)
        SELECT ?, ?, l.id_lote_equipamento
        FROM lote_equipamento l
        JOIN empresa emp ON emp.id_empresa = l.fk_empresa AND emp.ativo = TRUE
        JOIN modelo_equipamento m ON m.id_modelo_equipamento = l.fk_modelo_equipamento
            AND m.fk_empresa = l.fk_empresa
        WHERE l.id_lote_equipamento = ? AND l.fk_empresa = ?
          AND (? IS NULL OR EXISTS (
              SELECT 1 FROM hospital h WHERE h.id_hospital = ? AND h.fk_empresa = l.fk_empresa
          ));
    `, [numeroSerie, idHospital, idLote, idEmpresa, idHospital, idHospital]);

    if (resultado.affectedRows > 0) {
        var componentes = await cadastrarComponentes(resultado.insertId);
        var metricas = await vincularMetricas(resultado.insertId);
        validarVinculos(componentes, metricas);
        await cadastrarParametros(resultado.insertId);
    }

    return resultado;
}

function cadastrarComponentes(idEquipamento) {
    return database.executar(`
        INSERT INTO componente (fk_equipamento, fk_tipo_componente)
        SELECT e.id_equipamento, tc.id_tipo_componente
        FROM equipamento e
        CROSS JOIN tipo_componente tc
        WHERE e.id_equipamento = ?
          AND tc.nome_componente IN ('CPU', 'Memória RAM', 'Disco', 'Rede', 'Sistema Operacional');
    `, [idEquipamento]);
}

function vincularMetricas(idEquipamento) {
    return database.executar(`
        INSERT INTO metrica (fk_tipo_metrica, fk_componente)
        SELECT tm.id_tipo_metrica, c.id_componente
        FROM componente c
        JOIN equipamento e ON e.id_equipamento = c.fk_equipamento
        JOIN tipo_componente tc ON tc.id_tipo_componente = c.fk_tipo_componente
        JOIN tipo_metrica tm ON (
            (tc.nome_componente = 'CPU'
                AND tm.tipo_metrica IN ('cpu_percent', 'cpu_por_nucleo', 'temperatura_cpu'))
            OR (tc.nome_componente = 'Memória RAM'
                AND tm.tipo_metrica IN ('memoria_percent', 'memoria_disponivel_gb'))
            OR (tc.nome_componente = 'Disco'
                AND tm.tipo_metrica IN ('disco_percent', 'disco_livre_gb'))
            OR (tc.nome_componente = 'Rede'
                AND tm.tipo_metrica IN ('rede_bytes_enviados', 'rede_bytes_recebidos', 'rede_erros_entrada', 'rede_erros_saida'))
            OR (tc.nome_componente = 'Sistema Operacional'
                AND tm.tipo_metrica IN ('uptime_horas', 'processos_ativos'))
        )
        WHERE e.id_equipamento = ?;
    `, [idEquipamento]);
}

function validarVinculos(componentes, metricas) {
    if (componentes.affectedRows !== 5 || metricas.affectedRows !== 13) {
        var erro = new Error("Confira os INSERTs de tipo_componente e tipo_metrica do init.sql. Cada equipamento precisa dos 5 componentes e das 13 métricas padrão.");
        erro.status = 400;
        throw erro;
    }
}

function cadastrarParametros(idEquipamento) {
    return database.executar(`
        INSERT INTO parametro_metrica (limite_uso, limite_ociosidade, habilitado, fk_metrica)
        SELECT
            CASE tm.tipo_metrica
                WHEN 'cpu_percent' THEN 90.00
                WHEN 'memoria_percent' THEN 90.00
                WHEN 'disco_percent' THEN 90.00
                ELSE NULL
            END,
            CASE tm.tipo_metrica
                WHEN 'cpu_percent' THEN 5.00
                WHEN 'memoria_percent' THEN 10.00
                WHEN 'disco_percent' THEN 10.00
                ELSE NULL
            END,
            TRUE,
            m.id_metrica
        FROM metrica m
        JOIN tipo_metrica tm ON tm.id_tipo_metrica = m.fk_tipo_metrica
        JOIN componente c ON c.id_componente = m.fk_componente
        JOIN equipamento e ON e.id_equipamento = c.fk_equipamento
        WHERE e.id_equipamento = ?;
    `, [idEquipamento]);
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

function buscarModelo(idEmpresa, idModelo) {
    return database.executar(`
        SELECT id_modelo_equipamento, nome_modelo FROM modelo_equipamento
        WHERE fk_empresa = ? AND id_modelo_equipamento = ?;
    `, [idEmpresa, idModelo]);
}

function alterarModelo(idEmpresa, idModelo, nome) {
    return database.executar(`
        UPDATE modelo_equipamento SET nome_modelo = ?
        WHERE fk_empresa = ? AND id_modelo_equipamento = ?;
    `, [nome, idEmpresa, idModelo]);
}

function excluirModelo(idEmpresa, idModelo) {
    return database.executar(`
        DELETE FROM modelo_equipamento WHERE fk_empresa = ? AND id_modelo_equipamento = ?;
    `, [idEmpresa, idModelo]);
}

function buscarLote(idEmpresa, idLote) {
    return database.executar(`
        SELECT id_lote_equipamento, numero_lote, fk_modelo_equipamento FROM lote_equipamento
        WHERE fk_empresa = ? AND id_lote_equipamento = ?;
    `, [idEmpresa, idLote]);
}

function alterarLote(idEmpresa, idLote, numero, idModelo) {
    return database.executar(`
        UPDATE lote_equipamento l
        JOIN modelo_equipamento m ON m.id_modelo_equipamento = ? AND m.fk_empresa = l.fk_empresa
        SET l.numero_lote = ?, l.fk_modelo_equipamento = m.id_modelo_equipamento
        WHERE l.fk_empresa = ? AND l.id_lote_equipamento = ?;
    `, [idModelo, numero, idEmpresa, idLote]);
}

function excluirLote(idEmpresa, idLote) {
    return database.executar(`
        DELETE FROM lote_equipamento WHERE fk_empresa = ? AND id_lote_equipamento = ?;
    `, [idEmpresa, idLote]);
}

function buscarEquipamento(idEmpresa, idEquipamento) {
    return database.executar(`
        SELECT e.id_equipamento, e.numero_serie, e.fk_lote, e.fk_hospital
        FROM equipamento e JOIN lote_equipamento l ON l.id_lote_equipamento = e.fk_lote
        WHERE l.fk_empresa = ? AND e.id_equipamento = ?;
    `, [idEmpresa, idEquipamento]);
}

function alterarEquipamento(idEmpresa, idEquipamento, numeroSerie, idLote, idHospital) {
    return database.executar(`
        UPDATE equipamento e
        JOIN lote_equipamento atual ON atual.id_lote_equipamento = e.fk_lote
        JOIN lote_equipamento novo ON novo.id_lote_equipamento = ? AND novo.fk_empresa = atual.fk_empresa
        SET e.numero_serie = ?, e.fk_lote = novo.id_lote_equipamento, e.fk_hospital = ?
        WHERE atual.fk_empresa = ? AND e.id_equipamento = ?
          AND (? IS NULL OR EXISTS (
              SELECT 1 FROM hospital WHERE id_hospital = ? AND fk_empresa = atual.fk_empresa
          ));
    `, [idLote, numeroSerie, idHospital, idEmpresa, idEquipamento, idHospital, idHospital]);
}

async function excluirEquipamento(idEmpresa, idEquipamento) {
    var conexao = database.conectar();
    try {
        await conexao.beginTransaction();
        var equipamentos = await database.executar(`
            SELECT e.id_equipamento FROM equipamento e
            JOIN lote_equipamento l ON l.id_lote_equipamento = e.fk_lote
            WHERE l.fk_empresa = ? AND e.id_equipamento = ? FOR UPDATE;
        `, [idEmpresa, idEquipamento], conexao);

        if (equipamentos.length === 0) {
            await conexao.commit();
            return { affectedRows: 0 };
        }

        // Os vínculos automáticos são excluídos junto com o equipamento.
        await database.executar(`
            DELETE p FROM parametro_metrica p JOIN metrica m ON m.id_metrica = p.fk_metrica
            JOIN componente c ON c.id_componente = m.fk_componente WHERE c.fk_equipamento = ?;
        `, [idEquipamento], conexao);
        await database.executar(`
            DELETE m FROM metrica m JOIN componente c ON c.id_componente = m.fk_componente
            WHERE c.fk_equipamento = ?;
        `, [idEquipamento], conexao);
        await database.executar('DELETE FROM componente WHERE fk_equipamento = ?;', [idEquipamento], conexao);
        var resultado = await database.executar('DELETE FROM equipamento WHERE id_equipamento = ?;', [idEquipamento], conexao);
        await conexao.commit();
        return resultado;
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        await conexao.end();
    }
}

module.exports = {
    buscarModelo,
    alterarModelo,
    excluirModelo,
    buscarLote,
    alterarLote,
    excluirLote,
    buscarEquipamento,
    alterarEquipamento,
    excluirEquipamento,
    listarModelos, cadastrarModelo, listarLotes, cadastrarLote,
    listarEquipamentos, cadastrarEquipamento, atualizarHospital
};
