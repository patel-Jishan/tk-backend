const express = require("express");
const { Auth } = require("../Middlewares/Auth");
const { CreateService, GetServices, DeleteService, UpdateService } = require("../Controllers/ServiceController");

const router = express.Router();

router.post("/", Auth("admin"), CreateService);   
router.get("/", GetServices); 
router.put("/:id", Auth("admin"), UpdateService);
router.delete   ("/:id", Auth("admin"), DeleteService);                   

module.exports = router;
