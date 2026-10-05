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

router.get("/", function (req, res) {
    empresaController.listarEmpresas(req, res);
})

router.delete("/:idEmpresa", function (req, res) {
    empresaController.excluirEmpresa(req, res);
})

router.post("/:idEmpresa", function (req, res) {
    empresaController.cadastrarUsuario(req, res);
})

// Exportando o router
// Outros arquivos podem usar essas funções
module.exports = router;