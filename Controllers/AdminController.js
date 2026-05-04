const Booking = require("../Models/BookingSchema");
const Photographer = require("../Models/PhotographerSchema");


// 📊 Dashboard
async function Dashboard(req, res) {
    try {
        let totalBookings = await Booking.countDocuments();
        let pending = await Booking.countDocuments({ status: "pending" });
        let confirmed = await Booking.countDocuments({ status: "confirmed" });
        let cancelled = await Booking.countDocuments({ status: "cancelled" });

        let photographers = await Photographer.countDocuments();

        let revenueData = await Booking.find({ status: "confirmed" });
        let revenue = revenueData.reduce((sum, b) => sum + b.estimate, 0);

        res.json({
            success: true,
            data: {
                totalBookings,
                pending,
                confirmed,
                cancelled,
                photographers,
                revenue
            }
        });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


// 📄 Get All Bookings
async function GetBookings(req, res) {
    try {
        let bookings = await Booking.find()
            .populate("events.services.serviceId")
            .populate("addons.serviceId")
            .populate("assigned.photographerId");

        res.json({ success: true, bookings });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


// 🔍 Get Single Booking
async function GetSingleBooking(req, res) {
    try {
        let { id } = req.params;

        let booking = await Booking.findById(id)
            .populate("events.services.serviceId")
            .populate("addons.serviceId")
            .populate("assigned.photographerId");

        if (!booking) {
            return res.json({ success: false, message: "Booking not found" });
        }

        res.json({ success: true, booking });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


// 🟢 Update Booking Status
async function UpdateStatus(req, res) {
    try {
        let { id } = req.params;
        let { status } = req.body;

        let booking = await Booking.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        res.json({ success: true, booking });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


// 👤 Get All Photographers
async function GetPhotographers(req, res) {
    try {
        let data = await Photographer.find({ isActive: true });
        res.json({ success: true, data });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


// 🔍 Get Available Photographers (IMPORTANT 🔥)
async function GetAvailablePhotographers(req, res) {
    try {
        let { date, role } = req.query;

        let photographers = await Photographer.find({
            role,
            isActive: true,
            bookedDates: { $ne: date }
        });

        res.json({ success: true, photographers });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


module.exports = {
    Dashboard,
    GetBookings,
    GetSingleBooking,
    UpdateStatus,
    GetPhotographers,
    GetAvailablePhotographers
};