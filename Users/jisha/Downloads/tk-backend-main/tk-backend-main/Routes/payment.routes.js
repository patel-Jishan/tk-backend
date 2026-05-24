const express = require("express");
const router = express.Router();

const {
  UpdatePayment,
  GetAllPayments,
  GetUnpaidPhotographers,
  GetPaymentByPhotographer,
  GetPaymentsByMonth
} = require("../Controllers/PaymentController");

router.post("/update", UpdatePayment);

router.get("/", GetAllPayments);

router.get("/unpaid", GetUnpaidPhotographers);

router.get("/photographer/:photographerId", GetPaymentByPhotographer);

router.get("/month/:month", GetPaymentsByMonth);

module.exports = router;