const Photographer = require("../Models/PhotographerSchema");
const PhotographerPayment = require("../Models/PhotographerPaymentSchema");
const { sendPaymentMail } = require("./MailController");
const mongoose = require("mongoose");

// ✅ CREATE / UPDATE PAYMENT
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
      type = "advance" // advance / remaining
    } = req.body;

    let photographer = await Photographer.findById(photographerId);

    if (!photographer) {
      return res.json({ success: false, message: "Photographer not found" });
    }

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

    if (!payment) {
      payment = new PhotographerPayment({
        photographerId,
        month,
        totalDays,
        perDayRate,
        totalAmount,
        advancePaid: 0,
        remainingAmount: totalAmount,
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

    // 🔥 UPDATE CALCULATIONS
    payment.remainingAmount = payment.totalAmount - payment.advancePaid;

    // 🔥 STATUS LOGIC
    if (payment.advancePaid === 0) {
      payment.status = "pending";
    } else if (payment.remainingAmount > 0) {
      payment.status = "partial";
    } else {
      payment.status = "paid";
    }

    // 🔥 OVERDUE LOGIC (simple)
    let today = new Date();
    let paymentMonthEnd = new Date(month + "-31");

    if (payment.status !== "paid" && today > paymentMonthEnd) {
      payment.status = "overdue";
    }

    payment.note = note;

// ✅ SAVE FIRST
await payment.save();

// 🔥 MAIL ONLY IF PAYMENT ADDED
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