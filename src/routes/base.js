const router = require("express").Router();
const base = require("../controllers/baseController");
const { verificarToken } = require("../middlewares/authMiddleware");

router.use("/:idEmpresa", verificarToken, base.verificarEmpresa);
router.post("/:idEmpresa", base.cadastrar);
router.get("/:idEmpresa/funcionarios", base.listarFuncionarios);
router.patch("/:idEmpresa/funcionarios/:idFuncionario", base.realocarFuncionario);

module.exports = router;
