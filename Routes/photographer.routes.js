let express = require('express');
const { Auth } = require('../Middlewares/Auth');
const {
    CreatePhotographer,
    GetPhotographers,
    UpdatePhotographer,
    DeletePhotographer
} = require('../Controllers/PhotographerController');

let router = express.Router();

router.post("/", Auth("admin"), CreatePhotographer);
router.get("/", Auth("admin"), GetPhotographers);
router.patch("/:id", Auth("admin"), UpdatePhotographer);
router.delete("/:id", Auth("admin"), DeletePhotographer);

module.exports = router;