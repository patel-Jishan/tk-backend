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
    // const price = svc?.priceType === "per_unit"
    //   ? (svc.price || 0) * (a.quantity || 1)
    //   : (svc?.price || 0);
    return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:0.5px solid #ead9c0;font-size:13px">
          <span style="color:#8b5e2e;font-weight:bold"> : ${name}${qty}</span>
        </div>`;
  }).join("");
}


// ═════════════════════════════════════════════════════════════════════════════
async function sendBookingMail({
  customer,
  bookingId,
  events,
  addons,
  subtotal,
  profitPercentage,
  profitAmount,
  estimate,
  status,
  createdAt
}) {
  try {
    const { name, email, phone, note } = customer;
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 2525,
      secure: false,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
      },
      family: 4,
      debug: true,
      tls: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2",
      },
    });

    transporter.verify((error, success) => {
      if (error) {
        console.log("SMTP Error:", error);
      } else {
        console.log("SMTP Server Ready");
      }
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
      from: `TK MOMENTS CAPTURE <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ Booking Confirmed — ${bookingId} | TK Moments Capture`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Responsive Email</title>
</head>

<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,'Times New Roman',serif;">

<div style="width:100%;background:#f5f0e8;padding:20px 10px;box-sizing:border-box;">

  <div style="max-width:620px;margin:auto;background:#fffdf8;border-radius:12px;overflow:hidden;border:1px solid #d4c4a0;">

    <!-- Header -->
    <div style="background:#3b2a1a;padding:40px 20px 25px;text-align:center;">
      <div style="color:#e8c97a;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-family:Arial,sans-serif;">
        Photography Studio
      </div>

      <div style="color:#fffdf8;font-size:clamp(22px,5vw,30px);margin-top:8px;">
        TK Moments Capture
      </div>

      <div style="color:#b89a6a;font-size:12px;letter-spacing:2px;margin-top:8px;font-style:italic;font-family:Arial,sans-serif;">
        Preserving your precious memories
      </div>
    </div>

    <!-- Booking Confirm -->
    <div style="background:#c4a265;padding:14px 18px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">

     

      <div style="color:#3b2a1a;font-size:13px;letter-spacing:1px;font-style:italic;font-family:Arial,sans-serif;flex:1;min-width:220px;">
        Booking Confirmed — We're excited to capture your moments!
      </div>
    </div>

    <!-- Main -->
    <div style="padding:25px 20px;box-sizing:border-box;">

      <!-- Greeting -->
      <div style="font-size:clamp(20px,5vw,26px);color:#3b2a1a;margin-bottom:10px;">
        Dear <span style="color:#8b5e2e;">${name}</span>,
      </div>

      <p style="color:#6b5040;font-size:14px;line-height:1.8;font-family:Arial,sans-serif;margin-bottom:24px;">
        Thank you for choosing TK Moments Capture. Your booking has been successfully received.
        Below is a complete summary of your events, services, and payment details.
        We will be in touch within 24 hours to finalize arrangements.
      </p>

      <!-- Booking Reference -->
      <div style="background:#f5ede0;border:1px solid #d4b88a;border-left:4px solid #8b5e2e;border-radius:8px;padding:16px;margin-bottom:24px;font-family:Arial,sans-serif;">

        <div style="display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap;">

          <div>
            <div style="font-size:11px;letter-spacing:2px;color:#8b6a4a;text-transform:uppercase;margin-bottom:5px;">
              Booking Reference
            </div>

            <div style="font-size:18px;color:#3b2a1a;">
              ${bookingId}
            </div>

            <div style="font-size:11px;color:#8b6a4a;margin-top:5px;">
              ${bookingDate}
            </div>
          </div>

          <div style="text-align:left;">
            <div style="font-size:11px;letter-spacing:2px;color:#8b6a4a;text-transform:uppercase;margin-bottom:5px;">
              Status
            </div>

            <div style="color:${statusColor};font-size:14px;font-style:italic;text-transform:capitalize;">
              ${status || "pending"}
            </div>
          </div>

        </div>
      </div>

      <!-- User Details -->
      <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8b6a4a;font-family:Arial,sans-serif;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #d4c4a0;">
        Your Details
      </div>

      <div style="background:#f9f5ee;border:1px solid #d4c4a0;border-radius:8px;padding:16px;margin-bottom:24px;font-family:Arial,sans-serif;font-size:14px;">

        <div style="padding:6px 0;">
          <span style="color:#8b6a4a;font-weight:bold;">Name:</span>
          <span style="color:#3b2a1a;"> ${name}</span>
        </div>

        <div style="padding:6px 0;word-break:break-word;">
          <span style="color:#8b6a4a;font-weight:bold;">Email:</span>
          <span style="color:#3b2a1a;"> ${email}</span>
        </div>

        ${phone ? `
        <div style="padding:6px 0;">
          <span style="color:#8b6a4a;font-weight:bold;">Phone:</span>
          <span style="color:#3b2a1a;"> ${phone}</span>
        </div>` : ""}

        ${note ? `
        <div style="padding:6px 0;">
          <span style="color:#8b6a4a;font-weight:bold;">Note:</span>
          <span style="color:#6b5040;font-style:italic;"> ${note}</span>
        </div>` : ""}

      </div>

      <!-- Event Schedule -->
      <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8b6a4a;font-family:Arial,sans-serif;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #d4c4a0;">
        Event Schedule
      </div>

     ${events.map((event, index) => `

