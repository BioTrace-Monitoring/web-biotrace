// Importando o empresaModel
var empresaModel = require("../models/empresaModel");

// Função que cadastra uma nova empresa
function cadastrarEmpresa(req, res) {
    // Recuperando os dados enviados pelo form
    var razao_social = req.body.razaoSocialServer;
    var cnpj = req.body.cnpjServer;
    var telefone_comercial = req.body.telefoneComercialServer;
    var cep = req.body.cepServer;
    var numero = req.body.numeroServer;


    // Validando pra que nenhum dado venha vazio
    if (razao_social == undefined) {
        res.status(400).send("Razão Social está undefined!");
    } else if (cnpj == undefined) {
        res.status(400).send("CNPJ está undefined!");
    } else if (telefone_comercial == undefined) {
        res.status(400).send("Telefone Comercial está undefined!");
    } else if (cep == undefined) {
        res.status(400).send("CEP está undefined!");
    } else if (numero == undefined) {
        res.status(400).send("Número está undefined!");
    } else {
        // Chama a função do model que executa o INSERT no banco
        empresaModel.cadastrarEmpresa(razao_social, cnpj, telefone_comercial, cep, numero)
            // Executado quando o cadastro ocorre com sucesso
            .then(function (resultado) {
                console.log("Empresa cadastrada!");
                // Retorna o resultado para o front-end em formato JSON
                res.json({
                    sucesso: true,
                    idInserido: resultado.insertId,
                    mensagem: "Empresa cadastrada com sucesso"
                });
            }).catch(function (erro) {
                console.log(erro);
                console.log("\nHouve um erro ao realizar o cadastro! Erro: ", erro.sqlMessage);

                if (erro.code === "ER_DUP_ENTRY" || erro.errno === 1062) {
                    return res.status(409).json({
                        sucesso: false,
                        idInserido: null,
                        mensagem: "Já existe uma empresa com esse CNPJ."
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

function listarEmpresas(req, res) {
    empresaModel.listarEmpresas()
        .then(function (resultado) {
            res.status(200).json({
                sucesso: true,
                empresas: resultado
            });
        })
        .catch(function (erro) {
            console.log(erro);
            console.log("\nHouve um erro ao listar as empresas! Erro: ", erro.sqlMessage);
            res.status(500).json({
                sucesso: false
            });
        });
}


function excluirEmpresa(req, res) {
    var idEmpresa = Number(req.params.idEmpresa);

    if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) {
        return res.status(400).json("Id da empresa inválido!");
    }

    if (idEmpresa === 1) {
        return res.status(403).json({
            sucesso: false,
            mensagem: "A empresa BioTrace não pode ser excluída."
        });
    }

    empresaModel.excluirEmpresa(idEmpresa)
        .then(function (resultado) {
            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    sucesso: false,
                    mensagem: "Empresa já excluida ou não encontrada."
                });
            }
            res.status(200).json({ sucesso: true });
        })
        .catch(function (erro) {
            console.log(erro);
            console.log("\nHouve um erro ao excluir a empresa! Erro: ", erro.sqlMessage);
            res.status(500).json({
                sucesso: false,
                mensagem: "Houve um erro ao excluir a empresa"
            });
        });
}


// Exportando as funções do controller
// Outros arquivos podem usar essas funções
module.exports = {
    cadastrarEmpresa,
    listarEmpresas,
    excluirEmpresa
}