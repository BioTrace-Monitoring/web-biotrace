var database = require('../database/config');

var nomesComponentes = {
    cpu: "CPU",
    memoria: "Memória RAM",
    disco: "Disco"
};

function buscarKpis(idEmpresa, inicio, fimExclusivo, componente = "all") {
    var instrucaoSql = `
        SELECT
            COUNT( CASE WHEN a.confirmado_em >= ? THEN 1 END) AS novos_episodios,
            COUNT( CASE WHEN a.encerrado_em >= ? AND a.encerrado_em < ? AND a.motivo_encerramento = 'NORMALIZACAO' THEN 1 END) AS episodios_normalizados,
            COUNT( CASE WHEN a.encerrado_em IS NULL OR a.encerrado_em >= ? THEN 1 END) AS episodios_em_andamento,
            COUNT( DISTINCT CASE WHEN a.confirmado_em >= ? THEN e.id_equipamento END) AS equipamentos_afetados
        
        FROM alerta a
        JOIN metrica m ON m.id_metrica = a.fk_metrica
        JOIN tipo_metrica tm ON tm.id_tipo_metrica = m.fk_tipo_metrica
        JOIN componente c ON c.id_componente = m.fk_componente
        JOIN tipo_componente tc ON tc.id_tipo_componente = c.fk_tipo_componente
        JOIN equipamento e ON e.id_equipamento = c.fk_equipamento
        JOIN lote_equipamento l ON l.id_lote_equipamento = e.fk_lote
        WHERE l.fk_empresa = ?
        AND a.confirmado_em < ?
        AND tc.nome_componente IN ('CPU', 'Memória RAM', 'Disco')
        AND tm.tipo_metrica <> 'cpu_por_nucleo'
    `;

    var parametros = [
        inicio,
        inicio,
        fimExclusivo,
        fimExclusivo,
        inicio,
        idEmpresa,
        fimExclusivo
    ];

    if (componente !== "all") {
        var nomeComponente = nomesComponentes[componente];

        if (typeof nomeComponente !== "string") {
            throw new Error(`Componente inválido: ${componente}`);
        }

        instrucaoSql += " AND tc.nome_componente = ?";
        parametros.push(nomeComponente);
    }

    return database.executar(instrucaoSql, parametros);
}

function buscarDistribuicao(idEmpresa, inicio, fimExclusivo, componente = "all") {
    if (componente !== "all" && typeof nomesComponentes[componente] !== "string") {
        throw new Error(`Componente inválido: ${componente}`);
    }

    var instrucaoSql = `
        SELECT
            CASE WHEN ? = 'all' THEN tc.nome_componente
                ELSE tm.tipo_metrica END AS categoria,
            COUNT(*) AS quantidade
        FROM alerta a
        JOIN metrica m ON m.id_metrica = a.fk_metrica
        JOIN tipo_metrica tm ON tm.id_tipo_metrica = m.fk_tipo_metrica
        JOIN componente c ON c.id_componente = m.fk_componente
        JOIN tipo_componente tc ON tc.id_tipo_componente = c.fk_tipo_componente
        JOIN equipamento e ON e.id_equipamento = c.fk_equipamento
        JOIN lote_equipamento l ON l.id_lote_equipamento = e.fk_lote
        WHERE l.fk_empresa = ?
            AND a.confirmado_em >= ?
            AND a.confirmado_em < ?
            AND tc.nome_componente IN ('CPU', 'Memória RAM', 'Disco')
            AND tm.tipo_metrica <> 'cpu_por_nucleo'
            AND (? = 'all' OR tc.nome_componente = ?)
        GROUP BY categoria
        ORDER BY quantidade DESC, categoria
    `;

    return database.executar(instrucaoSql, [
        componente, idEmpresa, inicio, fimExclusivo,
        componente, nomesComponentes[componente] ?? null
    ]);
}

function buscarMapaCalor(idEmpresa, inicio, fimExclusivo, componente = "all") {
    if (componente !== "all" && typeof nomesComponentes[componente] !== "string") {
        throw new Error(`Componente inválido: ${componente}`);
    }

    // confirmado_em está em UTC; os agrupamentos usam Brasília (UTC-3).
    var instrucaoSql = `
        SELECT
            WEEKDAY(CONVERT_TZ(a.confirmado_em, '+00:00', '-03:00')) AS dia_semana,
            FLOOR(HOUR(CONVERT_TZ(a.confirmado_em, '+00:00', '-03:00')) / 4) AS faixa_horaria,
            COUNT(*) AS quantidade
        FROM alerta a
        JOIN metrica m ON m.id_metrica = a.fk_metrica
        JOIN tipo_metrica tm ON tm.id_tipo_metrica = m.fk_tipo_metrica
        JOIN componente c ON c.id_componente = m.fk_componente
        JOIN tipo_componente tc ON tc.id_tipo_componente = c.fk_tipo_componente
        JOIN equipamento e ON e.id_equipamento = c.fk_equipamento
        JOIN lote_equipamento l ON l.id_lote_equipamento = e.fk_lote
        WHERE l.fk_empresa = ?
            AND a.confirmado_em >= ?
            AND a.confirmado_em < ?
            AND tc.nome_componente IN ('CPU', 'Memória RAM', 'Disco')
            AND tm.tipo_metrica <> 'cpu_por_nucleo'
            AND (? = 'all' OR tc.nome_componente = ?)
        GROUP BY dia_semana, faixa_horaria
        ORDER BY dia_semana, faixa_horaria
    `;

    return database.executar(instrucaoSql, [
        idEmpresa, inicio, fimExclusivo,
        componente, nomesComponentes[componente] ?? null
    ]);
}

