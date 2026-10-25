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

router.post("/autenticar", function (req, res) {
    usuarioController.autenticarUsuario(req, res);
});

router.post("/enviarEmail", function (req, res) {
    usuarioController.esqueciSenha(req, res);
});

router.post("/recSenha", function (req, res) {
    usuarioController.resetarSenha(req, res);
});

router.post("/:idEmpresa", function (req, res) {
    usuarioController.cadastrarUsuario(req, res);
});

// Rotas para consultar, alterar e excluir os cadastros.
router.get("/:idEmpresa", function (req, res) {
    usuarioController.listarUsuarios(req, res);
});

router.get("/:idEmpresa/:idUsuario", function (req, res) {
    usuarioController.buscarUsuario(req, res);
});

router.put("/:idEmpresa/:idUsuario", function (req, res) {
    usuarioController.alterarUsuario(req, res);
});

router.delete("/:idEmpresa/:idUsuario", function (req, res) {
    usuarioController.excluirUsuario(req, res);
});

// Exportando o router
// Outros arquivos podem usar essas funções
module.exports = router;