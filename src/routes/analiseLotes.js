var express = require("express");
var router = express.Router();
var analiseLotesController = require("../controllers/analiseLotesController");

router.get("/lotes", analiseLotesController.listarLotes);
router.get("/:idLote/ociosidade", analiseLotesController.obterOciosidade);
router.get("/:idLote/perfis", analiseLotesController.obterPerfis);

module.exports = router;
