const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require('cors');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors({
    origin: [
            "https://www.tkmomentscapture.com",
            "https://tkmomentscapture.com",
            "http://localhost:5173"
    ],
    credentials:true,
}))
app.use(cookieParser());

// Routes import
const adminRoutes = require("./Routes/admin.routes");
const bookingRoutes = require("./Routes/booking.routes");
const photographerRoutes = require("./Routes/photographer.routes");
const serviceRoutes = require("./Routes/service.routes");
const contactRoutes = require("./Routes/contact.routes");
const paymentRoutes = require("./Routes/payment.routes");

// Routes use
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/photographers", photographerRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/contactUs", contactRoutes);
app.use("/api/payments", paymentRoutes);

// Test route
app.get("/", (req, res) => {
    res.send("API Running ✅");
});

module.exports = app;
