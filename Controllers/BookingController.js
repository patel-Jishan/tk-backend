const Booking = require("../Models/BookingSchema");
const Service = require("../Models/ServiceSchema");
const Photographer = require("../Models/PhotographerSchema");
const { sendPhotographerAssignMail, sendWorkStatusMail, sendPaymentMail, sendPaymentMailToCustomer } = require("./MailController");
const Setting = require("../Models/SettingSchema");
const { sendBookingMail } = require("./MailController");
const sendWhatsApp = require("../Utils/sendWhatsApp");


async function CreateBooking(req, res) {
    try {
        let { customer, events, addons, isConfirmed } = req.body;

        let subtotal = 0;

// 🔥 Event Services
for (let event of events) {
  for (let item of event.services) {
    let service = await Service.findById(item.serviceId);

    if (!service) continue;

    if (service.priceType === "per_day") {
      subtotal += service.price;
    } else if (service.priceType === "per_unit") {
      subtotal += service.price * item.quantity;
    }
  }
}

// 🔥 Addons
if (addons?.length) {
  for (let item of addons) {
    let service = await Service.findById(item.serviceId);

    if (!service) continue;

    if (service.priceType === "fixed") {
      subtotal += service.price;
    } else if (service.priceType === "per_unit") {
      subtotal += service.price * item.quantity;
    }
  }
}

// 🔥 Profit Setting
let setting = await Setting.findOne();

if (!setting) {
  setting = await Setting.create({
    profitPercentage: 25
  });
}

const profitPercentage = setting.profitPercentage;
const profitAmount = subtotal * (profitPercentage / 100);
const finalEstimate = subtotal + profitAmount;
// 🔥 TYPE SET
let type = isConfirmed ? "booking" : "enquiry";

        let booking = await Booking.create({
  bookingId: "BK" + Date.now(),

  customer,
  events,
  addons,

  subtotal,
  profitPercentage,
  profitAmount,

  estimate: finalEstimate,

  payment: {
    totalAmount: finalEstimate,
    paidAmount: 0,
    remainingAmount: finalEstimate,
    status: "pending"
  },

  type
});
        
        // 🔥 MAIL ONLY IF BOOKING CONFIRMED
        if (type === "booking") {

            let populatedBooking = await Booking.findById(booking._id)
                .populate("events.services.serviceId", "name price priceType")
                .populate("addons.serviceId", "name price priceType");

          await sendBookingMail({
  customer: populatedBooking.customer,
  bookingId: populatedBooking.bookingId,
  events: populatedBooking.events,
  addons: populatedBooking.addons,

  subtotal,
  profitPercentage,
  profitAmount,
  estimate: finalEstimate,

  status: populatedBooking.status,
  createdAt: populatedBooking.createdAt
});
        }

        res.json({
            success: true,
            message: type === "booking" ? "Booking created" : "Enquiry saved",
            booking
        });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

async function GetAllBookings(req, res) {
    try {
        let bookings = await Booking.find()
            .populate("events.services.serviceId")
            .populate("addons.serviceId")
            .populate("assigned.photographerIds");

        res.json({ success: true, bookings });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


async function AssignPhotographer(req, res) {
  try {
    let { id } = req.params;
    let { assigned } = req.body;

    let booking = await Booking.findById(id)
      .populate("events.services.serviceId"); // 👈 important for mail

    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    // 🔥 store photographer-wise events
    let photographerEventMap = {};

    for (let assign of assigned) {

      let event = booking.events.find(e => e.day === assign.day);
      if (!event) continue;

      for (let photographerId of assign.photographerIds) {

        let photographer = await Photographer.findById(photographerId);

        if (!photographer) {
          return res.json({
            success: false,
            message: "Photographer not found"
          });
        }

        // ❌ already booked check
        if (photographer.bookedDates.includes(event.date)) {
          return res.json({
            success: false,
            message: `Photographer already booked on ${event.date}`
          });
        }

        // ✅ add booked date (avoid duplicate push)
        if (!photographer.bookedDates.includes(event.date)) {
          photographer.bookedDates.push(event.date);
          await photographer.save();
        }

        // 🔥 collect events per photographer
        if (!photographerEventMap[photographerId]) {
          photographerEventMap[photographerId] = {
            photographer,
            events: []
          };
        }

        photographerEventMap[photographerId].events.push(event);
      }
    }

    // ✅ save assignment
    booking.assigned = assigned;
    await booking.save();

    // 🔥 SEND MAIL (1 per photographer)
    // for (let key in photographerEventMap) {
    //   let data = photographerEventMap[key];

    //   await sendPhotographerAssignMail({
    //     photographer: data.photographer,
    //     booking,
    //     events: data.events
    //   });
    // }
    for (let key in photographerEventMap) {

  let data = photographerEventMap[key];

  await sendPhotographerAssignMail({
    photographer: data.photographer,
    booking,
    events: data.events
  });

  const eventList = data.events
    .map(
      e =>
        `📅 ${e.date}\n📍 ${e.location}`
    )
    .join("\n\n");

  const message = `Hello ${data.photographer.name},

You have been assigned for a new booking.

Booking ID: ${booking.bookingId}

${eventList}

Please contact admin for further details.

TK Moments Capture`;

  await sendWhatsApp(
    data.photographer.phone,
    message
  );
}


    res.json({
      success: true,
      message: "Photographer assigned & mails sent",
      booking
    });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

async function GetEstimate(req, res) {
    try {
        let { events, addons } = req.body;
        let subtotal = 0;

// Events
for (let event of events) {
  for (let item of event.services) {
    let service = await Service.findById(item.serviceId);

    if (!service) continue;

    if (service.priceType === "per_day") {
      subtotal += service.price;
    } else if (service.priceType === "per_unit") {
      subtotal += service.price * item.quantity;
    }
  }
}

// Addons
if (addons?.length) {
  for (let item of addons) {
    let service = await Service.findById(item.serviceId);

    if (!service) continue;

    if (service.priceType === "fixed") {
      subtotal += service.price;
    } else if (service.priceType === "per_unit") {
      subtotal += service.price * item.quantity;
    }
  }
}

// Profit
let setting = await Setting.findOne();

if (!setting) {
  setting = await Setting.create({
    profitPercentage: 25
  });
}

const profitPercentage = setting.profitPercentage;
const profitAmount = subtotal * (profitPercentage / 100);
const finalEstimate = subtotal + profitAmount;

res.json({
  success: true,
  subtotal,
  profitPercentage,
  profitAmount,
  estimate: finalEstimate
});

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
}

async function UpdateWorkStatus(req, res) {
    try {
        let { id } = req.params;
        let { workStatus } = req.body;

        let booking = await Booking.findById(id);

        if (!booking) {
            return res.json({ success: false, message: "Booking not found" });
        }

        booking.workStatus = workStatus;
        await booking.save();

        // 🔥 MAIL SEND
        await sendWorkStatusMail({
            customer: booking.customer,
            bookingId: booking.bookingId,
            workStatus
        });

        res.json({
            success: true,
            message: "Work status updated",
            booking
        });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}



async function UpdateClientPayment(req, res) {
    try {
        let { id } = req.params;
        let { amount, transactionId, paymentMethod, note } = req.body;

        let booking = await Booking.findById(id);

        if (!booking) {
            return res.json({ success: false, message: "Booking not found" });
        }

        // 🔥 ADD PAYMENT
        booking.payment.paidAmount += amount;
        booking.payment.remainingAmount =
            booking.payment.totalAmount - booking.payment.paidAmount;

        // 🔥 STATUS LOGIC
        if (booking.payment.paidAmount === 0) {
            booking.payment.status = "pending";
        } else if (booking.payment.remainingAmount > 0) {
            booking.payment.status = "partial";
        } else {
            booking.payment.status = "completed";
        }

        // 🔥 HISTORY
        booking.payment.history.push({
            amount,
            transactionId,
            paymentMethod,
            note
        });

        await booking.save();

        // 🔥 MAIL SEND
        let lastTransaction =
            booking.payment.history[booking.payment.history.length - 1];

        await sendPaymentMailToCustomer({
            customer: booking.customer,
            booking,
            transaction: lastTransaction
        });

        res.json({
            success: true,
            message: "Payment updated",
            booking
        });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


module.exports = {
    CreateBooking,
    GetAllBookings,
    AssignPhotographer,
    GetEstimate,
    UpdateWorkStatus,
    UpdateClientPayment
};
