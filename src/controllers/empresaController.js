// Importando o empresaModel
var empresaModel = require("../models/empresaModel");
const crypto = require("crypto");

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

function cadastrarEquipamento(req, res) {
    var idEmpresa = Number(req.params.idEmpresa);
    var numeroSerie = req.body.numeroSerieServer;

    if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "ID da empresa inválido."
        });
    }

    if (typeof numeroSerie !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(numeroSerie)) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "UUID do equipamento inválido."
        });
    }

    // IMPORTANTE: validar aqui se o usuário autenticado
    // possui acesso à empresa informada na URL.

    var tokenEquipamento = crypto.randomBytes(32).toString("hex");
    var tokenHash = crypto.createHash("sha256").update(tokenEquipamento).digest("hex");

    empresaModel.cadastrarEquipamentoComConfiguracao(numeroSerie, idEmpresa, tokenHash)
        .then(function (idEquipamento) {
            return res.status(201).json({
                sucesso: true,
                idEquipamento: idEquipamento,
                numeroSerie: numeroSerie,
                tokenEquipamento: tokenEquipamento,
                mensagem: "Equipamento cadastrado com métricas configuradas com sucesso."
            });
        })
        .catch(function (erro) {
            console.error("Erro ao cadastrar equipamento:", erro);

            if (erro.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    sucesso: false,
                    mensagem: "Equipamento já cadastrado."
                });
            }

            return res.status(500).json({
                sucesso: false,
                mensagem: "Erro ao cadastrar equipamento."
            });
        });
}

async function validarEquipamento(req, res) {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            sucesso: false,
            erro: "Token de equipamento não informado."
        });
    }

    const token = authorization.substring(7).trim();

    if (!token) {
        return res.status(401).json({
            sucesso: false,
            erro: "Token de equipamento não informado."
        });
    }

    try {
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const equipamento = await empresaModel.buscarCredencialEquipamento(tokenHash);

        if (!equipamento) {
            return res.status(403).json({
                sucesso: false,
                erro: "Token de equipamento inválido, expirado ou revogado."
            });
        }

        return res.status(200).json({
            sucesso: true,
            equipamento: equipamento
        });
    } catch (erro) {
        console.error("Erro ao validar credencial do equipamento:", erro);
        return res.status(500).json({
            sucesso: false,
            erro: "Não foi possível validar a credencial do equipamento."
        });
    }
}

// Exportando as funções do controller
// Outros arquivos podem usar essas funções
module.exports = {
    cadastrarEmpresa,
    listarEmpresas,
    excluirEmpresa,
    cadastrarEquipamento,
    validarEquipamento
};