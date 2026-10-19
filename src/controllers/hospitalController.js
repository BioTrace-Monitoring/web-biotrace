var hospitalModel = require("../models/hospitalModel");

function cadastrarHospital(req, res) {
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
        hospitalModel.cadastrarHospital(nome, cnpj, cep, numero)
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
                        mensagem: "Já existe um hospital com esse CNPJ."
                    });
                }

                res.status(500).json({
                    sucesso: false,
                    idInserido: null,
                    mensagem: "Erro ao cadastrar empresa"
                });
            });
    }
}

module.exports = {
    cadastrarHospital
}