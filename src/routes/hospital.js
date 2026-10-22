var express = require("express");

var router = express.Router();

var hospitalController = require("../controllers/hospitalController");

const middleware = require("../middlewares/authMiddleware");

router.post("/", function (req, res) {
    hospitalController.cadastrarHospital(req, res);
})

module.exports = router;