<!-- EVENT CARD -->
<table width="100%" cellpadding="0" cellspacing="0" border="0"
style="
margin-bottom:22px;
border:2px solid #3b2a1a;
border-radius:22px;
overflow:hidden;
background:#f9f5ee;
border-collapse:separate;
">

<!-- TOP -->
<tr>
<td style="
padding:16px 20px;
border-bottom:2px solid #3b2a1a;
">

<table width="100%">
<tr>

<td align="left"
style="
font-size:22px;
font-family:Georgia,serif;
color:#3b2a1a;
font-weight:bold;
">
Day-${index + 1}
</td>

<td align="center"
style="
font-size:22px;
font-family:Georgia,serif;
color:#3b2a1a;
font-weight:bold;
width:20px;
">

</td>

<td align="right"
style="
font-size:22px;
font-family:Georgia,serif;
color:#3b2a1a;
font-weight:bold;
">
Date: ${event.date}
</td>

</tr>
</table>

</td>
</tr>

<!-- LOCATION -->
<tr>
<td style="
padding:18px 20px;
border-bottom:2px solid #3b2a1a;
font-size:18px;
line-height:28px;
color:#3b2a1a;
font-family:Arial,sans-serif;
">

<strong>Location :</strong>
${event.location}

</td>
</tr>

<!-- SERVICES -->
<tr>
<td style="
padding:18px 20px;
font-size:18px;
line-height:28px;
color:#3b2a1a;
font-family:Arial,sans-serif;
word-break:break-word;
">

<strong>Services :</strong>

<div style="padding-top:10px;">

${event.services.map(service => `

<span style="
display:inline-block;
background:#ede2cf;
border:1px solid #d4c4a0;
border-radius:20px;
padding:7px 14px;
margin:4px;
font-size:13px;
line-height:20px;
color:#3b2a1a;
font-family:Arial,sans-serif;
">
${service.serviceId?.name || "Service"}
</span>

`).join("")}

</div>

</td>
</tr>

</table>

