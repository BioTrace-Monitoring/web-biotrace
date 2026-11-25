var model = require("../models/engenhariaModel");
var analiseTermica = require("../services/analiseTermicaService");

function idPositivo(valor) {
    return (
        (typeof valor === "number" || typeof valor === "string") &&
        Number.isSafeInteger(Number(valor)) &&
        Number(valor) > 0
    );
}
function identificador(valor) {
    if (!idPositivo(valor))
        throw model.erroEngenharia(400, "Identificador inválido.");
    return Number(valor);
}
function responderErro(res, erro) {
    if (erro.status)
        return res
            .status(erro.status)
            .json({ sucesso: false, mensagem: erro.message });
    if (
        ["ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT", "ER_DUP_ENTRY"].includes(
            erro.code,
        )
    )
        return res.status(409).json({
            sucesso: false,
            mensagem:
                "Os dados foram alterados simultaneamente. Consulte o registro e tente novamente.",
        });
    console.error("Erro no módulo de engenharia:", erro.code || erro.name);
    return res.status(500).json({
        sucesso: false,
        mensagem: "Não foi possível concluir a operação de engenharia.",
    });
}
async function validarAcesso(req, res, next) {
    try {
        if (
            !idPositivo(req.usuario.id) ||
            !idPositivo(req.usuario.fk_empresa) ||
            req.usuario.tipo
        )
            return res.status(403).json({
                sucesso: false,
                mensagem: "Sessão de acesso inválida. Entre novamente.",
            });
        var usuarios = await model.acessoUsuario(
            Number(req.usuario.id),
            Number(req.usuario.fk_empresa),
        );
        if (
            !usuarios.length ||
            !["administrador", "gestor"].includes(
                usuarios[0].cargo.trim().toLowerCase(),
            )
        )
            return res.status(403).json({
                sucesso: false,
                mensagem: "Acesso permitido somente a administrador e gestor.",
            });
        next();
    } catch (erro) {
        responderErro(res, erro);
    }
}
async function listarCatalogos(req, res) {
    try {
        var catalogos = await model.listarCatalogos(req.usuario.fk_empresa);
        res.json({
            sucesso: true,
            modelos: catalogos.modelos,
            lotes: catalogos.lotes,
            unidades: catalogos.unidades,
        });
    } catch (erro) {
        responderErro(res, erro);
    }
}

function diasAnalise(valor) {
    if (valor === undefined) return 7;
    if (!["7", "14", "30"].includes(valor)) {
        throw model.erroEngenharia(400, "Selecione 7, 14 ou 30 dias.");
    }
    return Number(valor);
}

async function consultarAnaliseTermica(req, res) {
    try {
        var dias = diasAnalise(req.query.dias);
        var lote = req.query.lote === undefined ? null : identificador(req.query.lote);
        var resultado = await analiseTermica.consultarLotes(Number(req.usuario.fk_empresa), dias, lote);
        res.json({ sucesso: true, ...resultado });
    } catch (erro) {
        responderErro(res, erro);
    }
}

async function consultarEquipamentoTermico(req, res) {
    try {
        var dias = diasAnalise(req.query.dias);
        var equipamento = identificador(req.params.id);
        var resultado = await analiseTermica.consultarEquipamento(Number(req.usuario.fk_empresa), dias, equipamento);
        res.json({ sucesso: true, ...resultado });
    } catch (erro) {
        responderErro(res, erro);
    }
}

module.exports = {
    validarAcesso,
    listarCatalogos,
    consultarAnaliseTermica,
    consultarEquipamentoTermico,
};
