// Importando framework express
// Utilizado para criar o servidor e gerenciar rotas HTTP do projeto
var express = require("express");

// Criando um objeto Router do express
// Utilizado para separar e organizar as rotas do projeto
var router = express.Router();

// Importando o arquivo empresaController
var empresaController = require("../controllers/empresaController");


router.post("/", function (req, res) {
    empresaController.cadastrarEmpresa(req, res);
})


// Rota POST para autenticar um empresa
// POST para enviar dados ao servidor
router.post("/autenticar-empresa", function (req, res)
{
    // Chamando a função autenticarempresa do empresaController.js

    // req -> requisição: Possui todas as informações da requisição
    // res -> resposta: Retornar uma resposta pro empresa

    // Direcionando a requisição pro controller responsavel
    empresaController.autenticarEmpresa(req, res);
});




// ROTA GET para visualizar os dados um empresa
// GET para buscar dados do servidor
router.get("/visualizar-empresa", function (req, res)
{
    // Chamando a função visualizarempresa do empresaController.js

    // req -> requisição: Possui todas as informações da requisição
    // res -> resposta: Retornar uma resposta pro empresa

    // Direcionando a requisição pro controller responsavel
    empresaController.visualizarEmpresa(req, res);
})




// Exportando o router
// Outros arquivos podem usar essas funções
module.exports = router;