`).join("")}

      <!-- Addons -->
      ${addonRows ? `
      <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8b6a4a;font-family:Arial,sans-serif;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #d4c4a0;">
        Add-ons Included : 
      </div>

      <div style="background:#f9f5ee;border:1px solid #d4c4a0;border-radius:8px;padding:16px;margin-bottom:24px;">
        ${addonRows}
      </div>
      ` : ""}

      <!-- Payment -->
      <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8b6a4a;font-family:Arial,sans-serif;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #d4c4a0;">
        Payment Summary
      </div>

      <div style="background:#3b2a1a;border-radius:10px;padding:20px;margin-bottom:24px;font-family:Arial,sans-serif;">

        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding-bottom:12px;font-size:14px;">

        </div>

        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding-top:15px;">

          <span style="color:#e8c97a;font-size:12px;letter-spacing:2px;text-transform:uppercase;">
            Total Estimate
          </span>

          <span style="color:#e8c97a;font-size:24px;">
            : ₹${fmtAmt(estimate)}
          </span>

        </div>

      </div>

      <!-- Info -->
      <div style="background:#f5ede0;border-radius:8px;padding:16px;margin-bottom:20px;font-family:Arial,sans-serif;font-size:13px;color:#6b5040;line-height:1.8;">
        ℹ️ Our team will contact you within 24 hours to confirm photographer assignments and finalize the schedule.
        For any queries, reach us at
        <strong style="color:#8b5e2e;">${process.env.EMAIL_USER}</strong>.
      </div>

      <hr style="border:none;border-top:1px solid #d4c4a0;margin:20px 0;">

      <p style="font-family:Arial,sans-serif;font-size:12px;color:#9a7a60;text-align:center;font-style:italic;line-height:1.7;">
        With warmth & gratitude — the TK Moments Capture family
      </p>

    </div>

    <!-- Terms & Conditions -->
<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8b6a4a;font-family:Arial,sans-serif;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #d4c4a0;">
  Terms &amp; Conditions
</div>

<div style="background:#f5ede0;border:1px solid #d4b88a;border-radius:10px;padding:20px;margin-bottom:24px;font-family:Arial,sans-serif;font-size:13px;color:#3b2a1a;line-height:1.9;">
  <ul style="margin:0;padding-left:20px;list-style:disc;">
    <li style="margin-bottom:10px;">In case any electronic item gets defected, we are not responsible for such damage (such as camera, memory card, hard disk, etc). If any issue or problem occurs, we don't take any responsibility.</li>
    <li style="margin-bottom:10px;">For the confirmation of your order, the amount of <strong>₹10,000</strong> has to be paid in advance. In case you cancel the order, the advance payment will <strong>not be refundable</strong>.</li>
    <li style="margin-bottom:10px;">The payment of <strong>70%</strong> will be made as soon as the wedding is over and you will get the receipt for the same. The remaining payment will need to be submitted after the handover of your data.</li>
    <li style="margin-bottom:10px;">You have to come to the office for photo selection after the marriage. The sooner the better. Same for the data when it's prepared &amp; ready.</li>
    <li style="margin-bottom:10px;">You can make changes in album &amp; photo for only <strong>one time</strong>. If you ask to change it more than once, charges will be levied.</li>
    <li style="margin-bottom:10px;">It is up to you to give time to the photographer for the couple's portrait photography.</li>
    <li style="margin-bottom:10px;">Within <strong>40km</strong> from Ankleshwar–Bharuch, no transportation charge. Beyond 40km, transportation charges will be applied.</li>
    <li style="margin-bottom:0;">Disrespect, abuse, or misbehavior toward any member of TK Moments Capture will <strong>not be tolerated</strong>.</li>
  </ul>
</div>

    <!-- Footer -->
    <div style="background:#3b2a1a;padding:24px 20px;text-align:center;">

      <div style="color:#e8c97a;font-size:14px;letter-spacing:2px;font-family:Arial,sans-serif;margin-bottom:8px;">
        TK Moments Capture
      </div>

      <div style="color:#7a6050;font-size:11px;font-family:Arial,sans-serif;letter-spacing:1px;line-height:1.7;">
        Bharuch, Gujarat | ${process.env.EMAIL_USER}
      </div>

    </div>

  </div>

</div>

</body>
</html>`
    });


    // ══════════════════════════════════════
    //  OWNER / ADMIN MAIL
    // ══════════════════════════════════════
    await transporter.sendMail({
      from: `TK Booking System <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER || process.env.BREVO_USER,
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
    ${events.map((event, index) => `

<!-- EVENT CARD -->
<table width="100%" cellpadding="0" cellspacing="0" border="0"
style="
margin-bottom:22px;
border:2px solid #3b2a1a;
border-radius:22px;
overflow:hidden;
background:#f9f5ee;
border-collapse:separate;
">

<!-- TOP -->
<tr>
<td style="
padding:16px 20px;
border-bottom:2px solid #3b2a1a;
">

<table width="100%">
<tr>

<td align="left"
style="
font-size:22px;
font-family:Georgia,serif;
color:#3b2a1a;
font-weight:bold;
">
Day-${index + 1}
</td>

<td align="center"
style="
font-size:22px;
font-family:Georgia,serif;
color:#3b2a1a;
font-weight:bold;
width:20px;
">

</td>

<td align="right"
style="
font-size:22px;
font-family:Georgia,serif;
color:#3b2a1a;
font-weight:bold;
">
Date: ${event.date}
</td>

</tr>
</table>

</td>
</tr>

<!-- LOCATION -->
<tr>
<td style="
padding:18px 20px;
border-bottom:2px solid #3b2a1a;
font-size:18px;
line-height:28px;
color:#3b2a1a;
font-family:Arial,sans-serif;
">

<strong>Location :</strong>
${event.location}

</td>
</tr>

<!-- SERVICES -->
<tr>
<td style="
padding:18px 20px;
font-size:18px;
line-height:28px;
color:#3b2a1a;
font-family:Arial,sans-serif;
word-break:break-word;
">

<strong>Services :</strong>

<div style="padding-top:10px;">

${event.services.map(service => `

<span style="
display:inline-block;
background:#ede2cf;
border:1px solid #d4c4a0;
border-radius:20px;
padding:7px 14px;
margin:4px;
font-size:13px;
line-height:20px;
color:#3b2a1a;
font-family:Arial,sans-serif;
">
${service.serviceId?.name || "Service"}
</span>

`).join("")}

</div>

</td>
</tr>

</table>

`).join("")}

    ${addonRows ? `
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8b6a4a;margin-bottom:10px;padding-bottom:8px;border-bottom:0.5px solid #d4c4a0">Add-ons</div>
    <div style="background:#f9f5ee;border:0.5px solid #d4c4a0;border-radius:8px;padding:14px 16px;margin-bottom:20px">${addonRows} </div>` : ""}

    <div style="background:#3b2a1a;border-radius:8px;padding:16px 18px;margin-bottom:20px">

  <div style="display:flex;justify-content:space-between;margin-bottom:8px">
    <span style="color:#d4c4a0">Subtotal</span>
    <span style="color:white">₹${fmtAmt(subtotal)}</span>
  </div>

  <div style="display:flex;justify-content:space-between;margin-bottom:8px">
    <span style="color:#d4c4a0">Profit (${profitPercentage}%)</span>
    <span style="color:white">₹${fmtAmt(profitAmount)}</span>
  </div>

  <hr style="border:none;border-top:1px solid #5a3e28;margin:10px 0">

  <div style="display:flex;justify-content:space-between">
    <span style="color:#e8c97a;font-weight:bold">
      Final Estimate
    </span>
    <span style="color:#e8c97a;font-size:20px">
      ₹${fmtAmt(estimate)}
    </span>
  </div>

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

// (Photographer Mail)

async function sendPhotographerAssignMail({ photographer, booking, events, services }) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 2525,
      secure: false,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
      },
       family: 4,
      debug: true,
      tls: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2",
      },
    });

    const eventCards = events.map((event, index) => `
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="margin-bottom:20px;border:2px solid #3b2a1a;border-radius:20px;background:#f9f5ee;">

        <tr>
          <td style="padding:15px;font-size:18px;font-weight:bold;color:#3b2a1a;">
            Day ${event.day} | ${event.date}
          </td>
        </tr>

        <tr>
          <td style="padding:15px;border-top:1px solid #d4c4a0;">
            <strong>📍 Location:</strong> ${event.location}
          </td>
        </tr>

        <tr>
          <td style="padding:15px;border-top:1px solid #d4c4a0;">
            <strong>📸 Services:</strong><br/>
            ${(event.services || []).map(s => `
              <span style="display:inline-block;background:#ede2cf;border:1px solid #d4c4a0;border-radius:20px;padding:6px 12px;margin:3px;font-size:12px;">
                ${s.serviceId?.name || "Service"}
              </span>
            `).join("")}
          </td>
        </tr>

      </table>
    `).join("");

    await transporter.sendMail({
      from: `TK Moments <${process.env.EMAIL_USER}>`,
      to: photographer.email,
      subject: `📸 New Assignment - ${booking.bookingId}`,

      html: `
      <div style="max-width:600px;margin:auto;font-family:Arial;background:#f5f0e8;padding:20px;">
        
        <div style="background:#3b2a1a;padding:20px;text-align:center;color:#fff;">
          <h2>New Assignment</h2>
        </div>

        <div style="background:#fff;padding:20px;border-radius:10px;">

          <h3>Hello ${photographer.name},</h3>

          <p>You have been assigned to a new booking.</p>


 <h4>👤 Client Details</h4>
<p>
  <strong>Name:</strong> ${booking.customer.name}<br/>
</p>

<h4>👨‍💼 Assigned Photographer</h4>

<div
  style="
    display:inline-block;
    background:#dff5e1;
    border:1px solid #9dd7a3;
    border-radius:20px;
    padding:8px 15px;
    margin-bottom:15px;
    font-size:13px;
    font-weight:bold;
  ">
  ${photographer.name}
</div>

<h4>📅 Event Details</h4>
${eventCards}

<h4>🎯 Assigned Services</h4>

<div>
${services.map(service => `
  <span
    style="
      display:inline-block;
      background:#ede2cf;
      border:1px solid #d4c4a0;
      border-radius:20px;
      padding:6px 12px;
      margin:3px;
      font-size:12px;
    ">
    ${service}
  </span>
`).join("")}
</div>


          <div style="margin-top:20px;padding:10px;background:#f5ede0;border-radius:6px;">
            Please be available on assigned dates.
          </div>

        </div>

        <div style="text-align:center;margin-top:15px;font-size:12px;color:#777;">
          TK Moments Capture
        </div>

      </div>
      `
    });

  } catch (error) {
    console.log("Photographer Mail Error:", error.message);
  }
}

// sendPaymentMail to photographer 
async function sendPaymentMail({ photographer, payment, lastTransaction }) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 2525,
      secure: false,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
      },
       family: 4,
      debug: true,
      tls: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2",
      },
    });

    await transporter.sendMail({
      from: `TK Moments <${process.env.EMAIL_USER}>`,
      to: photographer.email,
      subject: `💰 Payment Update - ${payment.month}`,

      html: `
<div style="max-width:600px;margin:auto;font-family:Arial,sans-serif;background:#f3f4f6;padding:20px">

  <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="background:#111827;padding:18px;text-align:center;color:#fff;">
      <h2 style="margin:0;">Payment Update</h2>
      <p style="margin:5px 0 0;font-size:13px;color:#d1d5db">${payment.month}</p>
    </div>

    <!-- Body -->
    <div style="padding:20px">

      <p style="font-size:15px;color:#111827;">Hello ${photographer.name},</p>

      <!-- Transaction -->
      <div style="background:#f9fafb;border-left:4px solid #3b82f6;padding:12px;border-radius:6px;margin-top:15px">
        <strong style="color:#111827">Transaction</strong>
        <p style="margin:5px 0 0;font-size:14px;color:#4b5563">
          ₹${lastTransaction.amount} received<br/>
          ${new Date(lastTransaction.date).toLocaleString("en-IN")}
        </p>
      </div>

      <!-- Summary -->
      <div style="margin-top:20px">
        <strong style="color:#111827">Summary</strong>

        <div style="margin-top:10px;font-size:14px;color:#4b5563;line-height:1.7">
          <div>Total: ₹${payment.totalAmount}</div>
          <div>Paid: ₹${payment.advancePaid}</div>
          <div>Carry Forward: ₹${payment.carryForward}</div>
          <div>Remaining: ₹${payment.remainingAmount}</div>
          <div style="color:#2563eb;">Extra: ₹${payment.extraPaid}</div>
        </div>

        <div style="margin-top:10px">
          <span style="
            padding:6px 12px;
            background:${payment.status === "paid" ? "#dcfce7" : "#fef3c7"};
            color:${payment.status === "paid" ? "#166534" : "#92400e"};
            border-radius:20px;
            font-size:12px;
            font-weight:bold;
          ">
            ${payment.status.toUpperCase()}
          </span>
        </div>

      </div>

    </div>

  </div>

  <p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:15px">
    TK Moments Capture
  </p>

</div>
`
    });

  } catch (error) {
    console.log("Payment Mail Error:", error.message);
  }
}




async function sendWorkStatusMail({ customer, bookingId, workStatus }) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 2525,
      secure: false,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
      },
       family: 4,
      debug: true,
      tls: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2",
      },
    });

    let messageMap = {
      pending: "Your booking is received and will start soon.",
      editing: "Your photos are currently being edited.",
      edited: "Your photos editing is completed.",
      delivery_pending: "Your delivery is being prepared.",
      delivered: "Your final photos have been delivered."
    };

    await transporter.sendMail({
      from: `TK Moments <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: `📸 Work Update - ${bookingId}`,
      html: `
<div style="max-width:600px;margin:auto;font-family:Arial,sans-serif;background:#f3f4f6;padding:20px">

  <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="background:#7c3aed;padding:18px;text-align:center;color:#fff;">
      <h2 style="margin:0;">Work Update</h2>
      <p style="margin:5px 0 0;font-size:13px;color:#ddd6fe">${bookingId}</p>
    </div>

    <!-- Body -->
    <div style="padding:20px">

      <p style="font-size:15px;color:#111827;">Hello ${customer.name},</p>

      <p style="font-size:14px;color:#4b5563;margin-top:10px">
        ${messageMap[workStatus]}
      </p>

      <!-- Status Box -->
      <div style="
        margin-top:20px;
        padding:14px;
        background:#f9fafb;
        border-radius:8px;
        border-left:4px solid #7c3aed;
      ">
        <strong>Status:</strong> ${workStatus}
      </div>

    </div>

  </div>

  <p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:15px">
    Thank you for choosing TK Moments Capture
  </p>

</div>
`
    });

  } catch (error) {
    console.log("Work Status Mail Error:", error.message);
  }
}



