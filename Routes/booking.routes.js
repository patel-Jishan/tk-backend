let express = require('express');
const { Auth } = require('../Middlewares/Auth');
const {
    CreateBooking,
    AssignPhotographer,
    GetEstimate,
    UpdateWorkStatus,
    UpdateClientPayment,
    // GetAllBookings
} = require('../Controllers/BookingController');

let router = express.Router();

router.post("/", CreateBooking);
// router.get("/admin", Auth("admin"), GetAllBookings);
router.patch("/assign/:id", Auth("admin"), AssignPhotographer);
router.post("/estimate", GetEstimate);


router.post("/work-status/:id", UpdateWorkStatus);
router.post("/payment/:id", UpdateClientPayment);


module.exports = router;