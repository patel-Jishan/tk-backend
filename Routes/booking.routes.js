let express = require('express');
const { Auth } = require('../Middlewares/Auth');
const {
    CreateBooking,
    GetAllBookings,
    AssignPhotographer
} = require('../Controllers/BookingController');

let router = express.Router();

router.post("/", CreateBooking);
router.get("/admin", Auth("admin"), GetAllBookings);
router.patch("/assign/:id", Auth("admin"), AssignPhotographer);
// router.delete("/delete/:id", Auth("admin"), DeletePhotographer);

module.exports = router;