async function sendPaymentMailToCustomer({ customer, booking, transaction }) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 2525,
      secure: false,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
      },
       family: 4,
      debug: true,
      tls: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2",
      },
    });

    await transporter.sendMail({
      from: `TK Moments <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: `💰 Payment Update - ${booking.bookingId}`,
html: `
<div style="max-width:600px;margin:auto;font-family:Arial,sans-serif;background:#f3f4f6;padding:20px">

  <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="background:#059669;padding:18px;text-align:center;color:#fff;">
      <h2 style="margin:0;">Payment Received</h2>
    </div>

    <!-- Body -->
    <div style="padding:20px">

      <p style="font-size:15px;color:#111827;">Hello ${customer.name},</p>

      <p style="font-size:14px;color:#4b5563">
        Your payment has been successfully received.
      </p>

      <!-- Transaction -->
      <div style="background:#ecfdf5;border-left:4px solid #10b981;padding:12px;border-radius:6px;margin-top:15px">
        <strong>Transaction</strong>
        <p style="margin-top:5px;font-size:14px;color:#065f46">
          ₹${transaction.amount} via ${transaction.paymentMethod}<br/>
          ${new Date(transaction.date).toLocaleString("en-IN")}
        </p>
      </div>

      <!-- Summary -->
      <div style="margin-top:20px">
        <strong>Summary</strong>

        <div style="margin-top:10px;font-size:14px;color:#4b5563;line-height:1.7">
          <div>Total: ₹${booking.payment.totalAmount}</div>
          <div>Paid: ₹${booking.payment.paidAmount}</div>
          <div>Remaining: ₹${booking.payment.remainingAmount}</div>
        </div>

        <div style="margin-top:10px">
          <span style="
            padding:6px 12px;
            background:${booking.payment.status === "completed" ? "#dcfce7" : "#fef3c7"};
            color:${booking.payment.status === "completed" ? "#166534" : "#92400e"};
            border-radius:20px;
            font-size:12px;
            font-weight:bold;
          ">
            ${booking.payment.status.toUpperCase()}
          </span>
        </div>

      </div>

    </div>

  </div>

  <p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:15px">
    TK Moments Capture
  </p>

</div>
`
    });

  } catch (error) {
    console.log("Client Payment Mail Error:", error.message);
  }
}


module.exports = {
  sendBookingMail,
  sendPhotographerAssignMail,
  sendPaymentMail,
  sendWorkStatusMail,
  sendPaymentMailToCustomer

};
