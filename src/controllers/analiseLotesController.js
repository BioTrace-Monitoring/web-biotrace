var analiseLotesModel = require("../models/analiseLotesModel");

var LIMITE_SUBUTILIZADO = 70;

function idValido(valor) {
    if (valor == null) return false;
    if (valor.constructor !== String && valor.constructor !== Number) return false;
    return Number.isSafeInteger(Number(valor)) && Number(valor) > 0;
}

function tratarErro(res, erro) {
    console.error("Erro na análise de lotes:", erro);
    return res.status(500).json({
        sucesso: false,
        mensagem: "Não foi possível carregar os dados da análise de lotes."
    });
}

function agruparLeiturasPorEquipamento(leituras) {
    var mapa = {};
    for (var i = 0; i < leituras.length; i++) {
        var item = leituras[i];
        var idEq = item.id_equipamento;
        if (!mapa[idEq]) mapa[idEq] = [];
        mapa[idEq].push({
            valor: Number(item.valor),
            timestamp: new Date(item.dt_leitura).getTime()
        });
    }
    return mapa;
}

function calcularPercentualOciosidade(leituras, limiteOciosidade) {
    if (!leituras || leituras.length === 0) return null;

    if (leituras.length === 1) {
        return leituras[0].valor <= limiteOciosidade ? 100 : 0;
    }

    var tempoTotal = 0;
    var tempoOcioso = 0;

    for (var i = 0; i < leituras.length - 1; i++) {
        var atual = leituras[i];
        var proximo = leituras[i + 1];
        var dt = proximo.timestamp - atual.timestamp;

        if (Number.isFinite(dt) && dt > 0) {
            tempoTotal += dt;
            if (atual.valor <= limiteOciosidade) {
                tempoOcioso += dt;
            }
        }
    }

    if (tempoTotal > 0) {
        return Math.round((tempoOcioso / tempoTotal) * 100);
    }

    var qtdOciosa = leituras.filter(function (l) {
        return l.valor <= limiteOciosidade;
    }).length;
    return Math.round((qtdOciosa / leituras.length) * 100);
}

function calcularVariacaoPicos(leituras) {
    if (!leituras || leituras.length === 0) return null;
    if (leituras.length === 1) return 0;

    var soma = 0;
    for (var i = 0; i < leituras.length; i++) {
        soma += leituras[i].valor;
    }
    var media = soma / leituras.length;

    var somaQuadrados = 0;
    for (var j = 0; j < leituras.length; j++) {
        var diff = leituras[j].valor - media;
        somaQuadrados += diff * diff;
    }

    return Number(Math.sqrt(somaQuadrados / leituras.length).toFixed(1));
}

async function listarLotes(req, res) {
    var idEmpresaQuery = req.query.idEmpresa;
    var idEmpresa = null;

    if (idEmpresaQuery !== undefined && idEmpresaQuery !== "") {
        if (!idValido(idEmpresaQuery)) {
            return res.status(400).json({ sucesso: false, mensagem: "ID da empresa inválido." });
        }
        idEmpresa = Number(idEmpresaQuery);
    }

    try {
        var lotes = await analiseLotesModel.listarLotes(idEmpresa);
        return res.json({ sucesso: true, lotes: lotes });
    } catch (erro) {
        return tratarErro(res, erro);
    }
}

async function obterOciosidade(req, res) {
    if (!idValido(req.params.idLote)) {
        return res.status(400).json({ sucesso: false, mensagem: "ID do lote inválido." });
    }

    var idLote = Number(req.params.idLote);

    try {
        var loteRows = await analiseLotesModel.buscarLotePorId(idLote);
        if (!loteRows.length) {
            return res.status(404).json({ sucesso: false, mensagem: "Lote não encontrado." });
        }

        var equipamentos = await analiseLotesModel.buscarEquipamentosCpuDoLote(idLote);
        var leituras = await analiseLotesModel.buscarLeiturasCpuUltimos7Dias(idLote);
        var leiturasPorEq = agruparLeiturasPorEquipamento(leituras);

        var resultado = equipamentos.map(function (eq) {
            var serieLeituras = leiturasPorEq[eq.id_equipamento] || [];
            var limiteOciosidade = Number(eq.limite_ociosidade);
            var percentual = calcularPercentualOciosidade(serieLeituras, limiteOciosidade);
            var semLeituras = percentual === null;
            var subutilizado = !semLeituras && percentual > LIMITE_SUBUTILIZADO;

            return {
                id_equipamento: eq.id_equipamento,
                numero_serie: eq.numero_serie,
                limite_ociosidade: limiteOciosidade,
                total_leituras: serieLeituras.length,
                percentual_ociosidade: percentual,
                subutilizado: subutilizado,
                status: semLeituras ? "SEM LEITURAS" : (subutilizado ? "SUBUTILIZADO" : "EM USO")
            };
        });

        resultado.sort(function (a, b) {
            if (a.percentual_ociosidade === null && b.percentual_ociosidade === null) return 0;
            if (a.percentual_ociosidade === null) return 1;
            if (b.percentual_ociosidade === null) return -1;
            return b.percentual_ociosidade - a.percentual_ociosidade;
        });

        var subutilizados = resultado
            .filter(function (eq) { return eq.subutilizado; })
            .map(function (eq) { return eq.numero_serie; });

        var comLeituras = resultado.filter(function (eq) {
            return eq.percentual_ociosidade !== null;
        }).length;

        return res.json({
            sucesso: true,
            lote: loteRows[0],
            limite_subutilizado: LIMITE_SUBUTILIZADO,
            equipamentos: resultado,
            resumo: {
                total_equipamentos: resultado.length,
                com_leituras: comLeituras,
                total_subutilizados: subutilizados.length,
                subutilizados: subutilizados
            }
        });
    } catch (erro) {
        return tratarErro(res, erro);
    }
}

async function obterPerfis(req, res) {
    if (!idValido(req.params.idLote)) {
        return res.status(400).json({ sucesso: false, mensagem: "ID do lote inválido." });
    }

    var idLote = Number(req.params.idLote);

    try {
        var loteRows = await analiseLotesModel.buscarLotePorId(idLote);
        if (!loteRows.length) {
            return res.status(404).json({ sucesso: false, mensagem: "Lote não encontrado." });
        }

        var equipamentos = await analiseLotesModel.buscarEquipamentosCpuDoLote(idLote);
        var leituras = await analiseLotesModel.buscarLeiturasCpuUltimos7Dias(idLote);
        var leiturasPorEq = agruparLeiturasPorEquipamento(leituras);

        var pontos = [];
        for (var i = 0; i < equipamentos.length; i++) {
            var eq = equipamentos[i];
            var serieLeituras = leiturasPorEq[eq.id_equipamento] || [];
            if (!serieLeituras.length) continue;

            var limiteOciosidade = Number(eq.limite_ociosidade);
            var percentualOciosidade = calcularPercentualOciosidade(serieLeituras, limiteOciosidade);
            var variacaoPicos = calcularVariacaoPicos(serieLeituras);

            pontos.push({
                id_equipamento: eq.id_equipamento,
                numero_serie: eq.numero_serie,
                percentual_ociosidade: percentualOciosidade,
                variacao_picos: variacaoPicos,
                total_leituras: serieLeituras.length
            });
        }

        return res.json({
            sucesso: true,
            lote: loteRows[0],
            total_equipamentos: equipamentos.length,
            total_com_leituras: pontos.length,
            pontos: pontos
        });
    } catch (erro) {
        return tratarErro(res, erro);
    }
}

module.exports = {
    listarLotes,
    obterOciosidade,
    obterPerfis
};
