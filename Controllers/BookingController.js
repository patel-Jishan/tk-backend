const Booking = require("../Models/BookingSchema");
const Service = require("../Models/ServiceSchema");
const Photographer = require("../Models/PhotographerSchema");

const { sendBookingMail } = require("./MailController");

async function CreateBooking(req, res) {
    try {
        let { customer, events, addons } = req.body;

        let estimate = 0;

        // 🔥 Calculate Event Services
        for (let event of events) {
            for (let item of event.services) {
                let service = await Service.findById(item.serviceId);
                if (!service) continue;

                if (service.priceType === "per_day") {
                    estimate += service.price;
                } else if (service.priceType === "per_unit") {
                    estimate += service.price * item.quantity;
                }
            }
        }

        // 🔥 Addons
        if (addons?.length) {
            for (let item of addons) {
                let service = await Service.findById(item.serviceId);
                if (!service) continue;

                if (service.priceType === "fixed") {
                    estimate += service.price;
                } else if (service.priceType === "per_unit") {
                    estimate += service.price * item.quantity;
                }
            }
        }

        let booking = await Booking.create({
            bookingId: "BK" + Date.now(),
            customer,
            events,
            addons,
            estimate
        });

        // 🔥 Populate service names for mail (serviceId -> name, price)
        let populatedBooking = await Booking.findById(booking._id)
            .populate("events.services.serviceId", "name price priceType")
            .populate("addons.serviceId", "name price priceType");

        // 🔥 Mail call with full details
        await sendBookingMail({
            customer: populatedBooking.customer,
            bookingId: populatedBooking.bookingId,
            events: populatedBooking.events,
            addons: populatedBooking.addons,
            estimate: populatedBooking.estimate,
            status: populatedBooking.status,
            createdAt: populatedBooking.createdAt
        });

        res.json({ success: true, booking });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

async function GetAllBookings(req, res) {
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

async function AssignPhotographer(req, res) {
    try {
        let { id } = req.params;
        let { assigned } = req.body;

        let booking = await Booking.findById(id);
        if (!booking) {
            return res.json({ success: false, message: "Booking not found" });
        }

        // 🔥 Loop through each assignment
        for (let assign of assigned) {

            let event = booking.events.find(e => e.day === assign.day);
            if (!event) continue;

            let photographer = await Photographer.findById(assign.photographerId);
            if (!photographer) {
                return res.json({ success: false, message: "Photographer not found" });
            }

            // 🔥 Availability Check
            if (photographer.bookedDates.includes(event.date)) {
                return res.json({
                    success: false,
                    message: `Photographer already booked on ${event.date}`
                });
            }

            // 🔥 Add booked date
            photographer.bookedDates.push(event.date);
            await photographer.save();
        }

        // 🔥 Save assignment in booking
        booking.assigned = assigned;
        await booking.save();

        res.json({ success: true, message: "Photographer assigned successfully", booking });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

async function GetEstimate(req, res) {
    try {
        let { events, addons } = req.body;

        let total = 0;

        // 🔥 Event Services
        for (let event of events) {
            for (let item of event.services) {
                let service = await Service.findById(item.serviceId);
                if (!service) continue;

                if (service.priceType === "per_day") {
                    total += service.price;
                } else if (service.priceType === "per_unit") {
                    total += service.price * item.quantity;
                }
            }
        }

        // 🔥 Addons
        if (addons?.length) {
            for (let item of addons) {
                let service = await Service.findById(item.serviceId);
                if (!service) continue;

                if (service.priceType === "fixed") {
                    total += service.price;
                } else if (service.priceType === "per_unit") {
                    total += service.price * item.quantity;
                }
            }
        }

        res.json({ success: true, estimate: total });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

module.exports = {
    CreateBooking,
    GetAllBookings,
    AssignPhotographer,
    GetEstimate
};