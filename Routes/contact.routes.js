const express = require("express");
const { sendContactMail } = require("../Controllers/contactController");

const router = express.Router();

router.post("/", sendContactMail);

module.exports = router;
