var express = require("express");

var router = express.Router();

var hospitalController = require("../controllers/hospitalController");

router.get("/:idEmpresa", hospitalController.listarHospitais);

router.post("/:idEmpresa", function (req, res) {
    hospitalController.cadastrarHospital(req, res);
})

module.exports = router;
