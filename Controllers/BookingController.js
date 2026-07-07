const Booking = require("../Models/BookingSchema");
const Service = require("../Models/ServiceSchema");
const Photographer = require("../Models/PhotographerSchema");
const { sendPhotographerAssignMail, sendWorkStatusMail, sendPaymentMailToCustomer } = require("./MailController");
const Setting = require("../Models/SettingSchema");
const { sendBookingMail } = require("./MailController");
const sendWhatsApp = require("../Utils/sendWhatsApp");

const getQuantity = (value) => {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity >= 1 ? Math.floor(quantity) : 1;
};

const getModelId = (value) => {
  if (!value) return "";
  if (value._id) return value._id.toString();
  if (value.id) return value.id.toString();
  return value.toString();
};

function getServiceLineTotal(service, quantity) {
  if (!service) return 0;
  if (service.priceType === "per_day" || service.priceType === "per_unit") {
    return service.price * quantity;
  }
  if (service.priceType === "fixed") return service.price;
  return 0;
}

async function calculateEstimate(events = [], addons = []) {
  let subtotal = 0;
  const eventBreakdown = [];
  const addonBreakdown = [];

  for (let event of events || []) {
    const serviceLines = [];

    for (let item of event.services || []) {
      const service = await Service.findById(item.serviceId);
      if (!service) continue;

      const quantity = getQuantity(item.quantity);
      item.quantity = quantity;
      const total = getServiceLineTotal(service, quantity);
      subtotal += total;

      serviceLines.push({
        serviceId: service._id,
        name: service.name,
        priceType: service.priceType,
        quantity,
        rate: service.price,
        total
      });
    }

    eventBreakdown.push({
      day: event.day,
      date: event.date,
      location: event.location,
      services: serviceLines
    });
  }

  for (let item of addons || []) {
    const service = await Service.findById(item.serviceId);
    if (!service) continue;

    const quantity = getQuantity(item.quantity);
    item.quantity = quantity;
    const total = getServiceLineTotal(service, quantity);
    subtotal += total;

    addonBreakdown.push({
      serviceId: service._id,
      name: service.name,
      priceType: service.priceType,
      quantity,
      rate: service.price,
      total
    });
  }

  let setting = await Setting.findOne();

  if (!setting) {
    setting = await Setting.create({
      profitPercentage: 25
    });
  }

  const profitPercentage = setting.profitPercentage;
  const profitAmount = subtotal * (profitPercentage / 100);

  return {
    subtotal,
    profitPercentage,
    profitAmount,
    estimate: subtotal + profitAmount,
    breakdown: {
      events: eventBreakdown,
      addons: addonBreakdown
    }
  };
}

