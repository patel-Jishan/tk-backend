const express = require("express");
const { Auth } = require("../Middlewares/Auth");
const { CreateService, GetServices, DeleteService } = require("../Controllers/ServiceController");

const router = express.Router();

router.post("/", Auth("admin"), CreateService);   
router.get("/", GetServices); 
router.delete   ("/:id", Auth("admin"), DeleteService);                   

module.exports = router;
