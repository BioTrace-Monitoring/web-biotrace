var express = require("express");
var router = express.Router();
var chamadosController = require("../controllers/chamadosController");
var { verificarToken } = require("../middlewares/authMiddleware");

router.get("/:idEmpresa", verificarToken, chamadosController.listarChamados);

module.exports = router;
