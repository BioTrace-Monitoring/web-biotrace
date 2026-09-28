// Importando o usuarioModel
var usuarioModel = require("../models/usuarioModel");


// Função que autentica um usuário
function autenticarUsuario(req, res) {
    // req -> requisição: Possui todas as informações da requisição
    // res -> resposta: Retornar uma resposta pro usuario

    // Recuperando os dados enviados pelo front-end
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;

    // Validando se os dados foram recebidos corretamente
    if (email == undefined) {
        res.status(400).send("Seu email está undefined!");
    }

    else if (senha == undefined) {
        res.status(400).send("Sua senha está undefined!");
    }

    else {
        // Chama a função do model que consulta o banco de dados
        usuarioModel.autenticarUsuario(email, senha)
            // then() é executado quando a consulta é feita com sucesso
            .then(
                // then()

                // O método database.executar() do model retorna uma Promise

                // Promises são utilizadas para lidar com operações que podem demorar
                // pra serem concluídas, como as consultas do banco
                // O código dentro do then() só será executado quando a consulta terminar com sucesso.

                // Contém os dados retornados pela consulta SQL
                function (resultadoAutenticar) {
                    console.log(`\nResultados encontrados: ${resultadoAutenticar.length}`); // qtd de registros encontrados

                    // JSON.stringify() -> transforma um objeto JSON em texto pra facilitar a visualização no terminal

                    console.log(`Resultados: ${JSON.stringify(resultadoAutenticar)}`); // transforma JSON em String

                    // Se encontrou um usuário
                    if (resultadoAutenticar.length == 1) {
                        console.log(resultadoAutenticar);

                        // Retorna os dados para o front-end no formato JSON
                        res.json({
                            id: resultadoAutenticar[0].id,
                            email: resultadoAutenticar[0].email,
                            nome: resultadoAutenticar[0].nome,
                            nivel_acesso: resultadoAutenticar[0].nivel_acesso,
                            fk_empresa: resultadoAutenticar[0].fk_empresa,
                        });
                    }

                    // Nenhum usuário encontrado
                    else if (resultadoAutenticar.length == 0) {
                        // 401 - senha ou o login estão ausentes, incorretos ou expirados
                        res.status(401).send("Email e/ou senha inválido(s)");
                    }

                    else {
                        res.status(403).send("Mais de um usuário com o mesmo login e senha!");
                    }
                }

                // catch() é executado quando falha na execução da promise
            ).catch(
                function (erro) {
                    console.log(erro);
                    console.log("\nHouve um erro ao realizar o login! Erro: ", erro.sqlMessage);
                    res.status(500).json(erro.sqlMessage);
                }
            }).catch( function (erro) {
                console.log(erro);
                console.log("\nHouve um erro ao realizar o login! Erro: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function obterPermissoesUsuario(req, res) {
    var idUsuario = req.params.idUsuario;

    usuarioModel.obterPermissoesUsuario(idUsuario)
        .then(function (resultado) {
            res.json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            console.log("\nHouve um erro ao obter as permissões do usuário! Erro: ", erro.sqlMessage);
            res.status(500).json(erro.sqlMessage);
        });
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
    // Recuperando os dados enviados pelo form
    var nome = req.body.nomeUserServer;
    var dt_nasc = req.body.nascimentoUserServer;
    var telefone = req.body.telefoneUserServer;
    var cpf = req.body.cpfUserServer;
    var email = req.body.emailUserServer;
    var senha = req.body.senhaUserServer;
    var idEmpresa = req.body.idEmpresaServer;

    // Validando pra que nenhum dado venha vazio
    if (nome == undefined) {
        res.status(400).send("Seu nome está undefined!");
    }

    else if (dt_nasc == undefined) {
        res.status(400).send("Sua data de nascimento está undefined!");
    }

    else if (telefone == undefined) {
        res.status(400).send("Seu telefone está undefined!");
    }

    else if (cpf == undefined) {
        res.status(400).send("Seu CPF está undefined!");
    }

    else if (email == undefined) {
        res.status(400).send("Seu e-mail está undefined!");
    }

    else if (senha == undefined) {
        res.status(400).send("Sua senha está undefined!");
    }

    else if (idEmpresa == undefined) {
        res.status(400).send("O ID da empresa está undefined!");
    } else if (cargo == undefined) {
        res.status(400).send("O seu cargo está undefined");
    }
    else {
        // Chama a função do model que executa o INSERT no banco
        usuarioModel.cadastrarUsuario(nome, dt_nasc, telefone, cpf, email, senha, idEmpresa, idCargo)
            // Executado quando o cadastro ocorre com sucesso
            .then(
                function (resultado) {
                    // Retorna o resultado para o front-end em formato JSON
                    res.json(resultado);
                }
                // Executado quando tem algum erro durante o cadastro
            ).catch(
                function (erro) {
                    console.log(erro); // exibe erro no terminal
                    console.log(
                        "\nHouve um erro ao realizar o cadastro! Erro: ",
                        erro.sqlMessage
                    );

                    res.status(500).json(erro.sqlMessage);
                }
            );
    }

    // FLUXO:
    // front envia os dados
    // controller recebe e valida os dados
    // model faz INSERT e banco salva o user
    // resultado volta pro controller
    // controller envia resultado pro front
}


// Exportando as funções do controller
// Outros arquivos podem usar essas funções
module.exports =
{
    autenticarUsuario,
    cadastrarUsuario,
    listarCargos
    //visualizarUsuario
}