async function CreateBooking(req, res) {
  try {
    let { customer, events = [], addons = [], isConfirmed } = req.body;
    const estimateData = await calculateEstimate(events, addons);
    const type = isConfirmed ? "booking" : "enquiry";

    const booking = await Booking.create({
      bookingId: "BK" + Date.now(),
      customer,
      events,
      addons,
      subtotal: estimateData.subtotal,
      profitPercentage: estimateData.profitPercentage,
      profitAmount: estimateData.profitAmount,
      estimate: estimateData.estimate,
      payment: {
        totalAmount: estimateData.estimate,
        paidAmount: 0,
        remainingAmount: estimateData.estimate,
        status: "pending"
      },
      type
    });

    if (type === "booking") {
      const populatedBooking = await Booking.findById(booking._id)
        .populate("events.services.serviceId", "name price priceType")
        .populate("addons.serviceId", "name price priceType");

      await sendBookingMail({
        customer: populatedBooking.customer,
        bookingId: populatedBooking.bookingId,
        events: populatedBooking.events,
        addons: populatedBooking.addons,
        subtotal: estimateData.subtotal,
        profitPercentage: estimateData.profitPercentage,
        profitAmount: estimateData.profitAmount,
        estimate: estimateData.estimate,
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
    const bookings = await Booking.find()
      .populate("events.services.serviceId")
      .populate("addons.serviceId")
      .populate("assigned.assignments.photographerId")
      .populate("assigned.assignments.serviceId");

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message
    });
  }
}

function getPreviousAssignedDates(booking) {
  const previousAssignedDates = new Map();

  for (const assign of booking.assigned || []) {
    const event = booking.events.find((item) => item.day === assign.day);
    if (!event) continue;

    for (const item of assign.assignments || []) {
      const photographerId = getModelId(item.photographerId);
      if (!previousAssignedDates.has(photographerId)) {
        previousAssignedDates.set(photographerId, new Set());
      }
      previousAssignedDates.get(photographerId).add(event.date);
    }
  }

  return previousAssignedDates;
}

function validateAssignmentsAgainstQuantity(booking, assigned = []) {
  const assignmentCounts = {};

  for (const assign of assigned || []) {
    const event = booking.events.find((item) => item.day === assign.day);
    if (!event) {
      return `Event day ${assign.day} was not found for this booking`;
    }

    const serviceQuantityMap = {};
    const serviceNameMap = {};
    for (const item of event.services || []) {
      const serviceId = getModelId(item.serviceId);
      serviceQuantityMap[serviceId] = getQuantity(item.quantity);
      serviceNameMap[serviceId] = item.serviceId?.name || "Service";
    }

    const photographerIds = new Set();
    for (const item of assign.assignments || []) {
      const serviceId = getModelId(item.serviceId);
      const photographerId = getModelId(item.photographerId);

      if (!serviceQuantityMap[serviceId]) {
        return "Assigned service does not exist in this event";
      }

      if (photographerIds.has(photographerId)) {
        return "A photographer can be assigned only once per event day";
      }
      photographerIds.add(photographerId);

      const key = `${assign.day}:${serviceId}`;
      assignmentCounts[key] = (assignmentCounts[key] || 0) + 1;
      if (assignmentCounts[key] > serviceQuantityMap[serviceId]) {
        return `${serviceNameMap[serviceId]} requires ${serviceQuantityMap[serviceId]} photographer(s). You cannot assign more than required.`;
      }
    }
  }

  return "";
}

function normalizeAssignmentPay(item, photographer) {
  const payAmount = Number(item.payAmount);
  const fallbackAmount = Number(photographer?.perDayRate || 0);
  return Number.isFinite(payAmount) && payAmount >= 0
    ? payAmount
    : fallbackAmount;
}

async function AssignPhotographer(req, res) {
  try {
    const { id } = req.params;
    const { assigned = [] } = req.body;

    const booking = await Booking.findById(id)
      .populate("events.services.serviceId");

    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    const validationMessage = validateAssignmentsAgainstQuantity(booking, assigned);
    if (validationMessage) {
      return res.json({ success: false, message: validationMessage });
    }

    const previousAssignedDates = getPreviousAssignedDates(booking);
    const nextAssignedDates = new Map();
    const photographersToUpdate = new Map();
    const photographerEventMap = {};

    for (const assign of assigned) {
      const event = booking.events.find((item) => item.day === assign.day);
      if (!event) continue;

      for (const item of assign.assignments || []) {
        const photographer = await Photographer.findById(item.photographerId);

        if (!photographer) {
          return res.json({
            success: false,
            message: "Photographer not found"
          });
        }

        const photographerId = photographer._id.toString();
        photographersToUpdate.set(photographerId, photographer);
        const wasAlreadyAssignedToThisBooking =
          previousAssignedDates.get(photographerId)?.has(event.date);

        if (photographer.bookedDates.includes(event.date) && !wasAlreadyAssignedToThisBooking) {
          return res.json({
            success: false,
            message: `${photographer.name} already booked on ${event.date}`
          });
        }

        if (!nextAssignedDates.has(photographerId)) {
          nextAssignedDates.set(photographerId, new Set());
        }
        nextAssignedDates.get(photographerId).add(event.date);

        const service = await Service.findById(item.serviceId);
        item.payAmount = normalizeAssignmentPay(item, photographer);

        if (!photographerEventMap[photographerId]) {
          photographerEventMap[photographerId] = {
            photographer,
            events: [],
            services: []
          };
        }

        const alreadyAddedEvent = photographerEventMap[photographerId].events.some(
          (entry) => entry.day === event.day && entry.date === event.date
        );

        if (!alreadyAddedEvent) {
          photographerEventMap[photographerId].events.push(event);
        }

        if (service) {
          photographerEventMap[photographerId].services.push(service.name);
        }
      }
    }

    for (const [photographerId, dates] of previousAssignedDates.entries()) {
      const photographer = photographersToUpdate.get(photographerId) || await Photographer.findById(photographerId);
      if (!photographer) continue;

      photographer.bookedDates = (photographer.bookedDates || []).filter((date) => (
        !dates.has(date) || nextAssignedDates.get(photographerId)?.has(date)
      ));
      photographersToUpdate.set(photographerId, photographer);
    }

    for (const [photographerId, dates] of nextAssignedDates.entries()) {
      const photographer = photographersToUpdate.get(photographerId);
      if (!photographer) continue;

      for (const date of dates) {
        if (!photographer.bookedDates.includes(date)) {
          photographer.bookedDates.push(date);
        }
      }
    }

    for (const photographer of photographersToUpdate.values()) {
      await photographer.save();
    }

    booking.assigned = assigned;
    await booking.save();

    for (const key in photographerEventMap) {
      const data = photographerEventMap[key];

      await sendPhotographerAssignMail({
        photographer: data.photographer,
        booking,
        events: data.events,
        services: [...new Set(data.services)]
      });

      const eventList = data.events
        .map((event) => `${event.date}\n${event.location}`)
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
    const { events = [], addons = [] } = req.body;

    res.json({
      success: true,
      ...(await calculateEstimate(events, addons))
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message
    });
  }
}

async function UpdateBookingPrice(req, res) {
  try {
    const { id } = req.params;
    const { discountPercentage } = req.body;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.json({
        success: false,
        message: "Booking not found"
      });
    }

    if (booking.status === "confirmed") {
      return res.json({
        success: false,
        message: "Price cannot be changed after confirmation"
      });
    }

    const subtotal = booking.subtotal;
    const profitAmount = booking.profitAmount;
    const estimate = subtotal + profitAmount;
    const discountAmount = estimate * (discountPercentage / 100);
    const finalAmount = estimate - discountAmount;

    booking.discountPercentage = discountPercentage;
    booking.discountAmount = discountAmount;
    booking.finalAmount = finalAmount;
    booking.payment.totalAmount = finalAmount;
    booking.payment.remainingAmount = finalAmount - booking.payment.paidAmount;

    await booking.save();

    res.json({
      success: true,
      message: "Price updated",
      booking
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
    const { id } = req.params;
    const { workStatus } = req.body;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    booking.workStatus = workStatus;
    await booking.save();

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
    const { id } = req.params;
    const { amount, transactionId, paymentMethod, note } = req.body;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    booking.payment.paidAmount += amount;
    booking.payment.remainingAmount =
      booking.payment.totalAmount - booking.payment.paidAmount;

    if (booking.payment.paidAmount === 0) {
      booking.payment.status = "pending";
    } else if (booking.payment.remainingAmount > 0) {
      booking.payment.status = "partial";
    } else {
      booking.payment.status = "completed";
    }

    booking.payment.history.push({
      amount,
      transactionId,
      paymentMethod,
      note
    });

    await booking.save();

    const lastTransaction =
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

async function UpdateDataHandover(req, res) {
  try {
    const { id } = req.params;
    const {
      photographerId,
      driveId,
      driveType,
      receivedBy,
      note,
      copiedToPC
    } = req.body;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.json({
        success: false,
        message: "Booking not found"
      });
    }

    booking.dataHandover.forEach((handover) => {
      handover.drives.forEach((drive) => {
        if (drive.copiedToPC === undefined) {
          drive.copiedToPC = false;
        }
      });
    });

    const photographerEntry = booking.dataHandover.find(
      (item) => item.photographerId.toString() === photographerId
    );

    const handoverPayload = {
      driveType,
      receivedBy,
      note,
      copiedToPC: copiedToPC === true,
      handedOver: true
    };

    if (photographerEntry) {
      const existingDrive = driveId
        ? photographerEntry.drives.id(driveId)
        : null;

      if (existingDrive) {
        existingDrive.set(handoverPayload);
      } else {
        photographerEntry.drives.push({
          ...handoverPayload,
          handedOverDate: new Date()
        });
      }
    } else {
      booking.dataHandover.push({
        photographerId,
        drives: [
          {
            ...handoverPayload,
            handedOverDate: new Date()
          }
        ]
      });
    }

    await booking.save();

    res.json({
      success: true,
      message: "Data handover saved",
      booking
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  CreateBooking,
  GetAllBookings,
  AssignPhotographer,
  GetEstimate,
  UpdateWorkStatus,
  UpdateClientPayment,
  UpdateDataHandover,
  UpdateBookingPrice
};
