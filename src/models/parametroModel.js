var database = require("../database/config");

function erroAplicacao(mensagem, status) {
    var erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

function listarComponentes(idEmpresa) {
    return database.executar(
        `
        SELECT c.id_componente, c.fk_equipamento, c.fk_tipo_componente
        FROM componente c
        JOIN equipamento e ON e.id_equipamento = c.fk_equipamento
        JOIN lote_equipamento l ON l.id_lote_equipamento = e.fk_lote
        WHERE l.fk_empresa = ?;
    `,
        [idEmpresa]
    );
}

function listarMetricas(idEmpresa) {
    return database.executar(
        `
        SELECT m.id_metrica, m.fk_tipo_metrica, c.id_componente, c.fk_tipo_componente,
               tc.nome_componente, tm.tipo_metrica, tm.unidade,
               e.id_equipamento, e.numero_serie, l.id_lote_equipamento, l.numero_lote,
               l.fk_modelo_equipamento, mo.nome_modelo,
               p.id_parametro_metrica, p.limite_uso, p.limite_ociosidade, p.habilitado
        FROM metrica m
        JOIN tipo_metrica tm ON tm.id_tipo_metrica = m.fk_tipo_metrica
        JOIN componente c ON c.id_componente = m.fk_componente
        JOIN tipo_componente tc ON tc.id_tipo_componente = c.fk_tipo_componente
        JOIN equipamento e ON e.id_equipamento = c.fk_equipamento
        JOIN lote_equipamento l ON l.id_lote_equipamento = e.fk_lote
        JOIN modelo_equipamento mo ON mo.id_modelo_equipamento = l.fk_modelo_equipamento
        LEFT JOIN parametro_metrica p ON p.id_parametro_metrica = (
            SELECT MAX(pm.id_parametro_metrica) FROM parametro_metrica pm WHERE pm.fk_metrica = m.id_metrica
        )
        WHERE l.fk_empresa = ?
        ORDER BY l.numero_lote, tc.nome_componente, tm.tipo_metrica, e.numero_serie, m.id_metrica;
    `,
        [idEmpresa]
    );
}

function listarTiposComponente() {
    return database.executar(
        "SELECT id_tipo_componente, nome_componente FROM tipo_componente ORDER BY nome_componente;"
    );
}

async function obterReferencia(idEmpresa, idMetrica, conexao) {
    var linhas = await database.executar(
        `
        SELECT m.id_metrica, m.fk_tipo_metrica, c.fk_tipo_componente,
               e.id_equipamento, l.id_lote_equipamento, l.fk_modelo_equipamento, l.fk_empresa, tm.unidade
        FROM metrica m
        JOIN tipo_metrica tm ON tm.id_tipo_metrica = m.fk_tipo_metrica
        JOIN componente c ON c.id_componente = m.fk_componente
        JOIN equipamento e ON e.id_equipamento = c.fk_equipamento
        JOIN lote_equipamento l ON l.id_lote_equipamento = e.fk_lote
        WHERE m.id_metrica = ? AND l.fk_empresa = ?
        ${conexao ? "FOR UPDATE" : ""};
    `,
        [idMetrica, idEmpresa],
        conexao
    );
    if (!linhas.length) throw erroAplicacao("Métrica não encontrada para esta empresa.", 404);
    return linhas[0];
}

function obterAlvos(referencia, escopo, conexao) {
    var condicoes = {
        equipamento: ["e.id_equipamento = ?", referencia.id_equipamento],
        lote: ["l.id_lote_equipamento = ?", referencia.id_lote_equipamento],
        modelo: ["l.fk_modelo_equipamento = ?", referencia.fk_modelo_equipamento],
        empresa: ["1 = ?", 1]
    };
    var condicao = condicoes[escopo];
    return database.executar(
        `
        SELECT m.id_metrica, e.id_equipamento, l.id_lote_equipamento
        FROM metrica m
        JOIN componente c ON c.id_componente = m.fk_componente
        JOIN equipamento e ON e.id_equipamento = c.fk_equipamento
        JOIN lote_equipamento l ON l.id_lote_equipamento = e.fk_lote
        WHERE l.fk_empresa = ? AND c.fk_tipo_componente = ? AND m.fk_tipo_metrica = ?
          AND ${condicao[0]}
        ORDER BY m.id_metrica ${conexao ? "FOR UPDATE" : ""};
    `,
        [referencia.fk_empresa, referencia.fk_tipo_componente, referencia.fk_tipo_metrica, condicao[1]],
        conexao
    );
}

function contarAlvos(alvos) {
    var equipamentos = new Set();
    var lotes = new Set();

    for (var alvo of alvos) {
        equipamentos.add(alvo.id_equipamento);
        lotes.add(alvo.id_lote_equipamento);
    }

    return {
        metricas: alvos.length,
        equipamentos: equipamentos.size,
        lotes: lotes.size
    };
}

function validarPercentual(unidade, dados) {
    if (String(unidade || "").trim() !== "%") return;

    if (dados.limiteUso > 100 || dados.limiteOciosidade > 100) {
        throw erroAplicacao("Os limites de uma métrica percentual devem ficar entre 0 e 100.", 400);
    }
}

async function preverAlteracao(idEmpresa, idMetrica, escopo) {
    var referencia = await obterReferencia(idEmpresa, idMetrica);
    return contarAlvos(await obterAlvos(referencia, escopo));
}

async function salvarParametros(idEmpresa, idMetrica, escopo, dados) {
    var conexao = database.conectar();

    try {
        await conexao.beginTransaction();
        var referencia = await obterReferencia(idEmpresa, idMetrica, conexao);
        validarPercentual(referencia.unidade, dados);
        var alvos = await obterAlvos(referencia, escopo, conexao);

        if (!alvos.length) {
            throw erroAplicacao("Nenhuma métrica encontrada para esta seleção.", 404);
        }

        var ids = [];
        var marcadores = [];

        for (var alvo of alvos) {
            ids.push(alvo.id_metrica);
            marcadores.push("?");
        }

        var valores = [dados.limiteUso, dados.limiteOciosidade, dados.habilitado].concat(ids);
        var listaMarcadores = marcadores.join(",");

        // Cria a configuração somente nas métricas que ainda não têm parâmetros.
        await database.executar(
            `
            INSERT INTO parametro_metrica (fk_metrica, limite_uso, limite_ociosidade, habilitado)
            SELECT m.id_metrica, ?, ?, ? FROM metrica m
            WHERE m.id_metrica IN (${listaMarcadores})
              AND NOT EXISTS (SELECT 1 FROM parametro_metrica p WHERE p.fk_metrica = m.id_metrica);
        `,
            valores,
            conexao
        );

        await database.executar(
            `
            UPDATE parametro_metrica SET limite_uso = ?, limite_ociosidade = ?, habilitado = ?
            WHERE fk_metrica IN (${listaMarcadores});
        `,
            valores,
            conexao
        );

        await conexao.commit();
        return contarAlvos(alvos);
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        await conexao.end();
    }
}

module.exports = {
    listarComponentes,
    listarMetricas,
    listarTiposComponente,
    preverAlteracao,
    salvarParametros
};
