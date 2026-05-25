// const Photographer = require("../Models/PhotographerSchema");
// const PhotographerPayment = require("../Models/PhotographerPaymentSchema");
// const { sendPaymentMail } = require("./MailController");
const mongoose = require("mongoose");

// ✅ CREATE / UPDATE PAYMENT
const Photographer = require("../Models/PhotographerSchema");
const PhotographerPayment = require("../Models/PhotographerPaymentSchema");
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

async function UpdatePayment(req, res) {
  try {
    let {
      photographerId,
      month,
      perDayRate,
      amountPaid = 0,
      transactionId,
      paymentMethod,
      note,
      type = "advance"
    } = req.body;

    let photographer = await Photographer.findById(photographerId);

    if (!photographer) {
      return res.json({ success: false, message: "Photographer not found" });
    }

    // 🔥 count working days
    let totalDays = photographer.bookedDates.filter(date =>
      date.startsWith(month)
    ).length;

    if (totalDays === 0) {
      return res.json({
        success: false,
        message: "No work in this month"
      });
    }

    let totalAmount = totalDays * perDayRate;

    let payment = await PhotographerPayment.findOne({
      photographerId,
      month
    });

    // 🔥 GET PREVIOUS MONTH EXTRA
    let previousMonth = getPreviousMonth(month);

    let previousPayment = await PhotographerPayment.findOne({
      photographerId,
      month: previousMonth
    });

    let carryForward = previousPayment?.extraPaid || 0;

    // 🔥 CREATE NEW PAYMENT
    if (!payment) {
      payment = new PhotographerPayment({
        photographerId,
        month,
        totalDays,
        perDayRate,
        totalAmount,
        carryForward,
        advancePaid: carryForward,
        remainingAmount: totalAmount - carryForward,
        extraPaid: 0,
        transactions: []
      });
    }

    // 🔥 ADD TRANSACTION
    if (amountPaid > 0) {
      payment.transactions.push({
        amount: amountPaid,
        transactionId,
        paymentMethod,
        type
      });

      payment.advancePaid += amountPaid;
    }

    // 🔥 OVERPAY LOGIC
    if (payment.advancePaid > payment.totalAmount) {
      payment.extraPaid = payment.advancePaid - payment.totalAmount;
      payment.advancePaid = payment.totalAmount;
      payment.remainingAmount = 0;
    } else {
      payment.extraPaid = 0;
      payment.remainingAmount = payment.totalAmount - payment.advancePaid;
    }

    // 🔥 STATUS
    if (payment.advancePaid === 0) {
      payment.status = "pending";
    } else if (payment.remainingAmount > 0) {
      payment.status = "partial";
    } else {
      payment.status = "paid";
    }

    // 🔥 OVERDUE
    let today = new Date();
    let paymentMonthEnd = new Date(month + "-31");

    if (payment.status !== "paid" && today > paymentMonthEnd) {
      payment.status = "overdue";
    }

    payment.note = note;

    await payment.save();

    // 🔥 SEND MAIL
    if (amountPaid > 0) {
      let lastTransaction = payment.transactions[payment.transactions.length - 1];

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


// ✅ GET ALL PAYMENTS
async function GetAllPayments(req, res) {
    try {
        let payments = await PhotographerPayment.find()
            .populate("photographerId", "name email");

        res.json({ success: true, payments });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// ✅ FILTER UNPAID
async function GetUnpaidPhotographers(req, res) {
    try {
        let payments = await PhotographerPayment.find({
            status: { $ne: "paid" }
        }).populate("photographerId");

        res.json({ success: true, payments });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

async function GetPaymentByPhotographer(req, res) {
  try {
    let { photographerId } = req.params;

    let payments = await PhotographerPayment.find({
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
    let { month } = req.params;

    let payments = await PhotographerPayment.find({ month })
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