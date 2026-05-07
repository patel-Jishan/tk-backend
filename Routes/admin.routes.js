let express = require('express');
const { Auth } = require('../Middlewares/Auth');
const {
    Dashboard,
    GetBookings,
    GetSingleBooking,
    UpdateStatus,
    GetPhotographers,
    GetAvailablePhotographers,
    AdminLogin
} = require('../Controllers/AdminController');

let router = express.Router();

router.post("/login", AdminLogin);

router.get("/dashboard", Auth("admin"), Dashboard);

router.get("/bookings", Auth("admin"), GetBookings);
router.get("/bookings/:id", Auth("admin"), GetSingleBooking);
router.patch("/bookings/:id/status", Auth("admin"), UpdateStatus);

router.get("/photographers", Auth("admin"), GetPhotographers);
router.get("/photographers/available", Auth("admin"), GetAvailablePhotographers);

module.exports = router;