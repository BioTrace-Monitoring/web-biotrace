var database = require("../database/config");

var TABELAS_LEITURA = [
    "leitura",
    "leituras",
    "registro",
    "registros",
    "captura",
    "capturas",
    "leitura_metrica",
    "registro_metrica"
];

var COLUNAS_VALOR = ["valor", "valor_lido", "medicao", "leitura"];
var COLUNAS_DATA = ["dt_hora", "data_hora", "dt_leitura", "data_leitura", "timestamp", "criado_em", "created_at"];

function listarLotes(idEmpresa) {
    var filtroEmpresa = idEmpresa ? "WHERE l.fk_empresa = ?" : "";
    var parametros = idEmpresa ? [idEmpresa] : [];

    return database.executar(`
        SELECT l.id_lote_equipamento,
               l.numero_lote,
               l.fk_modelo_equipamento,
               m.nome_modelo,
               COUNT(e.id_equipamento) AS total_equipamentos
        FROM lote_equipamento l
        JOIN modelo_equipamento m ON m.id_modelo_equipamento = l.fk_modelo_equipamento
        LEFT JOIN equipamento e ON e.fk_lote = l.id_lote_equipamento
        ${filtroEmpresa}
        GROUP BY l.id_lote_equipamento, l.numero_lote, l.fk_modelo_equipamento, m.nome_modelo
        ORDER BY l.numero_lote, l.id_lote_equipamento;
    `, parametros);
}

function buscarEquipamentosCpuDoLote(idLote) {
    return database.executar(`
        SELECT e.id_equipamento,
               e.numero_serie,
               MAX(CASE WHEN tm.tipo_metrica = 'cpu_percent' THEN m.id_metrica END) AS id_metrica,
               COALESCE(
                   MAX(CASE WHEN tm.tipo_metrica = 'cpu_percent' THEN p.limite_ociosidade END),
                   15.00
               ) AS limite_ociosidade
        FROM equipamento e
        LEFT JOIN componente c ON c.fk_equipamento = e.id_equipamento
        LEFT JOIN tipo_componente tc ON tc.id_tipo_componente = c.fk_tipo_componente
            AND tc.nome_componente = 'CPU'
        LEFT JOIN metrica m ON m.fk_componente = c.id_componente
        LEFT JOIN tipo_metrica tm ON tm.id_tipo_metrica = m.fk_tipo_metrica
            AND tm.tipo_metrica = 'cpu_percent'
        LEFT JOIN parametro_metrica p ON p.id_parametro_metrica = (
            SELECT MAX(pm.id_parametro_metrica)
            FROM parametro_metrica pm
            WHERE pm.fk_metrica = m.id_metrica
        )
        WHERE e.fk_lote = ?
        GROUP BY e.id_equipamento, e.numero_serie
        ORDER BY e.numero_serie, e.id_equipamento;
    `, [idLote]);
}

async function descobrirTabelaLeitura() {
    var placeholders = TABELAS_LEITURA.map(function () { return "?"; }).join(",");
    var linhas = await database.executar(`
        SELECT TABLE_NAME, COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME IN (${placeholders});
    `, TABELAS_LEITURA);

    if (!linhas.length) return null;

    var porTabela = {};
    for (var i = 0; i < linhas.length; i++) {
        var nomeTabela = linhas[i].TABLE_NAME;
        if (!porTabela[nomeTabela]) porTabela[nomeTabela] = [];
        porTabela[nomeTabela].push(linhas[i].COLUMN_NAME);
    }

    for (var j = 0; j < TABELAS_LEITURA.length; j++) {
        var tabela = TABELAS_LEITURA[j];
        var cols = porTabela[tabela];
        if (!cols) continue;

        var colFk = cols.indexOf("fk_metrica") !== -1 ? "fk_metrica" : null;
        var colValor = COLUNAS_VALOR.find(function (c) { return cols.indexOf(c) !== -1; });
        var colData = COLUNAS_DATA.find(function (c) { return cols.indexOf(c) !== -1; });

        if (colFk && colValor && colData) {
            return { tabela: tabela, colFk: colFk, colValor: colValor, colData: colData };
        }
    }

    return null;
}

async function buscarLeiturasCpuUltimos7Dias(idLote) {
    var esquema = await descobrirTabelaLeitura();
    if (!esquema) return [];

    return database.executar(`
        SELECT e.id_equipamento,
               e.numero_serie,
               r.${esquema.colValor} AS valor,
               r.${esquema.colData} AS dt_leitura
        FROM ${esquema.tabela} r
        JOIN metrica m ON m.id_metrica = r.${esquema.colFk}
        JOIN tipo_metrica tm ON tm.id_tipo_metrica = m.fk_tipo_metrica
        JOIN componente c ON c.id_componente = m.fk_componente
        JOIN equipamento e ON e.id_equipamento = c.fk_equipamento
        WHERE e.fk_lote = ?
          AND tm.tipo_metrica = 'cpu_percent'
          AND r.${esquema.colData} >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY e.id_equipamento, r.${esquema.colData} ASC;
    `, [idLote]);
}

function buscarLotePorId(idLote) {
    return database.executar(`
        SELECT l.id_lote_equipamento, l.numero_lote, m.nome_modelo
        FROM lote_equipamento l
        JOIN modelo_equipamento m ON m.id_modelo_equipamento = l.fk_modelo_equipamento
        WHERE l.id_lote_equipamento = ?;
    `, [idLote]);
}

module.exports = {
    listarLotes,
    buscarLotePorId,
    buscarEquipamentosCpuDoLote,
    buscarLeiturasCpuUltimos7Dias
};
