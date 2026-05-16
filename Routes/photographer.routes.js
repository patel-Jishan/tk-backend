let express = require('express');
const { Auth } = require('../Middlewares/Auth');
const upload = require("../Middlewares/upload");
const {
    CreatePhotographer,
    GetPhotographers,
    UpdatePhotographer,
    DeletePhotographer
} = require('../Controllers/PhotographerController');

let router = express.Router();

router.post("/", upload.single("avatar"),Auth("admin"), CreatePhotographer);
router.get("/", Auth("admin"), GetPhotographers);
router.patch("/:id", upload.single("avatar"),  Auth("admin"), UpdatePhotographer);
router.delete("/:id",  Auth("admin"),DeletePhotographer);


module.exports = router;