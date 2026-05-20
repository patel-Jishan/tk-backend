const nodemailer = require("nodemailer");

// ─── Helper: format date nicely ───────────────────────────────────────────────
function fmtDate(createdAt) {
  if (!createdAt) return "—";
  return new Date(createdAt).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

// ─── Helper: format ₹ amount ──────────────────────────────────────────────────
function fmtAmt(n) {
  return (n || 0).toLocaleString("en-IN");
}

// ─── Build event rows ─────────────────────────────────────────────────────────
function buildEventRows(events, showServices = true) {
  return events.map(e => {
    const servicePills = showServices
      ? (e.services || []).map(s => {
        const svc = s.serviceId;          // populated object
        const name = svc?.name || "Service";
        const qty = s.quantity > 1 ? ` ×${s.quantity}` : "";
        return `<span style="display:inline-block;background:#f5ede0;border:0.5px solid #d4b88a;border-radius:20px;padding:2px 10px;font-size:11px;color:#6b4c2e;margin:2px 2px 2px 0">${name}${qty}</span>`;
      }).join("") || "—"
      : null;

    return `
        <tr>
          <td style="padding:10px 12px;color:#8b5e2e;font-weight:bold;border-bottom:0.5px solid #ead9c0;vertical-align:top">Day ${e.day}</td>
          <td style="padding:10px 12px;color:#4a3420;border-bottom:0.5px solid #ead9c0;vertical-align:top">${e.date}</td>
          <td style="padding:10px 12px;color:#4a3420;border-bottom:0.5px solid #ead9c0;vertical-align:top">${e.location}</td>
          ${showServices ? `<td style="padding:10px 12px;border-bottom:0.5px solid #ead9c0;vertical-align:top">${servicePills}</td>` : ""}
        </tr>`;
  }).join("");
}

// ─── Build addon rows ─────────────────────────────────────────────────────────
function buildAddonRows(addons) {
  if (!addons?.length) return "";
  return addons.map(a => {
    const svc = a.serviceId;                 // populated object
    const name = svc?.name || "Add-on";
    const qty = a.quantity > 1 ? ` ×${a.quantity}` : "";
    const price = svc?.priceType === "per_unit"
      ? (svc.price || 0) * (a.quantity || 1)
      : (svc?.price || 0);
    return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:0.5px solid #ead9c0;font-size:13px">
          <span style="color:#4a3420">${name}${qty}</span>
          <span style="color:#8b5e2e;font-weight:bold">₹${fmtAmt(price)}</span>
        </div>`;
  }).join("");
}


// ═════════════════════════════════════════════════════════════════════════════
async function sendBookingMail({ customer, bookingId, events, addons, estimate, status, createdAt }) {
  try {
    const { name, email, phone, note } = customer;

    // const transporter = nodemailer.createTransport({
    //     service: "gmail",
    //     auth: {
    //         user: process.env.EMAIL_USER,
    //         pass: process.env.EMAIL_PASS,
    //     },
    // });
   const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
  family: 4, 
  debug: true,
});

    const eventRowsWithServices = buildEventRows(events, true);
    const eventRowsWithoutServices = buildEventRows(events, false);
    const addonRows = buildAddonRows(addons);
    const bookingDate = fmtDate(createdAt);
    const statusColor = status === "confirmed" ? "#5a8a3c" : status === "cancelled" ? "#a33030" : "#b87a1a";

    // ══════════════════════════════════════
    //  CUSTOMER MAIL
    // ══════════════════════════════════════
    await transporter.sendMail({
      from: `TK MOMENTS CAPTURE <${process.env.BREVO_USER}>`,
      to: email,
      subject: `✅ Booking Confirmed — ${bookingId} | TK Moments Capture`,
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,'Times New Roman',serif">
<div style="max-width:620px;margin:0 auto;padding:24px 16px">
<div style="background:#fffdf8;border-radius:12px;overflow:hidden;border:0.5px solid #d4c4a0">

  <div style="background:#3b2a1a;padding:32px 32px 24px;text-align:center">
    <div style="color:#e8c97a;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin-bottom:8px;font-family:Arial,sans-serif">Photography Studio</div>
    <div style="color:#fffdf8;font-size:26px;letter-spacing:2px">TK Moments Capture</div>
    <div style="color:#b89a6a;font-size:12px;letter-spacing:2px;margin-top:6px;font-style:italic;font-family:Arial,sans-serif">Preserving your precious memories</div>
  </div>

  <div style="background:#c4a265;padding:14px 32px;display:flex;align-items:center;gap:10px">
    <div style="width:28px;height:28px;background:#3b2a1a;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">
      <span style="color:#e8c97a;font-size:16px;line-height:1">&#10003;</span>
    </div>
    <span style="color:#3b2a1a;font-size:13px;letter-spacing:1px;font-style:italic;font-family:Arial,sans-serif">Booking Confirmed — We're excited to capture your moments!</span>
  </div>

  <div style="padding:28px 32px">

    <div style="font-size:22px;color:#3b2a1a;margin-bottom:8px">Dear <span style="color:#8b5e2e">${name}</span>,</div>
    <p style="color:#6b5040;font-size:14px;line-height:1.7;margin-bottom:24px;font-family:Arial,sans-serif">
      Thank you for choosing TK Moments Capture. Your booking has been successfully received. Below is a complete summary of your events, services, and payment details. We will be in touch within 24 hours to finalize arrangements.
    </p>

    <div style="background:#f5ede0;border:0.5px solid #d4b88a;border-left:3px solid #8b5e2e;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;font-family:Arial,sans-serif">
      <div>
        <div style="font-size:11px;letter-spacing:2px;color:#8b6a4a;text-transform:uppercase;margin-bottom:4px">Booking Reference</div>
        <div style="font-size:17px;color:#3b2a1a;letter-spacing:1px">${bookingId}</div>
        <div style="font-size:11px;color:#8b6a4a;margin-top:4px">${bookingDate}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:11px;letter-spacing:2px;color:#8b6a4a;text-transform:uppercase;margin-bottom:4px">Status</div>
        <div style="color:${statusColor};font-size:13px;font-style:italic;text-transform:capitalize">${status || "pending"}</div>
      </div>
    </div>

    <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8b6a4a;font-family:Arial,sans-serif;margin-bottom:12px;padding-bottom:8px;border-bottom:0.5px solid #d4c4a0">Your Details</div>
    <div style="background:#f9f5ee;border:0.5px solid #d4c4a0;border-radius:8px;padding:14px 16px;margin-bottom:24px;font-family:Arial,sans-serif;font-size:13px">
      <div style="display:flex;padding:4px 0"><span style="color:#8b6a4a;width:90px;flex-shrink:0">Name</span><span style="color:#3b2a1a;font-weight:bold">${name}</span></div>
      <div style="display:flex;padding:4px 0"><span style="color:#8b6a4a;width:90px;flex-shrink:0">Email</span><span style="color:#3b2a1a">${email}</span></div>
      ${phone ? `<div style="display:flex;padding:4px 0"><span style="color:#8b6a4a;width:90px;flex-shrink:0">Phone</span><span style="color:#3b2a1a">${phone}</span></div>` : ""}
      ${note ? `<div style="display:flex;padding:4px 0"><span style="color:#8b6a4a;width:90px;flex-shrink:0">Note</span><span style="color:#6b5040;font-style:italic">${note}</span></div>` : ""}
    </div>

    <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8b6a4a;font-family:Arial,sans-serif;margin-bottom:12px;padding-bottom:8px;border-bottom:0.5px solid #d4c4a0">Event Schedule</div>
    <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;margin-bottom:24px">
      <thead>
        <tr style="background:#3b2a1a">
          <th style="color:#e8c97a;font-weight:normal;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:10px 12px;text-align:left">Day</th>
          <th style="color:#e8c97a;font-weight:normal;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:10px 12px;text-align:left">Date</th>
          <th style="color:#e8c97a;font-weight:normal;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:10px 12px;text-align:left">Location</th>
          <th style="color:#e8c97a;font-weight:normal;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:10px 12px;text-align:left">Services</th>
        </tr>
      </thead>
      <tbody>${eventRowsWithServices}</tbody>
    </table>

    ${addonRows ? `
    <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8b6a4a;font-family:Arial,sans-serif;margin-bottom:12px;padding-bottom:8px;border-bottom:0.5px solid #d4c4a0">Add-ons Included</div>
    <div style="background:#f9f5ee;border:0.5px solid #d4c4a0;border-radius:8px;padding:14px 16px;margin-bottom:24px">${addonRows}</div>` : ""}

    <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8b6a4a;font-family:Arial,sans-serif;margin-bottom:12px;padding-bottom:8px;border-bottom:0.5px solid #d4c4a0">Payment Summary</div>
    <div style="background:#3b2a1a;border-radius:10px;padding:20px;margin-bottom:24px;font-family:Arial,sans-serif">
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:0.5px solid #5a3e28;font-size:13px">
        <span style="color:#b89a6a">Event Services (${events.length} day${events.length > 1 ? "s" : ""})</span>
        <span style="color:#fffdf8">₹${fmtAmt(estimate)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:12px 0 0;border-top:0.5px solid #c4a265;margin-top:6px">
        <span style="color:#e8c97a;font-size:12px;letter-spacing:2px;text-transform:uppercase">Total Estimate</span>
        <span style="color:#e8c97a;font-size:22px">₹${fmtAmt(estimate)}</span>
      </div>
    </div>

    <div style="background:#f5ede0;border-radius:8px;padding:14px 16px;margin-bottom:20px;font-family:Arial,sans-serif;font-size:13px;color:#6b5040;line-height:1.7">
      &#9432;&nbsp; Our team will contact you within 24 hours to confirm photographer assignments and finalize the schedule. For any queries, reach us at <strong style="color:#8b5e2e">${process.env.EMAIL_USER}</strong>.
    </div>

    <hr style="border:none;border-top:0.5px solid #d4c4a0;margin:4px 0 20px">
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#9a7a60;text-align:center;font-style:italic">With warmth &amp; gratitude — the TK Moments Capture family</p>
  </div>

  <div style="background:#3b2a1a;padding:20px 32px;text-align:center">
    <div style="color:#e8c97a;font-size:13px;letter-spacing:2px;font-family:Arial,sans-serif;margin-bottom:6px">TK Moments Capture</div>
    <div style="color:#7a6050;font-size:11px;font-family:Arial,sans-serif;letter-spacing:1px">Ahmedabad, Gujarat &nbsp;|&nbsp; ${process.env.EMAIL_USER}</div>
  </div>

</div></div></body></html>`
    });


    // ══════════════════════════════════════
    //  OWNER / ADMIN MAIL
    // ══════════════════════════════════════
    await transporter.sendMail({
      from: `TK Booking System <${process.env.BREVO_USER}>`,
      to: process.env.OWNER_EMAIL || process.env.BREVO_USER,
      subject: `🚨 New Booking — ${bookingId} | ${name} | ₹${fmtAmt(estimate)}`,
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif">
<div style="max-width:620px;margin:0 auto;padding:24px 16px">
<div style="background:#fffdf8;border-radius:12px;overflow:hidden;border:0.5px solid #d4c4a0">

  <div style="background:#3b2a1a;padding:20px 28px;display:flex;align-items:center;justify-content:space-between">
    <div style="color:#e8c97a;font-size:15px;letter-spacing:1px;font-family:Georgia,serif">TK Moments Capture</div>
    <div style="background:#c4a265;color:#3b2a1a;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:5px 14px;border-radius:20px;font-weight:bold">&#9888; New Booking</div>
  </div>

  <div style="padding:26px 28px">

    <div style="font-size:20px;color:#3b2a1a;margin-bottom:4px;font-family:Georgia,serif">New Booking Received</div>
    <div style="font-size:13px;color:#8b6a4a;margin-bottom:22px">Submitted on ${bookingDate}</div>

    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8b6a4a;margin-bottom:10px;padding-bottom:8px;border-bottom:0.5px solid #d4c4a0">Customer Details</div>
    <div style="background:#f5ede0;border-radius:8px;padding:14px 16px;margin-bottom:20px">
      <table style="width:100%;font-size:13px;border-collapse:collapse">
        <tr><td style="color:#8b6a4a;padding:5px 0;width:110px;vertical-align:top">Name</td><td style="color:#3b2a1a;font-weight:bold;padding:5px 0">${name}</td></tr>
        <tr><td style="color:#8b6a4a;padding:5px 0;vertical-align:top">Email</td><td style="padding:5px 0"><a href="mailto:${email}" style="color:#8b5e2e;text-decoration:none">${email}</a></td></tr>
        ${phone ? `<tr><td style="color:#8b6a4a;padding:5px 0;vertical-align:top">Phone</td><td style="padding:5px 0"><a href="tel:${phone}" style="color:#8b5e2e;text-decoration:none">${phone}</a></td></tr>` : ""}
        <tr><td style="color:#8b6a4a;padding:5px 0;vertical-align:top">Booking ID</td><td style="color:#8b5e2e;font-weight:bold;padding:5px 0">${bookingId}</td></tr>
        <tr><td style="color:#8b6a4a;padding:5px 0;vertical-align:top">Status</td><td style="color:${statusColor};font-style:italic;padding:5px 0;text-transform:capitalize">${status || "pending"}</td></tr>
        <tr><td style="color:#8b6a4a;padding:5px 0;vertical-align:top">Total Events</td><td style="color:#3b2a1a;padding:5px 0">${events.length} day${events.length > 1 ? "s" : ""}</td></tr>
        ${note ? `<tr><td style="color:#8b6a4a;padding:5px 0;vertical-align:top">Note</td><td style="color:#6b5040;font-style:italic;padding:5px 0">${note}</td></tr>` : ""}
      </table>
    </div>

    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8b6a4a;margin-bottom:10px;padding-bottom:8px;border-bottom:0.5px solid #d4c4a0">Event Schedule</div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
      <thead>
        <tr style="background:#3b2a1a">
          <th style="color:#e8c97a;font-weight:normal;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:9px 12px;text-align:left">Day</th>
          <th style="color:#e8c97a;font-weight:normal;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:9px 12px;text-align:left">Date</th>
          <th style="color:#e8c97a;font-weight:normal;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:9px 12px;text-align:left">Location</th>
          <th style="color:#e8c97a;font-weight:normal;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:9px 12px;text-align:left">Services</th>
        </tr>
      </thead>
      <tbody>${eventRowsWithServices}</tbody>
    </table>

    ${addonRows ? `
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8b6a4a;margin-bottom:10px;padding-bottom:8px;border-bottom:0.5px solid #d4c4a0">Add-ons</div>
    <div style="background:#f9f5ee;border:0.5px solid #d4c4a0;border-radius:8px;padding:14px 16px;margin-bottom:20px">${addonRows}</div>` : ""}

    <div style="background:#3b2a1a;border-radius:8px;padding:16px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <span style="color:#e8c97a;font-size:12px;letter-spacing:2px;text-transform:uppercase">Total Estimate</span>
      <span style="color:#e8c97a;font-size:20px;font-family:Georgia,serif">₹${fmtAmt(estimate)}</span>
    </div>

    <div style="background:#fff3e0;border:0.5px solid #d4b88a;border-left:3px solid #c4a265;border-radius:0 8px 8px 0;padding:12px 16px;font-size:13px;color:#6b4c2e">
      &#9658;&nbsp; Please assign photographer(s) as soon as possible and confirm availability for all event dates.
    </div>

  </div>

  <div style="background:#3b2a1a;padding:16px 28px;text-align:center">
    <div style="color:#7a6050;font-size:11px;letter-spacing:1px">TK Moments Capture — Admin Notification</div>
  </div>

</div></div></body></html>`
    });

  } catch (error) {
    console.log("Mail Error:", error.message);
  }
}

module.exports = { sendBookingMail };
