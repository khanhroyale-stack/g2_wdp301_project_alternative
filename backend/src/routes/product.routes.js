const express = require("express");
const { getProductById } = require("../controllers/product.controller");

const router = express.Router();

router.get("/:id", getProductById);

module.exports = router;
