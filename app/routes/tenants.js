const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/tenants.controller");

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.post("/:id/checkout", ctrl.checkout);
router.delete("/:id", ctrl.remove);

module.exports = router;
