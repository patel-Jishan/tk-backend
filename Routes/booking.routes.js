let express = require('express');
const { Auth } = require('../Middlewares/Auth');
const {
    CreateBooking,
    AssignPhotographer,
    GetEstimate,
    UpdateWorkStatus,
    UpdateClientPayment,
    UpdateDataHandover,
    UpdateBookingPrice,
    // GetAllBookings
} = require('../Controllers/BookingController');

let router = express.Router();

router.post("/", CreateBooking);
// router.get("/admin", Auth("admin"), GetAllBookings);
router.patch("/assign/:id", Auth("admin"), AssignPhotographer);
router.post("/estimate", GetEstimate);

router.post("/booking/:id/handover", UpdateDataHandover);

router.post("/work-status/:id", UpdateWorkStatus);
router.post("/payment/:id", UpdateClientPayment);
router.put("/booking/:id/update-price", UpdateBookingPrice);


module.exports = router;
