const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");
const auth = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate.middleware");
const { askAISchema } = require("../validators/ai.validator");

router.post("/ask", auth.protect, validate(askAISchema), aiController.askAI);

module.exports = router;
