// Importando o usuarioModel
const usuarioModel = require("../models/usuarioModel");
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');


// Função que autentica um usuário
function autenticarUsuario(req, res) {
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;

    // Validando se os dados foram recebidos corretamente
    if (email == undefined) {
        res.status(400).send("Seu email está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("Sua senha está undefined!");
    } else {
        // Chama a função do model que consulta o banco de dados
        usuarioModel.autenticarUsuario(email, senha)
            .then(function (resultadoAutenticar) {
                    console.log(`\nResultados encontrados: ${resultadoAutenticar.length}`); // qtd de registros encontrados
                    console.log(`Resultados: ${JSON.stringify(resultadoAutenticar)}`); // transforma JSON em String

                    // Se encontrou um usuário
                    if (resultadoAutenticar.length == 1) {
                        console.log(resultadoAutenticar);

                        const token = jwt.sign(
                            {id: resultadoAutenticar[0].id_usuario, email: resultadoAutenticar[0].email, nome: resultadoAutenticar[0].nome, empresa: resultadoAutenticar[0].empresa, cargo: resultadoAutenticar[0].cargo, fk_empresa: resultadoAutenticar[0].fk_empresa},
                            process.env.JWT_SECRET,
                            {expiresIn: process.env.JWT_EXPIRES_IN}
                        );

                        res.json({token,
                            id: resultadoAutenticar[0].id_usuario,
                            email: resultadoAutenticar[0].email,
                            nome: resultadoAutenticar[0].nome,
                            empresa: resultadoAutenticar[0].empresa,
                            cargo: resultadoAutenticar[0].cargo,
                            fk_empresa: resultadoAutenticar[0].fk_empresa,
                        });
                    }

                    // Nenhum usuário encontrado
                    else if (resultadoAutenticar.length == 0) {
                        res.status(401).send("Email e/ou senha inválido(s)");
                    } else {
                        res.status(403).send("Mais de um usuário com o mesmo login e senha!");
                    }
                }
            ).catch(function (erro) {
                console.log(erro);
                console.log("\nHouve um erro ao realizar o login! Erro: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function listarCargos(req,res){
    usuarioModel.listarCargos()
    .then(function(resultado){
        res.json(resultado);
    })
    .catch(function(erro){
        console.log(erro);
        res.status(500).json(erro.sqlMessage);
    });
}

// Função que cadastra um novo user
function cadastrarUsuario(req, res) {
    var idEmpresa = Number(req.params.idEmpresa);
    var nome = req.body.nomeServer;
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;
    var cargo = req.body.cargoServer;
    var cpf = req.body.cpfServer;
    var dt_nascimento = req.body.dtNascimentoServer;
    var telefone = req.body.telefoneServer;

    if (!Number.isInteger(idEmpresa) || idEmpresa <= 0) {
        return res.status(400).json("Id da empresa inválido!");
    }

    if (nome == undefined) {
        res.status(400).send("Nome está undefined!");
    } else if (email == undefined) {
        res.status(400).send("Email está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("Senha está undefined!");
    } else if (cargo == undefined) {
        res.status(400).send("Cargo está undefined!");
    } else if (cpf == undefined) {
        res.status(400).send("CPF está undefined!");
    } else if (dt_nascimento == undefined) {
        res.status(400).send("Data de nascimento está undefined!");
    } else if (telefone == undefined) {
        res.status(400).send("Telefone está undefined!");
    } else {
        usuarioModel.cadastrarUsuario(idEmpresa, nome, dt_nascimento, telefone, cpf, email, senha, cargo)
            .then(function (resultado) {
                res.status(200).json({
                    sucesso: true,
                    idInserido: resultado.insertId,
                    mensagem: "Usuário cadastrado com sucesso"
                });
            })
            .catch(function (erro) {
                console.log(erro);
                console.log("\nHouve um erro ao cadastrar o usuário! Erro: ", erro.sqlMessage);
                res.status(500).json({
                    sucesso: false,
                    idInserido: null,
                    mensagem: "Erro ao cadastrar usuário"
                });
            });
    }
}

async function esqueciSenha(req, res) {
    const email = req.body.email;


}

module.exports = {
    autenticarUsuario,
    cadastrarUsuario,
    listarCargos,
    esqueciSenha
}