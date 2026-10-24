// Importando o usuarioModel
const usuarioModel = require("../models/usuarioModel");
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const {mandarEmail} = require('../config/mailer');
const {gerarTokenRecSenha, validarTokenRecSenha} = require('../middlewares/authMiddleware');


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

    const usuario = await usuarioModel.buscarEmail(email);

    if (!usuario) {
        return res.JSON({ mensagem: "Email não existe" });
    }    

    const token = gerarTokenRecSenha(usuario[0].id_usuario);

    const link = `${process.env.APP_HOST}:${process.env.APP_PORT}/nova_senha.html?token=${token}`;

    const emailMandar = await mandarEmail();
    const info = await emailMandar.sendMail({
        from: '"BioTrace" <no-reply@biotrace.com>',
        to: email,
        subject: 'Recuperação de senha - BioTrace',
        html: `<p>Olá ${usuario.nome_usuario},</p>
               <p>Clique no link abaixo para redefinir sua senha (válido por 15 min):</p>
               <a href="${link}">${link}</a>`
    });

    console.log('Preview do email: ', nodemailer.getTestMessageUrl(info));
    
    res.json({ mensagem: 'Se o email existir enviaremos instruções' })
}

async function resetarSenha(req, res) {
    const {token, novaSenha} = req.body;
    let payload;

    try {
        payload = validarTokenRecSenha(token);
    } catch (err) {
        return res.status(400).json({ erro: 'Token inválido ou expirado' });
    }

    await usuarioModel.atualizarSenha(payload.id, novaSenha);

    res.json({ mensagem: 'Senha atualizada com sucesso' })
};

function cargosGerenciaveis() {
    return [2, 3, 4];
}

function listarUsuarios(req, res) {
    usuarioModel.listarUsuarios(Number(req.params.idEmpresa))
        .then(function (usuarios) {
            var permitidos = cargosGerenciaveis();
            var usuariosPermitidos = usuarios.filter(function (usuario) {
                return permitidos.includes(Number(usuario.fk_cargo));
            });
            res.json({ sucesso: true, usuarios: usuariosPermitidos });
        }).catch(function (erro) { tratarErroUsuario(res, erro); });
}

async function buscarUsuarioPermitido(req) {
    var idUsuario = Number(req.params.idUsuario);
    if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
        var erroId = new Error("Usuário inválido.");
        erroId.status = 400;
        throw erroId;
    }
    var usuarios = await usuarioModel.buscarUsuario(Number(req.params.idEmpresa), idUsuario);
    if (!usuarios.length) {
        var erroAusente = new Error("Usuário não encontrado.");
        erroAusente.status = 404;
        throw erroAusente;
    }
    if (!cargosGerenciaveis().includes(Number(usuarios[0].fk_cargo))) {
        var erroCargo = new Error("Seu perfil não permite gerenciar este usuário.");
        erroCargo.status = 403;
        throw erroCargo;
    }
    return usuarios[0];
}

async function buscarUsuario(req, res) {
    try {
        var usuario = await buscarUsuarioPermitido(req);
        res.json({ sucesso: true, usuario: usuario });
    } catch (erro) { tratarErroUsuario(res, erro); }
}

async function alterarUsuario(req, res) {
    var nome = req.body.nomeServer;
    var email = req.body.emailServer;
    var telefone = req.body.telefoneServer;
    var cpf = req.body.cpfServer;
    var nascimento = req.body.dtNascimentoServer;
    var cargo = Number(req.body.cargoServer);
    var senha = req.body.senhaServer === undefined ? "" : req.body.senhaServer;
    var data = new Date(nascimento + "T00:00:00Z");

    if (typeof nome !== "string" || !nome.trim() || nome.length > 45 ||
        typeof email !== "string" || email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !/^\d{10,11}$/.test(telefone) || !/^\d{11}$/.test(cpf) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(nascimento) || !Number.isFinite(data.getTime()) ||
        data.toISOString().slice(0, 10) !== nascimento || data > new Date() ||
        typeof senha !== "string" || (senha !== "" && senha.length < 8)) {
        return res.status(400).json({ sucesso: false, mensagem: "Confira os dados do usuário. A nova senha deve ter pelo menos 8 caracteres." });
    }
    if (!cargosGerenciaveis().includes(cargo)) {
        return res.status(403).json({ sucesso: false, mensagem: "Você não tem permissão para atribuir este cargo." });
    }
    try {
        await buscarUsuarioPermitido(req);
        var resultado = await usuarioModel.alterarUsuario(Number(req.params.idEmpresa), Number(req.params.idUsuario),
            nome.trim(), nascimento, telefone, cpf, email.trim(), cargo, senha);
        if (!resultado.affectedRows) return res.status(404).json({ sucesso: false, mensagem: "Usuário não encontrado." });
        res.json({ sucesso: true, mensagem: "Usuário alterado com sucesso." });
    } catch (erro) { tratarErroUsuario(res, erro); }
}

async function excluirUsuario(req, res) {
    try {
        await buscarUsuarioPermitido(req);
        var resultado = await usuarioModel.excluirUsuario(Number(req.params.idEmpresa), Number(req.params.idUsuario));
        if (!resultado.affectedRows) return res.status(404).json({ sucesso: false, mensagem: "Usuário não encontrado." });
        res.json({ sucesso: true, mensagem: "Usuário excluído com sucesso." });
    } catch (erro) { tratarErroUsuario(res, erro); }
}

function tratarErroUsuario(res, erro) {
    if (erro.status) return res.status(erro.status).json({ sucesso: false, mensagem: erro.message });
    if (erro.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ sucesso: false, mensagem: "Já existe um usuário com esse CPF ou e-mail." });
    }
    if (erro.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({ sucesso: false, mensagem: "Este usuário possui registros vinculados e não pode ser excluído." });
    }
    console.error("Erro ao gerenciar usuário:", erro);
    res.status(500).json({ sucesso: false, mensagem: "Não foi possível concluir a operação no usuário." });
}

module.exports = {
    listarUsuarios,
    buscarUsuario,
    alterarUsuario,
    excluirUsuario,
    autenticarUsuario,
    cadastrarUsuario,
    listarCargos,
    esqueciSenha,
    resetarSenha
}