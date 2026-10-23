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

module.exports = {
    cadastrarHospital,
    listarHospitais
}
