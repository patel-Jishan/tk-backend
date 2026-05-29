const Booking = require("../Models/BookingSchema");
const Photographer = require("../Models/PhotographerSchema");
const Admin = require("../Models/admin.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");



async function AdminLogin(req, res) {
    try {
        let { email, password } = req.body;

        let admin = await Admin.findOne({ email });
        if (!admin) {
            return res.json({ success: false, message: "Admin not found" });
        }

        let isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid password" });
        }

        let accessToken = jwt.sign(
            { id: admin._id, role: "admin" },
            process.env.ACCESS,
            { expiresIn: "15m" }
        );

        let refreshToken = jwt.sign(
            { id: admin._id, role: "admin" },
            process.env.REFRESH,
            { expiresIn: "7d" }
        );

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: false,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
        });

        res.json({ success: true, message: "Admin logged in" });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}



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
        let bookings = await Booking.find({ type: "booking" }) // 🔥 filter
            .populate("events.services.serviceId")
            .populate("addons.serviceId")
            .populate("assigned.photographerIds");

        res.json({ success: true, bookings });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


async function GetEnquiries(req, res) {
    try {
        let data = await Booking.find({ type: "enquiry" })
            .populate("events.services.serviceId")
            .populate("addons.serviceId");

        res.json({ success: true, data });

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
            .populate("assigned.photographerIds");

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

async function ConvertToBooking(req, res) {
    try {
        let { id } = req.params;

        let booking = await Booking.findByIdAndUpdate(
            id,
            { type: "booking" },
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

async function LogOut(req,res) {

    try{
        res.clearCookie("accessToken", {httpOnly: true, secure: false});
        res.clearCookie("refreshToken", {htppOnly: true, secure: false});
        res.json({success: true, message: "Admin logged Out"});


    }catch(error){
        res.json({success: false, message: error.message});

    }
    
}



module.exports = {
    AdminLogin,
    Dashboard,
    GetBookings,
    GetEnquiries,
    GetSingleBooking,
    UpdateStatus,
    ConvertToBooking,
    GetPhotographers,
    GetAvailablePhotographers,
    LogOut
};
