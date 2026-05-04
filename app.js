const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Routes import
const adminRoutes = require("./Routes/admin.routes");
const bookingRoutes = require("./Routes/booking.routes");
const photographerRoutes = require("./Routes/photographer.routes");

// Routes use
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/photographers", photographerRoutes);

// Test route
app.get("/", (req, res) => {
    res.send("API Running ✅");
});

module.exports = app;