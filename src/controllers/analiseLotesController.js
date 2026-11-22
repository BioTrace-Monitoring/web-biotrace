var analiseLotesModel = require("../models/analiseLotesModel");
var { SNSClient, SubscribeCommand } = require("@aws-sdk/client-sns");

var snsClient = new SNSClient({ region: "us-east-1" });
var SNS_TOPIC_ARN = "arn:aws:sns:us-east-1:481665118734:Biotrace-Alertas";

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
                limite_integridade: 80,
                email_ativo: 1,
                destinatario_email: "",
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
    var destinatarioEmail = req.body.destinatario_email ? String(req.body.destinatario_email).trim() : null;
    var slackAtivo = req.body.slack_ativo ? 1 : 0;

    if (!idLote || isNaN(limiteIntegridade)) {
        res.status(400).json({ erro: "Parâmetros inválidos." });
        return;
    }

    if (emailAtivo && !destinatarioEmail) {
        res.status(400).json({ erro: "Informe um e-mail de destino para ativar alertas por e-mail." });
        return;
    }

    analiseLotesModel.salvarConfiguracaoLote(idLote, limiteIntegridade, emailAtivo, destinatarioEmail, slackAtivo)
        .then(async function () {
            if (emailAtivo && destinatarioEmail) {
                try {
                    await snsClient.send(new SubscribeCommand({
                        TopicArn: SNS_TOPIC_ARN,
                        Protocol: "email",
                        Endpoint: destinatarioEmail
                    }));
                } catch (erroSns) {
                    console.error("Aviso SNS Subscribe:", erroSns.message);
                }
            }
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