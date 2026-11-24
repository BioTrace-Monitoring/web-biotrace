var express = require("express");
var router = express.Router();
var analiseLotesController = require("../controllers/analiseLotesController");

router.get("/", function (req, res) {
    analiseLotesController.listarLotes(req, res);
});

router.get("/:idLote/painel", function (req, res) {
    analiseLotesController.obterPainelLote(req, res);
});

router.put("/:idLote/configuracao", function (req, res) {
    analiseLotesController.atualizarConfiguracao(req, res);
});

module.exports = router;