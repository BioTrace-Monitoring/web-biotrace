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
                        // 401 - senha ou o login estão ausentes, incorretos ou expirados
                        res.status(401).send("Email e/ou senha inválido(s)");
                    }

                    else {
                        res.status(403).send("Mais de um usuário com o mesmo login e senha!");
                    }
                }

                // catch() é executado quando falha na execução da promise
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
        empresaModel.cadastrarUsuario(idEmpresa, nome, dt_nascimento, telefone, cpf, email, senha, fkCargo)
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


// Exportando as funções do controller
// Outros arquivos podem usar essas funções
module.exports =
{
    autenticarUsuario,
    cadastrarUsuario,
    listarCargos
}