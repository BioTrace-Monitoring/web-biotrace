// Importando framework express
// Utilizado para criar o servidor e gerenciar rotas HTTP do projeto
var express = require("express");

// Criando um objeto Router do express
// Utilizado para separar e organizar as rotas do projeto
var router = express.Router();

// Importando o arquivo usuarioController
var usuarioController = require("../controllers/usuarioController");

const middleware = require("../middlewares/authMiddleware");


router.get("/cargos", function (req, res) {
    usuarioController.listarCargos(req, res);
});

router.post("/autenticar", function (req, res) {
    usuarioController.autenticarUsuario(req, res);
});

router.post("/:idEmpresa", middleware.verificarToken, middleware.verificarCargo(["BioTrace", "Administrador"]), function (req, res) {
    usuarioController.cadastrarUsuario(req, res);
});

router.post("/recuperarSenha", function (req, res) {
    usuarioController.esqueciSenha(req, res);
});

// Exportando o router
// Outros arquivos podem usar essas funções
module.exports = router;