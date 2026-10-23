var express = require("express");
var router = express.Router();
var equipamentoController = require("../controllers/equipamentoController");
var parametroController = require("../controllers/parametroController");

router.get("/infraestrutura/:idEmpresa", parametroController.painel);
router.get("/parametro/:idEmpresa/previa", parametroController.previa);
router.put("/parametro/:idEmpresa", parametroController.salvar);

router.get("/modelo/:idEmpresa", equipamentoController.listarModelos);
router.post("/modelo/:idEmpresa", equipamentoController.cadastrarModelo);
router.get("/lote/:idEmpresa", equipamentoController.listarLotes);
router.post("/lote/:idEmpresa", equipamentoController.cadastrarLote);
router.post("/intervalo/:idEmpresa", equipamentoController.cadastrarIntervalo);
router.get("/:idEmpresa", equipamentoController.listarEquipamentos);
router.post("/:idEmpresa", equipamentoController.cadastrarEquipamento);
router.patch("/:idEmpresa/:idEquipamento/hospital", equipamentoController.atualizarHospital);

module.exports = router;
