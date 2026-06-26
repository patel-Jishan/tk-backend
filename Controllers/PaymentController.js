const mongoose = require("mongoose");
const Photographer = require("../Models/PhotographerSchema");
const PhotographerPayment = require("../Models/PhotographerPaymentSchema");
const Booking = require("../Models/BookingSchema");
const { sendPaymentMail } = require("./MailController");

function getPreviousMonth(month) {
  let [year, m] = month.split("-").map(Number);
  m -= 1;

  if (m === 0) {
    m = 12;
    year -= 1;
  }

  return `${year}-${m.toString().padStart(2, "0")}`;
}

const getId = (value) => {
  if (!value) return "";
  if (value._id) return value._id.toString();
  if (value.id) return value.id.toString();
  return value.toString();
};

async function calculatePhotographerWork(photographer, month) {
  const photographerId = photographer._id.toString();
  const bookings = await Booking.find({
    "assigned.assignments.photographerId": photographer._id
  }).populate("assigned.assignments.serviceId", "name");

  const workItems = [];
  const workDates = new Set();

  for (const booking of bookings) {
    for (const assign of booking.assigned || []) {
      const event = (booking.events || []).find((item) => item.day === assign.day);
      if (!event?.date || !String(event.date).startsWith(month)) continue;

      for (const assignment of assign.assignments || []) {
        if (getId(assignment.photographerId) !== photographerId) continue;

        const customAmount = Number(assignment.payAmount);
        const amount = Number.isFinite(customAmount) && customAmount > 0
          ? customAmount
          : Number(photographer.perDayRate || 0);
        workDates.add(event.date);

        workItems.push({
          bookingId: booking._id,
          bookingCode: booking.bookingId,
          date: event.date,
          serviceName: assignment.serviceId?.name || "Service",
          amount
        });
      }
    }
  }

  return {
    workItems,
    totalAmount: workItems.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    totalDays: workDates.size
  };
}

async function UpdatePayment(req, res) {
  try {
    const {
      photographerId,
      month,
      amountPaid = 0,
      transactionId,
      paymentMethod,
      note,
      type = "advance"
    } = req.body;

    const photographer = await Photographer.findById(photographerId);

    if (!photographer) {
      return res.json({ success: false, message: "Photographer not found" });
    }

    const currentRate = Number(photographer.perDayRate || 0);
    const workSummary = await calculatePhotographerWork(photographer, month);

    if (workSummary.totalDays === 0) {
      return res.json({
        success: false,
        message: "No payable assignment found in this month"
      });
    }

    let payment = await PhotographerPayment.findOne({
      photographerId,
      month
    });

    const previousMonth = getPreviousMonth(month);
    const previousPayment = await PhotographerPayment.findOne({
      photographerId,
      month: previousMonth
    });
    const carryForward = previousPayment?.extraPaid || 0;

    if (!payment) {
      payment = new PhotographerPayment({
        photographerId,
        month,
        transactions: [],
        carryForward,
        advancePaid: carryForward,
        extraPaid: 0
      });
    }

    payment.totalDays = workSummary.totalDays;
    payment.perDayRate = currentRate;
    payment.workItems = workSummary.workItems;
    payment.totalAmount = workSummary.totalAmount;

    if (transactionId) {
      const exists = payment.transactions.find(
        (transaction) => transaction.transactionId === transactionId
      );

      if (exists) {
        return res.json({
          success: false,
          message: "Duplicate transactionId"
        });
      }
    }

    if (amountPaid > 0) {
      payment.transactions.push({
        amount: amountPaid,
        transactionId,
        paymentMethod,
        type
      });

      payment.advancePaid += amountPaid;
    }

    if (payment.advancePaid > payment.totalAmount) {
      payment.extraPaid = payment.advancePaid - payment.totalAmount;
      payment.advancePaid = payment.totalAmount;
      payment.remainingAmount = 0;
    } else {
      payment.extraPaid = 0;
      payment.remainingAmount = payment.totalAmount - payment.advancePaid;
    }

    if (payment.advancePaid === 0) {
      payment.status = "pending";
    } else if (payment.remainingAmount > 0) {
      payment.status = "partial";
    } else {
      payment.status = "paid";
    }

    const [year, m] = month.split("-").map(Number);
    const lastDate = new Date(year, m, 0);
    const today = new Date();

    if (payment.status !== "paid" && today > lastDate) {
      payment.status = "overdue";
    }

    payment.note = note;

    await payment.save();

    if (amountPaid > 0) {
      const lastTransaction =
        payment.transactions[payment.transactions.length - 1];

      await sendPaymentMail({
        photographer,
        payment,
        lastTransaction
      });
    }

    res.json({
      success: true,
      message: "Payment updated",
      payment
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

async function GetAllPayments(req, res) {
  try {
    const payments = await PhotographerPayment.find()
      .populate("photographerId", "name email phone");

    res.json({ success: true, payments });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

async function GetUnpaidPhotographers(req, res) {
  try {
    const payments = await PhotographerPayment.find({
      status: { $ne: "paid" }
    }).populate("photographerId");

    res.json({ success: true, payments });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

async function GetPaymentByPhotographer(req, res) {
  try {
    const { photographerId } = req.params;

    const payments = await PhotographerPayment.find({
      photographerId: new mongoose.Types.ObjectId(photographerId)
    }).populate("photographerId", "name email phone");

    if (!payments.length) {
      return res.json({
        success: false,
        message: "No payment data found"
      });
    }

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

async function GetPaymentsByMonth(req, res) {
  try {
    const { month } = req.params;

    const payments = await PhotographerPayment.find({ month })
      .populate("photographerId", "name email phone");

    if (!payments.length) {
      return res.json({
        success: false,
        message: "No payments found for this month"
      });
    }

    res.json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

module.exports = {
  UpdatePayment,
  GetAllPayments,
  GetUnpaidPhotographers,
  GetPaymentByPhotographer,
  GetPaymentsByMonth
};
