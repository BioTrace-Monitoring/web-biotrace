var localizacaoModel = require("../models/localizacaoModel");
var geocodificacaoCep = require("../services/geocodificacaoCep");

async function listarLocais(req, res) {
    var idUsuario = Number(req.params.idUsuario);
    if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
        return res.status(400).json({
            mensagem: "ID do usuário inválido."
        });
    }

    if (Number(req.usuario.id) !== idUsuario || !(Number(req.usuario.fk_empresa) > 0)) {
        return res.status(403).json({ mensagem: "Usuário incompatível com a sessão." });
    }

    try {
        var idEmpresa = await localizacaoModel.buscarEmpresaDoUsuario(idUsuario);
        if (idEmpresa === null) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }
        if (!Number.isSafeInteger(idEmpresa) || idEmpresa <= 0 || idEmpresa !== Number(req.usuario.fk_empresa)) {
            return res.status(403).json({
                mensagem: "O usuário não está associado a uma empresa válida."
            });
        }

        var locais = await localizacaoModel.listarLocais(idEmpresa, req.query.tipo === "base");
        var geocodificados = [];

        for (var local of locais) {
            try {
                var localizacao = await geocodificacaoCep.geocodificarLocal(local);
                geocodificados.push({ ...local, ...localizacao });
            } catch (erroGeocodificacao) {
                console.error(
                    `Não foi possível geocodificar ${local.tipo} ${local.id}:`,
                    erroGeocodificacao.message
                );
                geocodificados.push({
                    ...local,
                    latitude: null,
                    longitude: null,
                    erroGeocodificacao: "Não foi possível obter as coordenadas deste local."
                });
            }
        }

        return res.status(200).json({
            empresaId: idEmpresa,
            bases: geocodificados.filter(local => local.tipo === "base"),
            hospitais: geocodificados.filter(local => local.tipo === "hospital")
        });
    } catch (erro) {
        console.error("Erro ao consultar locais da empresa:", erro.code || erro.name);
        return res.status(500).json({
            mensagem: "Não foi possível carregar as bases e os hospitais da empresa."
        });
    }
}

module.exports = { listarLocais };
