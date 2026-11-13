var database = require("../database/config");
var engenharia = require("./engenhariaModel");
var gold = require("../services/goldService");

function listarRelatorios(empresa) {
    return database.executar(
        `SELECT r.*, DATE_FORMAT(r.criado_em, '%Y-%m-%dT%H:%i:%sZ') AS criado_em,
        DATE_FORMAT(r.automatico_concluido_em, '%Y-%m-%dT%H:%i:%sZ') AS automatico_concluido_em,
        DATE_FORMAT(r.revisado_em, '%Y-%m-%dT%H:%i:%sZ') AS revisado_em, p.nome AS protocolo, p.versao, m.nome_modelo AS equipamento,
        DATE_FORMAT(e.inicio, '%Y-%m-%dT%H:%i:%sZ') AS inicio,
        DATE_FORMAT(e.termino_previsto, '%Y-%m-%dT%H:%i:%sZ') AS termino_previsto
        FROM relatorio_ensaio r JOIN ensaio e ON e.id_ensaio = r.fk_ensaio
        JOIN protocolo_ensaio p ON p.id_protocolo = e.fk_protocolo
        JOIN modelo_equipamento m ON m.id_modelo_equipamento = p.fk_modelo_equipamento
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
module.exports = { listarRelatorios, buscarRelatorio, processarEnsaio };
