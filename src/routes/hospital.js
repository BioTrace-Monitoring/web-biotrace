var express = require("express");

var router = express.Router();

var hospitalController = require("../controllers/hospitalController");

router.get("/:idEmpresa", hospitalController.listarHospitais);

router.post("/:idEmpresa", function (req, res) {
    hospitalController.cadastrarHospital(req, res);
})

// Rotas para consultar, alterar e excluir os cadastros.
router.get("/:idEmpresa/:idHospital", function (req, res) {
    hospitalController.buscarHospital(req, res);
});

router.put("/:idEmpresa/:idHospital", function (req, res) {
    hospitalController.alterarHospital(req, res);
});

router.delete("/:idEmpresa/:idHospital", function (req, res) {
    hospitalController.excluirHospital(req, res);
});

module.exports = router;
