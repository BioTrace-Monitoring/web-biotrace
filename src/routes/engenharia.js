var express = require("express");
var router = express.Router();
var controller = require("../controllers/engenhariaController");
var relatorios = require("../controllers/relatorioEngenhariaController");
var auth = require("../middlewares/authMiddleware");

router.use(auth.verificarToken, controller.validarAcesso);
router.use(function (req, res, next) {
    if (
        req.method === "POST" &&
        (!req.body || typeof req.body !== "object" || Array.isArray(req.body))
    ) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Envie os campos em um objeto JSON.",
        });
    }
    next();
});
router.get("/catalogos", controller.listarCatalogos);
router.get("/protocolos", controller.listarProtocolos);
router.get("/protocolos/:id", controller.buscarProtocolo);
router.post("/protocolos", controller.cadastrarProtocolo);
router.post("/protocolos/:id/versoes", controller.cadastrarProtocolo);
router.get("/ensaios", controller.listarEnsaios);
router.get("/ensaios/:id", controller.buscarEnsaio);
router.post("/ensaios", controller.cadastrarEnsaio);
router.post("/ensaios/:id/iniciar", controller.iniciarEnsaio);
router.post("/ensaios/:id/cancelar", controller.cancelarEnsaio);
router.get("/relatorios", relatorios.listarRelatorios);
router.get("/relatorios/:id", relatorios.buscarRelatorio);
router.post("/ensaios/:id/processar", relatorios.processarEnsaio);
module.exports = router;
