// Importando framework express
// Utilizado para criar o servidor e gerenciar rotas HTTP do projeto
var express = require("express");

// Criando um objeto Router do express
// Utilizado para separar e organizar as rotas do projeto
var router = express.Router();

// Importando o arquivo usuarioController
var usuarioController = require("../controllers/usuarioController");


router.get("/cargos", usuarioController.listarCargos);


// Rota POST para cadastrar um usuário
// POST para enviar dados ao servidor
router.post("/cadastrar-usuario", function (req, res)
{
    // Chamando a função cadastrarUsuario do usuarioController.js

    // req -> requisição: Possui todas as informações da requisição
    // res -> resposta: Retornar uma resposta pro usuario

    // Direcionando a requisição pro controller responsavel
    usuarioController.cadastrarUsuario(req, res);
})




// Rota POST para autenticar um usuário
// POST para enviar dados ao servidor
router.post("/autenticar-usuario", function (req, res)
{
    // Chamando a função autenticarUsuario do usuarioController.js

    // req -> requisição: Possui todas as informações da requisição
    // res -> resposta: Retornar uma resposta pro usuario

    // Direcionando a requisição pro controller responsavel
    usuarioController.autenticarUsuario(req, res);
});




// ROTA GET para visualizar os dados um usuário
// GET para buscar dados do servidor
router.get("/visualizar-usuario/:fkUsuario", function (req, res)
{
    // Chamando a função visualizarUsuario do usuarioController.js

    // :fkUsuario -> parâmetro de rota, o valor será dinâmico dependendo do usuario logado

    // req -> requisição: Possui todas as informações da requisição
    // res -> resposta: Retornar uma resposta pro usuario

    // Direcionando a requisição pro controller responsavel
    usuarioController.visualizarUsuario(req, res);
})




// Exportando o router
// Outros arquivos podem usar essas funções
module.exports = router;