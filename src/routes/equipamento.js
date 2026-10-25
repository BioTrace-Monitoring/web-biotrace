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

// Rotas para consultar, alterar e excluir os cadastros.
router.get("/modelo/:idEmpresa/:idModelo", function (req, res) {
    equipamentoController.buscarModelo(req, res);
});

router.put("/modelo/:idEmpresa/:idModelo", function (req, res) {
    equipamentoController.alterarModelo(req, res);
});

router.delete("/modelo/:idEmpresa/:idModelo", function (req, res) {
    equipamentoController.excluirModelo(req, res);
});

router.get("/lote/:idEmpresa/:idLote", function (req, res) {
    equipamentoController.buscarLote(req, res);
});

router.put("/lote/:idEmpresa/:idLote", function (req, res) {
    equipamentoController.alterarLote(req, res);
});

router.delete("/lote/:idEmpresa/:idLote", function (req, res) {
    equipamentoController.excluirLote(req, res);
});

router.get("/:idEmpresa/:idEquipamento", function (req, res) {
    equipamentoController.buscarEquipamento(req, res);
});

router.put("/:idEmpresa/:idEquipamento", function (req, res) {
    equipamentoController.alterarEquipamento(req, res);
});

router.delete("/:idEmpresa/:idEquipamento", function (req, res) {
    equipamentoController.excluirEquipamento(req, res);
});

module.exports = router;
