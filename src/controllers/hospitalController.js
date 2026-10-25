var hospitalModel = require("../models/hospitalModel");

function cadastrarHospital(req, res) {
    var idEmpresa = Number(req.params.idEmpresa);

    if (!Number.isSafeInteger(idEmpresa) || idEmpresa <= 0) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "ID da empresa inválido."
        });
    }

    var nome = req.body.nomeServer;
    var cnpj = req.body.cnpjServer;
    var cep = req.body.cepServer;
    var numero = req.body.numeroServer;


    if (nome == undefined) {
        res.status(400).send("Nome do hospital está undefined!");
    } else if (cnpj == undefined) {
        res.status(400).send("CNPJ está undefined!");
    } else if (cep == undefined) {
        res.status(400).send("CEP está undefined!");
    } else if (numero == undefined) {
        res.status(400).send("Número está undefined!");
    } else {
        return hospitalModel.cadastrarHospital(nome, cnpj, cep, numero, idEmpresa)
            .then(function (resultado) {
                console.log("Hospital cadastrado!");
                res.json({
                    sucesso: true,
                    idInserido: resultado.insertId,
                    mensagem: "Hospital cadastrado com sucesso"
                });
            }).catch(function (erro) {
                console.log(erro);
                console.log("\nHouve um erro ao realizar o cadastro! Erro: ", erro.sqlMessage);

                if (erro.code === "ER_DUP_ENTRY" || erro.errno === 1062) {
                    return res.status(409).json({
                        sucesso: false,
                        idInserido: null,
                        mensagem: "Sua empresa já cadastrou um hospital com esse CNPJ."
                    });
                }

                res.status(500).json({
                    sucesso: false,
                    idInserido: null,
                    mensagem: "Erro ao cadastrar hospital"
                });
            });
    }
}

function listarHospitais(req, res) {
    var idEmpresa = Number(req.params.idEmpresa);

    if (!Number.isSafeInteger(idEmpresa) || idEmpresa <= 0) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "ID da empresa inválido."
        });
    }

    return hospitalModel.listarHospitais(idEmpresa)
        .then(function (hospitais) {
            return res.status(200).json({ sucesso: true, hospitais: hospitais });
        })
        .catch(function (erro) {
            console.error("Erro ao listar hospitais:", erro);
            return res.status(500).json({
                sucesso: false,
                mensagem: "Não foi possível carregar os hospitais. Tente novamente."
            });
        });
}

function buscarHospital(req, res) {
    var idHospital = Number(req.params.idHospital);
    if (!Number.isSafeInteger(idHospital) || idHospital <= 0) {
        return res.status(400).json({ sucesso: false, mensagem: "Hospital inválido." });
    }
    hospitalModel.buscarHospital(Number(req.params.idEmpresa), idHospital)
        .then(function (hospitais) {
            if (!hospitais.length) return res.status(404).json({ sucesso: false, mensagem: "Hospital não encontrado." });
            res.json({ sucesso: true, hospital: hospitais[0] });
        }).catch(function (erro) { tratarErroHospital(res, erro); });
}

function alterarHospital(req, res) {
    var idHospital = Number(req.params.idHospital);
    var nome = req.body.nomeServer;
    var cnpj = req.body.cnpjServer;
    var cep = req.body.cepServer;
    var numero = req.body.numeroServer;
    if (!Number.isSafeInteger(idHospital) || idHospital <= 0 ||
        typeof nome !== "string" || !nome.trim() || nome.length > 100 ||
        !/^\d{14}$/.test(cnpj) || typeof cep !== "string" || (cep !== "" && !/^\d{8}$/.test(cep)) ||
        typeof numero !== "string" || numero.length > 10) {
        return res.status(400).json({ sucesso: false, mensagem: "Preencha corretamente os dados do hospital." });
    }
    hospitalModel.alterarHospital(Number(req.params.idEmpresa), idHospital, nome.trim(), cnpj, cep, numero.trim())
        .then(function (resultado) {
            if (!resultado.affectedRows) return res.status(404).json({ sucesso: false, mensagem: "Hospital não encontrado." });
            res.json({ sucesso: true, mensagem: "Hospital alterado com sucesso." });
        }).catch(function (erro) { tratarErroHospital(res, erro); });
}

function excluirHospital(req, res) {
    var idHospital = Number(req.params.idHospital);
    if (!Number.isSafeInteger(idHospital) || idHospital <= 0) {
        return res.status(400).json({ sucesso: false, mensagem: "Hospital inválido." });
    }
    hospitalModel.excluirHospital(Number(req.params.idEmpresa), idHospital)
        .then(function (resultado) {
            if (!resultado.affectedRows) return res.status(404).json({ sucesso: false, mensagem: "Hospital não encontrado." });
            res.json({ sucesso: true, mensagem: "Hospital excluído com sucesso." });
        }).catch(function (erro) { tratarErroHospital(res, erro); });
}

function tratarErroHospital(res, erro) {
    if (erro.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ sucesso: false, mensagem: "Já existe um hospital com esse CNPJ." });
    }
    if (erro.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({ sucesso: false, mensagem: "Este hospital possui equipamentos. Altere o hospital desses equipamentos antes de excluir." });
    }
    console.error("Erro ao gerenciar hospital:", erro);
    res.status(500).json({ sucesso: false, mensagem: "Não foi possível concluir a operação no hospital." });
}

module.exports = {
    buscarHospital,
    alterarHospital,
    excluirHospital,
    cadastrarHospital,
    listarHospitais
}
