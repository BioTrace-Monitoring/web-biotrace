var express = require("express");
var router = express.Router();
var localizacaoController = require("../controllers/localizacaoController");
var { verificarToken } = require("../middlewares/authMiddleware");

router.get("/locais/:idUsuario", verificarToken, localizacaoController.listarLocais);

module.exports = router;
