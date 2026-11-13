var model = require("../models/relatorioEngenhariaModel");
function tratarErro(res, erro) {
    if (erro.status)
        return res
            .status(erro.status)
            .json({ sucesso: false, mensagem: erro.message });
    console.error("Erro ao consultar relatório:", erro.code || erro.name);
    res.status(500).json({
        sucesso: false,
        mensagem: "Não foi possível concluir o processamento do relatório.",
    });
}
async function listarRelatorios(req, res) {
    try {
        res.json({
            sucesso: true,
            relatorios: await model.listarRelatorios(req.usuario.fk_empresa),
        });
    } catch (erro) {
        tratarErro(res, erro);
    }
}
async function buscarRelatorio(req, res) {
    var id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0)
        return res
            .status(400)
            .json({ sucesso: false, mensagem: "Relatório inválido." });
    try {
        res.json({
            sucesso: true,
            relatorio: await model.buscarRelatorio(req.usuario.fk_empresa, id),
        });
    } catch (erro) {
        tratarErro(res, erro);
    }
}
async function processarEnsaio(req, res) {
    var id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0)
        return res
            .status(400)
            .json({ sucesso: false, mensagem: "Ensaio inválido." });
    try {
        var idRelatorio = await model.processarEnsaio(
            req.usuario.fk_empresa,
            id,
        );
        res.json({
            sucesso: true,
            relatorio: await model.buscarRelatorio(
                req.usuario.fk_empresa,
                idRelatorio,
            ),
        });
    } catch (erro) {
        tratarErro(res, erro);
    }
}
module.exports = { listarRelatorios, buscarRelatorio, processarEnsaio };