function buscarLocalizacoes(idEmpresa, inicio, fimExclusivo, componente = "all") {
    if (componente !== "all" && typeof nomesComponentes[componente] !== "string") {
        throw new Error(`Componente inválido: ${componente}`);
    }

    // A subconsulta conta episódios por equipamento antes de contar a base do hospital.
    // Assim, um equipamento com vários episódios não aumenta o denominador.
    var instrucaoSql = `
        SELECT
            h.id_hospital,
            COALESCE(h.nome_hospital, 'Sem hospital vinculado') AS nome_hospital,
            COUNT(*) AS total_equipamentos,
            SUM(CASE WHEN episodios.quantidade > 0 THEN 1 ELSE 0 END) AS equipamentos_afetados,
            COALESCE(SUM(episodios.quantidade), 0) AS total_episodios
        FROM equipamento e
        JOIN lote_equipamento l ON l.id_lote_equipamento = e.fk_lote
        LEFT JOIN hospital h ON h.id_hospital = e.fk_hospital AND h.fk_empresa = l.fk_empresa
        LEFT JOIN (
            SELECT c.fk_equipamento, COUNT(*) AS quantidade
            FROM alerta a
            JOIN metrica m ON m.id_metrica = a.fk_metrica
            JOIN tipo_metrica tm ON tm.id_tipo_metrica = m.fk_tipo_metrica
            JOIN componente c ON c.id_componente = m.fk_componente
            JOIN tipo_componente tc ON tc.id_tipo_componente = c.fk_tipo_componente
            WHERE a.confirmado_em >= ?
                AND a.confirmado_em < ?
                AND tc.nome_componente IN ('CPU', 'Memória RAM', 'Disco')
                AND tm.tipo_metrica <> 'cpu_por_nucleo'
                AND (? = 'all' OR tc.nome_componente = ?)
            GROUP BY c.fk_equipamento
        ) episodios ON episodios.fk_equipamento = e.id_equipamento
        WHERE l.fk_empresa = ?
        GROUP BY h.id_hospital, h.nome_hospital
        HAVING total_episodios > 0
        ORDER BY (1.0 * equipamentos_afetados / total_equipamentos) DESC,
            total_episodios DESC, nome_hospital, h.id_hospital
    `;

    return database.executar(instrucaoSql, [
        inicio, fimExclusivo, componente, nomesComponentes[componente] ?? null, idEmpresa
    ]);
}

function buscarEvolucao(idEmpresa, inicio, fimExclusivo, componente = "all") {
    if (componente !== "all" && typeof nomesComponentes[componente] !== "string") {
        throw new Error(`Componente inválido: ${componente}`);
    }

    var instrucaoSql = `
        SELECT
            DATE_FORMAT(CONVERT_TZ(a.confirmado_em, '+00:00', '-03:00'), '%Y-%m-%d') AS dia,
            COUNT(*) AS quantidade
        FROM alerta a
        JOIN metrica m ON m.id_metrica = a.fk_metrica
        JOIN tipo_metrica tm ON tm.id_tipo_metrica = m.fk_tipo_metrica
        JOIN componente c ON c.id_componente = m.fk_componente
        JOIN tipo_componente tc ON tc.id_tipo_componente = c.fk_tipo_componente
        JOIN equipamento e ON e.id_equipamento = c.fk_equipamento
        JOIN lote_equipamento l ON l.id_lote_equipamento = e.fk_lote
        WHERE l.fk_empresa = ?
            AND a.confirmado_em >= ?
            AND a.confirmado_em < ?
            AND tc.nome_componente IN ('CPU', 'Memória RAM', 'Disco')
            AND tm.tipo_metrica <> 'cpu_por_nucleo'
            AND (? = 'all' OR tc.nome_componente = ?)
        GROUP BY dia
        ORDER BY dia
    `;

    return database.executar(instrucaoSql, [
        idEmpresa, inicio, fimExclusivo, componente, nomesComponentes[componente] ?? null
    ]);
}

module.exports = {
    buscarKpis,
    buscarDistribuicao,
    buscarMapaCalor,
    buscarLocalizacoes,
    buscarEvolucao
}
