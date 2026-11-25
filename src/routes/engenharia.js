var express = require("express");
var router = express.Router();
var controller = require("../controllers/engenhariaController");
var auth = require("../middlewares/authMiddleware");

router.use(auth.verificarToken, controller.validarAcesso);
router.get("/catalogos", controller.listarCatalogos);
router.get("/analise-termica", controller.consultarAnaliseTermica);
router.get("/analise-termica/equipamentos/:id", controller.consultarEquipamentoTermico);
module.exports = router;
