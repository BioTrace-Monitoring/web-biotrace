var analiseLotesModel = require("../models/analiseLotesModel");

function listarLotes(req, res) {
    var idEmpresa = req.query.idEmpresa;

    analiseLotesModel.listarLotes(idEmpresa)
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            res.status(500).json({ erro: erro.sqlMessage || erro.message });
        });
}

function obterPainelLote(req, res) {
    var idLote = Number(req.params.idLote);

    if (!idLote) {
        res.status(400).json({ erro: "ID do lote inválido." });
        return;
    }

    Promise.all([
        analiseLotesModel.buscarLotePorId(idLote),
        analiseLotesModel.buscarResumoLote(idLote),
        analiseLotesModel.buscarPerfisEquipamentos(idLote),
        analiseLotesModel.buscarConfiguracaoLote(idLote),
        analiseLotesModel.buscarHistoricoNotificacoes(idLote)
    ])
        .then(function (respostas) {
            var lotes = respostas[0];
            if (lotes.length === 0) {
                res.status(404).json({ erro: "Lote não encontrado." });
                return;
            }

            var resumo = null;
            if (respostas[1].length > 0) {
                resumo = respostas[1][0];
            }

            var configuracao = {
                limite_integridade: 72,
                email_ativo: 1,
                slack_ativo: 1,
                estado_atual: "normal"
            };
            if (respostas[3].length > 0) {
                configuracao = respostas[3][0];
            }

            res.status(200).json({
                lote: lotes[0],
                resumo: resumo,
                equipamentos: respostas[2],
                configuracao: configuracao,
                historico: respostas[4]
            });
        })
        .catch(function (erro) {
            res.status(500).json({ erro: erro.sqlMessage || erro.message });
        });
}

function atualizarConfiguracao(req, res) {
    var idLote = Number(req.params.idLote);
    var limiteIntegridade = Number(req.body.limite_integridade);
    var emailAtivo = req.body.email_ativo ? 1 : 0;
    var slackAtivo = req.body.slack_ativo ? 1 : 0;

    if (!idLote || isNaN(limiteIntegridade)) {
        res.status(400).json({ erro: "Parâmetros inválidos." });
        return;
    }

    analiseLotesModel.salvarConfiguracaoLote(idLote, limiteIntegridade, emailAtivo, slackAtivo)
        .then(function () {
            res.status(200).json({ sucesso: true });
        })
        .catch(function (erro) {
            res.status(500).json({ erro: erro.sqlMessage || erro.message });
        });
}

module.exports = {
    listarLotes,
    obterPainelLote,
    atualizarConfiguracao
};