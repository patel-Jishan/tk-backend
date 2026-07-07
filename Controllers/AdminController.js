const Booking = require("../Models/BookingSchema");
const { sendBookingMail} = require("./MailController")
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
            { id: admin._id, role:  admin.role },
            process.env.ACCESS,
            { expiresIn: "15m" }
        );

        let refreshToken = jwt.sign(
            { id: admin._id, role:  admin.role },
            process.env.REFRESH,
            { expiresIn: "7d" }
        );

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
            .populate("assigned.assignments.photographerId")
.populate("assigned.assignments.serviceId");
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
    console.log("Booking ID:", req.params.id);

    let booking = await Booking.findById(req.params.id)
      .populate("events.services.serviceId")
      .populate("addons.serviceId")
      .populate("assigned.assignments.photographerId")
      .populate("assigned.assignments.serviceId");

    console.log("Booking:", booking);

    if (!booking) {
      return res.json({
        success: false,
        message: "Booking not found"
      });
    }

    res.json({ success: true, booking });

  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message
    });
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

    let booking = await Booking.findById(id)
      .populate("events.services.serviceId", "name price priceType")
      .populate("addons.serviceId", "name price priceType");

    if (!booking) {
      return res.json({
        success: false,
        message: "Booking not found"
      });
    }

    // ❌ Already booking
    if (booking.type === "booking") {
      return res.json({
        success: false,
        message: "Already converted to booking"
      });
    }

    // ✅ Convert enquiry → booking
    booking.type = "booking";
    await booking.save();

    // ✅ Send mail after conversion
    await sendBookingMail({
      customer: booking.customer,
      bookingId: booking.bookingId,
      events: booking.events,
      addons: booking.addons,
      estimate: booking.estimate,
      status: booking.status,
      createdAt: booking.createdAt
    });

    res.json({
      success: true,
      message: "Enquiry converted to booking",
      booking
    });

  } catch (error) {
    res.json({
      success: false,
      message: error.message
    });
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

        if (!date) {
            return res.json({
                success: false,
                message: "Date is required"
            });
        }

        const query = {
            isActive: true,
            bookedDates: { $ne: date }
        };

        if (role) query.role = role;

        let photographers = await Photographer.find(query).sort({ role: 1, name: 1 });

        res.json({ success: true, photographers });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

async function LogOut(req,res) {

    try{
        res.clearCookie("accessToken", {httpOnly: true, secure: false});
        res.clearCookie("refreshToken", {httpOnly: true, secure: false});
        res.json({success: true, message: "Admin logged Out"});


    }catch(error){
        res.json({success: false, message: error.message});

    }

    
}
// delete 
async function DeleteBooking(req, res) {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.json({
        success: false,
        message: "Booking not found"
      });
    }

    // ❌ only enquiry or cancelled booking allowed
    if (
      booking.type !== "enquiry" &&
      booking.status !== "cancelled"
    ) {
      return res.json({
        success: false,
        message: "Only enquiry or cancelled bookings can be deleted"
      });
    }

    // 🔥 remove assigned dates from photographers
    if (booking.assigned?.length) {
      for (const assign of booking.assigned) {
        const event = booking.events.find(
          e => e.day === assign.day
        );

        if (!event) continue;

        for (const item of assign.assignments) {
  await Photographer.findByIdAndUpdate(
    item.photographerId,
    {
      $pull: {
        bookedDates: event.date
      }
    }
  );
}
      }
    }

    await Booking.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Booking deleted successfully"
    });

  } catch (error) {
    res.json({
      success: false,
      message: error.message
    });
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
    LogOut,
    DeleteBooking
};
