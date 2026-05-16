let express = require('express');
const { Auth } = require('../Middlewares/Auth');
const {
    CreateBooking,
    AssignPhotographer,
    GetEstimate,
    GetAllBookings
} = require('../Controllers/BookingController');

let router = express.Router();

router.post("/", CreateBooking);
router.get("/admin", Auth("admin"), GetAllBookings);
router.patch("/assign/:id", Auth("admin"), AssignPhotographer);
router.post("/estimate", GetEstimate);



module.exports = router;