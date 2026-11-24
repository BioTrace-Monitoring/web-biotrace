var express = require('express');
var router = express.Router();
var dashboardAlertasController = require('../controllers/dashboardAlertasController');      

router.get("/:idEmpresa/kpis", dashboardAlertasController.buscarKpis);
router.get("/:idEmpresa/distribuicao", dashboardAlertasController.buscarDistribuicao);
router.get("/:idEmpresa/mapa-calor", dashboardAlertasController.buscarMapaCalor);
router.get("/:idEmpresa/localizacoes", dashboardAlertasController.buscarLocalizacoes);
router.get("/:idEmpresa/evolucao", dashboardAlertasController.buscarEvolucao);

module.exports = router;
