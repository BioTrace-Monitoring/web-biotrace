var database = require("../database/config");
var engenharia = require("./engenhariaModel");
var gold = require("../services/goldService");

function listarRelatorios(empresa) {
    return database.executar(
        `SELECT r.*, DATE_FORMAT(r.criado_em, '%Y-%m-%dT%H:%i:%sZ') AS criado_em,
        DATE_FORMAT(r.automatico_concluido_em, '%Y-%m-%dT%H:%i:%sZ') AS automatico_concluido_em,
        DATE_FORMAT(r.revisado_em, '%Y-%m-%dT%H:%i:%sZ') AS revisado_em, p.nome AS protocolo, p.versao, m.nome_modelo AS equipamento,
        DATE_FORMAT(e.inicio, '%Y-%m-%dT%H:%i:%sZ') AS inicio,
        DATE_FORMAT(e.termino_previsto, '%Y-%m-%dT%H:%i:%sZ') AS termino_previsto,
        p.checklist_layout, p.checklist_compatibilidade, p.checklist_funcionamento,
        u.nome_usuario AS revisado_por
        FROM relatorio_ensaio r JOIN ensaio e ON e.id_ensaio = r.fk_ensaio
        JOIN protocolo_ensaio p ON p.id_protocolo = e.fk_protocolo
        JOIN modelo_equipamento m ON m.id_modelo_equipamento = p.fk_modelo_equipamento
        LEFT JOIN usuario u ON u.id_usuario = r.fk_revisado_por
        WHERE m.fk_empresa = ? ORDER BY r.id_relatorio DESC`,
        [empresa],
    );
}
async function buscarRelatorio(empresa, id) {
    var relatorios = await listarRelatorios(empresa);
    var relatorio = relatorios.find(function (r) {
        return r.id_relatorio === Number(id);
    });
    if (!relatorio)
        throw engenharia.erroEngenharia(404, "Relatório não encontrado.");
    return relatorio;
}
async function processarEnsaio(empresa, id) {
    var ensaio = await engenharia.buscarEnsaio(empresa, id);
    if (
        !["em_execucao", "aguardando_processamento", "finalizado"].includes(
            ensaio.situacao,
        ) ||
        !ensaio.inicio ||
        !ensaio.termino_previsto
    )
        throw engenharia.erroEngenharia(
            409,
            "O ensaio precisa ter sido iniciado para processar os dados.",
        );
    if (Date.parse(ensaio.termino_previsto) > Date.now())
        throw engenharia.erroEngenharia(
            409,
            "A duração prevista ainda não terminou.",
        );
    var protocolo = await engenharia.buscarProtocolo(
        empresa,
        ensaio.fk_protocolo,
    );
    var participantes = [];
    for (var equipamento of ensaio.equipamentos) {
        participantes.push({
            serie: equipamento.numero_serie,
            leituras: await gold.carregarLeiturasGold(
                empresa,
                equipamento.numero_serie,
                ensaio.inicio,
                ensaio.termino_previsto,
            ),
        });
    }
    var resultado = gold.avaliarGold(
        protocolo,
        participantes,
        ensaio.inicio,
        ensaio.termino_previsto,
    );
    var conexao = database.conectar();
    try {
        await conexao.query("SET time_zone = '+00:00'");
        await conexao.beginTransaction();
        ensaio = await engenharia.buscarEnsaio(empresa, id, conexao, true);
        if (ensaio.situacao === "cancelado")
            throw engenharia.erroEngenharia(409, "O ensaio foi cancelado.");
        var existentes = await database.executar(
            "SELECT * FROM relatorio_ensaio WHERE fk_ensaio = ? FOR UPDATE",
            [id],
            conexao,
        );
        if (
            existentes.length &&
            (existentes[0].situacao === "concluido" ||
                existentes[0].revisado_em)
        )
            throw engenharia.erroEngenharia(
                409,
                "Este relatório já foi revisado. Crie um novo ensaio para outra avaliação.",
            );
        var idRelatorio;
        if (!existentes.length) {
            var criado = await database.executar(
                "INSERT INTO relatorio_ensaio (fk_ensaio) VALUES (?)",
                [id],
                conexao,
            );
            idRelatorio = criado.insertId;
        } else idRelatorio = existentes[0].id_relatorio;
        var dentroTolerancia =
            Date.now() <
            Date.parse(ensaio.termino_previsto) +
                protocolo.tolerancia_envio_minutos * 60000;
        var aguardar =
            resultado.cobertura_percentual <
                Number(protocolo.cobertura_minima_percentual) &&
            dentroTolerancia;
        var situacao = aguardar
            ? "aguardando_dados"
            : "verificacoes_manuais_pendentes";
        var referencia =
            (process.env.S3_GOLD_PREFIX || "gold/") +
            "historico/empresa_id=" +
            empresa +
            "; " +
            ensaio.inicio +
            " até " +
            ensaio.termino_previsto;
        await database.executar(
            `UPDATE relatorio_ensaio SET situacao = ?, resultado_temperatura = ?, resultado_recursos = ?,
            resultado_estabilidade = ?, cobertura_percentual = ?, duracao_atendida = TRUE,
            pico_temperatura = ?, maior_uso_cpu = ?, maior_uso_ram = ?, menor_disco_livre = ?,
            observacoes_automaticas = ?, referencia_gold = ?, automatico_concluido_em = IF(?, NULL, UTC_TIMESTAMP())
            WHERE id_relatorio = ?`,
            [
                situacao,
                resultado.resultado_temperatura,
                resultado.resultado_recursos,
                resultado.resultado_estabilidade,
                resultado.cobertura_percentual,
                resultado.pico_temperatura,
                resultado.maior_uso_cpu,
                resultado.maior_uso_ram,
                resultado.menor_disco_livre,
                resultado.observacoes_automaticas,
                referencia,
                aguardar,
                idRelatorio,
            ],
            conexao,
        );
        await database.executar(
            "UPDATE ensaio SET situacao = 'aguardando_processamento' WHERE id_ensaio = ?",
            [id],
            conexao,
        );
        await conexao.commit();
        return idRelatorio;
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        await conexao.end();
    }
}
async function concluirRelatorio(empresa, id, usuario, dados) {
    var conexao = database.conectar();
    try {
        await conexao.query("SET time_zone = '+00:00'");
        await conexao.beginTransaction();
        var registros = await database.executar(
            `SELECT r.*, p.checklist_layout, p.checklist_compatibilidade,
            p.checklist_funcionamento, p.cobertura_minima_percentual
            FROM relatorio_ensaio r JOIN ensaio e ON e.id_ensaio = r.fk_ensaio
            JOIN protocolo_ensaio p ON p.id_protocolo = e.fk_protocolo
            JOIN modelo_equipamento m ON m.id_modelo_equipamento = p.fk_modelo_equipamento
            WHERE r.id_relatorio = ? AND m.fk_empresa = ? FOR UPDATE`,
            [id, empresa],
            conexao,
        );
        if (!registros.length)
            throw engenharia.erroEngenharia(404, "Relatório não encontrado.");
        var r = registros[0];
        if (
            r.situacao !== "verificacoes_manuais_pendentes" ||
            !r.automatico_concluido_em
        )
            throw engenharia.erroEngenharia(409, "Conclua o processamento automático antes de revisar. Relatórios já concluídos não podem ser alterados.");
        var resultados = [
            r.resultado_temperatura,
            r.resultado_recursos,
            r.resultado_estabilidade,
        ];
        var revisoes = [];
        for (var criterio of ["layout", "compatibilidade", "funcionamento"]) {
            var itens = r["checklist_" + criterio]
                .split(/\r?\n/)
                .map(function (item) {
                    return item.trim();
                })
                .filter(Boolean);
            var revisao = dados[criterio];
            if (
                !revisao ||
                !Array.isArray(revisao.resultados) ||
                revisao.resultados.length !== itens.length ||
                revisao.resultados.some(function (valor) {
                    return !["aprovado", "reprovado", "inconclusivo"].includes(valor);
                })
            )
                throw engenharia.erroEngenharia(400, "Preencha todos os itens do checklist de " + criterio + ".");
            if (typeof revisao.observacoes !== "string" || revisao.observacoes.length > 10000)
                throw engenharia.erroEngenharia(400, "As observações devem ter até 10.000 caracteres.");
            var resultado = "aprovado";
            if (revisao.resultados.includes("reprovado")) resultado = "reprovado";
            else if (revisao.resultados.includes("inconclusivo")) resultado = "inconclusivo";
            if (resultado !== "aprovado" && !revisao.observacoes.trim())
                throw engenharia.erroEngenharia(400, "Explique nas observações os itens reprovados ou inconclusivos de " + criterio + ".");
            resultados.push(resultado);
            revisoes.push(resultado, JSON.stringify({
                itens: itens.map(function (texto, i) {
                    return { texto: texto, resultado: revisao.resultados[i] };
                }),
                observacoes: revisao.observacoes.trim(),
            }));
        }
        if (typeof dados.observacoes_revisao !== "string" || dados.observacoes_revisao.length > 10000)
            throw engenharia.erroEngenharia(400, "As observações gerais devem ter até 10.000 caracteres.");
        var suficiente =
            r.duracao_atendida === 1 &&
            r.cobertura_percentual !== null &&
            Number(r.cobertura_percentual) >= Number(r.cobertura_minima_percentual);
        var todosAprovados = resultados.every(function (valor) {
            return valor === "aprovado";
        });
        var resultadoFinal = "inconclusivo";
        if (resultados.includes("reprovado")) resultadoFinal = "reprovado";
        else if (suficiente && todosAprovados) resultadoFinal = "aprovado";
        await database.executar(
            `UPDATE relatorio_ensaio SET resultado_layout = ?, observacoes_layout = ?,
            resultado_compatibilidade = ?, observacoes_compatibilidade = ?,
            resultado_funcionamento = ?, observacoes_funcionamento = ?,
            resultado_final = ?, observacoes_revisao = ?, fk_revisado_por = ?,
            revisado_em = UTC_TIMESTAMP(), situacao = 'concluido' WHERE id_relatorio = ?`,
            revisoes.concat([resultadoFinal, dados.observacoes_revisao.trim(), usuario, id]),
            conexao,
        );
        await database.executar(
            "UPDATE ensaio SET situacao = 'finalizado', encerrado_em = UTC_TIMESTAMP() WHERE id_ensaio = ?",
            [r.fk_ensaio],
            conexao,
        );
        await conexao.commit();
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        await conexao.end();
    }
}
module.exports = { listarRelatorios, buscarRelatorio, processarEnsaio, concluirRelatorio };
