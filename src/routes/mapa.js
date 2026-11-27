var express = require("express");
var router = express.Router();
var localizacaoController = require("../controllers/localizacaoController");

router.get("/locais/:idUsuario", localizacaoController.listarLocais);

module.exports = router;
