let express = require('express');
const { Auth } = require('../Middlewares/Auth');
const {
    Dashboard,
    GetSingleBooking,
    UpdateStatus,
    GetPhotographers,
    GetAvailablePhotographers,
    AdminLogin,
    GetEnquiries,
    ConvertToBooking,
    GetBookings,
    LogOut,
DeleteBooking
} = require('../Controllers/AdminController');



let router = express.Router();

router.post("/login", AdminLogin);

router.get("/dashboard", Auth("admin"), Dashboard);

router.get("/bookings", Auth("admin"), GetBookings);
router.get("/bookings/:id", Auth("admin"), GetSingleBooking);
router.patch("/bookings/:id/status", Auth("admin"), UpdateStatus);
router.delete("/:id", Auth("admin"), DeleteBooking );

router.get("/enquiries", Auth("admin"), GetEnquiries);
router.get("/bookings-only", Auth("admin"), GetBookings);
router.patch("/convert/:id", Auth("admin"), ConvertToBooking);

router.get("/photographers", Auth("admin"), GetPhotographers);
router.get("/photographers/available", Auth("admin"), GetAvailablePhotographers);
router.post("/logout", Auth("admin"), LogOut);

module.exports = router;