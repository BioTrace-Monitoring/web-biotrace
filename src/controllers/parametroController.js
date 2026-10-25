var parametroModel = require("../models/parametroModel");
var equipamentoModel = require("../models/equipamentoModel");

function idValido(valor) {
    if (valor == null) return false;
    if (valor.constructor !== String && valor.constructor !== Number) return false;
    return Number.isSafeInteger(Number(valor)) && Number(valor) > 0;
}

function responderErro(res, erro) {
    if (!erro.status) console.error("Erro no painel de infraestrutura:", erro);

    return res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.status ? erro.message : "Não foi possível concluir a operação. Tente novamente."
    });
}

function erroValidacao(mensagem) {
    var erro = new Error(mensagem);
    erro.status = 400;
    return erro;
}

function lerLimite(valor) {
    if (valor == null || valor === "") return null;

    if (valor.constructor !== String && !Number.isFinite(valor)) {
        throw erroValidacao("Informe limites numéricos válidos.");
    }

    var numero = Number(valor);
    var casasDecimais = Math.abs(Math.round(numero * 100) - numero * 100);

    if (!Number.isFinite(numero) || numero < 0 || numero > 999.99 || casasDecimais > 0.000001) {
        throw erroValidacao("Os limites devem ficar entre 0 e 999,99, com até duas casas decimais.");
    }

    return numero;
}

function lerParametros(body) {
    var uso = lerLimite(body.limiteUsoServer);
    var ociosidade = lerLimite(body.limiteOciosidadeServer);

    if (uso !== null && ociosidade !== null && ociosidade > uso) {
        throw erroValidacao("O limite de ociosidade não pode ser maior que o limite de uso.");
    }

    if (body.habilitadoServer !== true && body.habilitadoServer !== false) {
        throw erroValidacao("Informe se a métrica deve ficar habilitada.");
    }

    return { limiteUso: uso, limiteOciosidade: ociosidade, habilitado: body.habilitadoServer };
}

async function painel(req, res) {
    var idEmpresa = Number(req.params.idEmpresa);

    if (!idValido(req.params.idEmpresa)) {
        return res.status(400).json({ sucesso: false, mensagem: "ID da empresa inválido." });
    }

    try {
        var dados = await Promise.all([
            equipamentoModel.listarModelos(idEmpresa),
            equipamentoModel.listarLotes(idEmpresa),
            equipamentoModel.listarEquipamentos(idEmpresa),
            parametroModel.listarComponentes(idEmpresa),
            parametroModel.listarMetricas(idEmpresa),
            parametroModel.listarTiposComponente()
        ]);

        return res.json({
            sucesso: true,
            modelos: dados[0],
            lotes: dados[1],
            equipamentos: dados[2],
            componentes: dados[3],
            metricas: dados[4],
            tiposComponente: dados[5]
        });
    } catch (erro) {
        return responderErro(res, erro);
    }
}

function selecaoValida(idEmpresa, idMetrica, escopo) {
    var escopos = ["equipamento", "lote", "modelo", "empresa"];
    return idValido(idEmpresa) && idValido(idMetrica) && escopos.includes(escopo);
}

async function previa(req, res) {
    var idEmpresa = req.params.idEmpresa;
    var idMetrica = req.query.idMetrica;
    var escopo = req.query.escopo;

    if (!selecaoValida(idEmpresa, idMetrica, escopo)) {
        return res
            .status(400)
            .json({ sucesso: false, mensagem: "Selecione uma métrica e um destino válido." });
    }

    try {
        var impacto = await parametroModel.preverAlteracao(Number(idEmpresa), Number(idMetrica), escopo);
        return res.json({ sucesso: true, impacto: impacto });
    } catch (erro) {
        return responderErro(res, erro);
    }
}

async function salvar(req, res) {
    var body = req.body || {};
    var idEmpresa = req.params.idEmpresa;
    var idMetrica = body.idMetricaServer;
    var escopo = body.escopoServer;

    if (!selecaoValida(idEmpresa, idMetrica, escopo)) {
        return res
            .status(400)
            .json({ sucesso: false, mensagem: "Selecione uma métrica e um destino válido." });
    }

    try {
        var parametros = lerParametros(body);
        var impacto = await parametroModel.salvarParametros(
            Number(idEmpresa),
            Number(idMetrica),
            escopo,
            parametros
        );

        return res.json({
            sucesso: true,
            impacto: impacto,
            mensagem:
                "Parâmetros aplicados a " +
                impacto.metricas +
                " métrica(s) em " +
                impacto.equipamentos +
                " equipamento(s)."
        });
    } catch (erro) {
        return responderErro(res, erro);
    }
}

module.exports = {
    painel,
    previa,
    salvar
};
