var database = require("../database/config");

function listarLotes(idEmpresa) {
    var filtroEmpresa = "";
    var parametros = [];

    if (idEmpresa) {
        filtroEmpresa = "WHERE l.fk_empresa = ?";
        parametros.push(idEmpresa);
    }

    var instrucao = `
        SELECT l.id_lote_equipamento,
               l.numero_lote,
               m.nome_modelo,
               COUNT(e.id_equipamento) AS total_equipamentos
        FROM lote_equipamento l
        JOIN modelo_equipamento m ON m.id_modelo_equipamento = l.fk_modelo_equipamento
        LEFT JOIN equipamento e ON e.fk_lote = l.id_lote_equipamento
        ${filtroEmpresa}
        GROUP BY l.id_lote_equipamento, l.numero_lote, m.nome_modelo
        ORDER BY l.numero_lote, l.id_lote_equipamento;
    `;
    return database.executar(instrucao, parametros);
}

function buscarLotePorId(idLote) {
    var instrucao = `
        SELECT l.id_lote_equipamento,
               l.numero_lote,
               m.nome_modelo
        FROM lote_equipamento l
        JOIN modelo_equipamento m ON m.id_modelo_equipamento = l.fk_modelo_equipamento
        WHERE l.id_lote_equipamento = ?;
    `;
    return database.executar(instrucao, [idLote]);
}

function buscarResumoLote(idLote) {
    var instrucao = `
        SELECT integridade_geral,
               total_equipamentos,
               qtd_sem_alerta,
               qtd_em_atencao,
               qtd_limite_excedido,
               qtd_falha_leitura,
               qtd_abaixo_minimo,
               equipamentos_ociosos,
               processado_em
        FROM resumo_integridade_lote
        WHERE fk_lote = ?
        ORDER BY id_resumo DESC
        LIMIT 1;
    `;
    return database.executar(instrucao, [idLote]);
}

function buscarPerfisEquipamentos(idLote) {
    var instrucao = `
        SELECT e.numero_serie,
               COALESCE(p.percentual_ociosidade, 0) AS percentual_ociosidade,
               COALESCE(p.variacao_picos, 0) AS variacao_picos,
               COALESCE(p.perfil_uso, 'Uso constante') AS perfil_uso,
               COALESCE(p.status_operacional, 'Em funcionamento') AS status_operacional,
               COALESCE(p.categoria_alerta, 'normal') AS categoria_alerta
        FROM equipamento e
        LEFT JOIN perfil_uso_equipamento_lote p
               ON p.fk_lote = e.fk_lote AND p.numero_serie = e.numero_serie
        WHERE e.fk_lote = ?
        ORDER BY p.percentual_ociosidade DESC, e.numero_serie ASC;
    `;
    return database.executar(instrucao, [idLote]);
}

function buscarConfiguracaoLote(idLote) {
    var instrucao = `
        SELECT limite_integridade,
               email_ativo,
               destinatario_email,
               slack_ativo,
               estado_atual
        FROM configuracao_alerta_lote
        WHERE fk_lote = ?;
    `;
    return database.executar(instrucao, [idLote]);
}

function salvarConfiguracaoLote(idLote, limiteIntegridade, emailAtivo, destinatarioEmail, slackAtivo) {
    var instrucao = `
        INSERT INTO configuracao_alerta_lote
            (fk_lote, limite_integridade, email_ativo, destinatario_email, slack_ativo)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            limite_integridade = VALUES(limite_integridade),
            email_ativo = VALUES(email_ativo),
            destinatario_email = VALUES(destinatario_email),
            slack_ativo = VALUES(slack_ativo);
    `;
    return database.executar(instrucao, [
        idLote,
        limiteIntegridade,
        emailAtivo,
        destinatarioEmail || null,
        slackAtivo
    ]);
}

function buscarHistoricoNotificacoes(idLote) {
    var instrucao = `
        SELECT *
        FROM historico_notificacao_lote
        WHERE fk_lote = ?
        ORDER BY id_notificacao DESC
        LIMIT 10;
    `;
    return database.executar(instrucao, [idLote]);
}

module.exports = {
    listarLotes,
    buscarLotePorId,
    buscarResumoLote,
    buscarPerfisEquipamentos,
    buscarConfiguracaoLote,
    salvarConfiguracaoLote,
    buscarHistoricoNotificacoes
};