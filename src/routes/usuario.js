// Importando framework express
// Utilizado para criar o servidor e gerenciar rotas HTTP do projeto
var express = require("express");

// Criando um objeto Router do express
// Utilizado para separar e organizar as rotas do projeto
var router = express.Router();

// Importando o arquivo usuarioController
var usuarioController = require("../controllers/usuarioController");


router.get("/cargos", function (req, res) {
    usuarioController.listarCargos(req, res);
});

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


router.post("/autenticar-usuario", function (req, res) {
    usuarioController.autenticarUsuario(req, res);
});

// Exportando o router
// Outros arquivos podem usar essas funções
module.exports = router;