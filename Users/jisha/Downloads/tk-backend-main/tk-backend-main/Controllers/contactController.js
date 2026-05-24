const nodemailer = require("nodemailer");

async function sendContactMail(req, res) {
  try {
    const { name, email, phone, message } = req.body;

    // ✅ transporter (Brevo SMTP)
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 2525, // best for Render
      secure: false,
      auth: {
        user: process.env.BREVO_USER, // 👈 smtp login
        pass: process.env.BREVO_PASS, // 👈 smtp key
      },
    //   tls: {
    //     rejectUnauthorized: false,
    //   },
       family: 4, 
  debug: true,
      tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2",
  },
    });

    // 🧪 check SMTP
    await transporter.verify();

    // ══════════════════════════════════════
    // 📩 ADMIN MAIL (main important)
    // ══════════════════════════════════════
    await transporter.sendMail({
      from: `Contact Form <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // 👈 owner mail
      subject: `📩 New Contact Message from ${name}`,
      html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>New Contact Request</title>
</head>
<body style="margin:0;padding:0;background:#f0e6d2;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0e6d2;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:4px;overflow:hidden;box-shadow:0 2px 24px rgba(100,60,10,0.12);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#3e220a 0%,#6b3a1f 60%,#8b6535 100%);padding:40px;text-align:center;">
           
            <h1 style="color:#fdf0d5;font-size:20px;font-weight:400;margin:0 0 4px;letter-spacing:3px;text-transform:uppercase;">TK Moments Capture</h1>
            <p style="color:rgba(245,222,179,0.65);font-size:11px;letter-spacing:3px;margin:0;text-transform:uppercase;">New Contact Request</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:#fdf8f0;padding:36px 40px;">
            <p style="font-size:20px;color:#3e220a;margin:0 0 4px;font-weight:400;">New Message Received</p>
            <p style="font-size:11px;color:#a07848;letter-spacing:2px;text-transform:uppercase;margin:0 0 28px;">Contact Form Submission</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="width:110px;background:#f0e6d2;padding:12px 16px;font-size:11px;color:#8b6535;letter-spacing:1.5px;text-transform:uppercase;vertical-align:middle;">Name</td>
                <td style="background:#fdf8f0;border-left:2px solid #c8a97a;padding:12px 16px;font-size:14px;color:#3e220a;">${name}</td>
              </tr>
              <tr><td colspan="2" style="height:1px;background:#e8d9c0;"></td></tr>
              <tr>
                <td style="width:110px;background:#f0e6d2;padding:12px 16px;font-size:11px;color:#8b6535;letter-spacing:1.5px;text-transform:uppercase;vertical-align:middle;">Email</td>
                <td style="background:#fdf8f0;border-left:2px solid #c8a97a;padding:12px 16px;font-size:14px;color:#3e220a;">${email}</td>
              </tr>
              ${phone ? `
              <tr><td colspan="2" style="height:1px;background:#e8d9c0;"></td></tr>
              <tr>
                <td style="width:110px;background:#f0e6d2;padding:12px 16px;font-size:11px;color:#8b6535;letter-spacing:1.5px;text-transform:uppercase;vertical-align:middle;">Phone</td>
                <td style="background:#fdf8f0;border-left:2px solid #c8a97a;padding:12px 16px;font-size:14px;color:#3e220a;">${phone}</td>
              </tr>` : ''}
            </table>

            <div style="background:#f7f0e3;border-left:3px solid #8b6535;padding:16px 20px;margin-top:24px;border-radius:0 4px 4px 0;">
              <p style="font-size:11px;color:#a07848;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">Message</p>
              <p style="font-size:14px;color:#3e220a;line-height:1.8;margin:0;">${message}</p>
            </div>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#3e220a;padding:24px 40px;text-align:center;">
            <p style="color:#c8a97a;font-size:13px;letter-spacing:2px;margin:0 0 6px;text-transform:uppercase;">TK Moments Capture</p>
            <p style="color:rgba(245,222,179,0.5);font-size:12px;margin:0;letter-spacing:1px;">This message was submitted via the contact form on your website.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`,
    });

    // ══════════════════════════════════════
    // 📧 USER AUTO REPLY
    // ══════════════════════════════════════
    await transporter.sendMail({
      from: `TK Moments Capture <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "We received your message ✅",
     html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>We received your message</title>
</head>
<body style="margin:0;padding:0;background:#f0e6d2;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0e6d2;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:4px;overflow:hidden;box-shadow:0 2px 24px rgba(100,60,10,0.12);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#5a3010 0%,#8b6535 60%,#c8a97a 100%);padding:40px;text-align:center;">
            
            <h1 style="color:#fdf0d5;font-size:20px;font-weight:400;margin:0 0 4px;letter-spacing:3px;text-transform:uppercase;">TK Moments Capture</h1>
            <p style="color:rgba(245,222,179,0.65);font-size:11px;letter-spacing:3px;margin:0;text-transform:uppercase;">Message Confirmed</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:#fdf8f0;padding:36px 40px;">
            <p style="font-size:20px;color:#3e220a;margin:0 0 4px;font-weight:400;">Hello, ${name}</p>
            <p style="font-size:11px;color:#a07848;letter-spacing:2px;text-transform:uppercase;margin:0 0 24px;">Thank you for reaching out</p>
            <p style="font-size:14px;color:#5a3010;line-height:1.8;margin:0 0 24px;">We have received your message and truly appreciate you getting in touch. Our team will review your inquiry and respond within <strong style="color:#8b6535;">24–48 hours</strong>.</p>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td colspan="2" style="height:1px;background:linear-gradient(to right,transparent,#c8a97a,transparent);padding:0;"></td></tr>
              <tr>
                <td style="padding:10px 0;font-size:13px;color:#a07848;border-bottom:1px dashed #d9c9a8;">Submitted by</td>
                <td style="padding:10px 0;font-size:13px;color:#3e220a;text-align:right;border-bottom:1px dashed #d9c9a8;">${name}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;font-size:13px;color:#a07848;border-bottom:1px dashed #d9c9a8;">Reply to</td>
                <td style="padding:10px 0;font-size:13px;color:#3e220a;text-align:right;border-bottom:1px dashed #d9c9a8;">${email}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;font-size:13px;color:#a07848;">Status</td>
                <td style="padding:10px 0;font-size:13px;color:#6b8c42;text-align:right;">✓ Received</td>
              </tr>
            </table>

            <div style="background:#f0e6d2;border-radius:4px;padding:16px 20px;margin-top:20px;">
              <p style="font-size:11px;color:#a07848;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">Your Message</p>
              <p style="font-size:14px;color:#3e220a;line-height:1.8;margin:0;font-style:italic;">${message}</p>
            </div>

            <p style="margin-top:28px;font-size:13px;color:#8b6535;line-height:1.9;">
              Warm regards,<br/>
              <span style="color:#3e220a;font-size:15px;letter-spacing:1px;display:block;margin-top:2px;">TK Moments Capture</span>
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#3e220a;padding:24px 40px;text-align:center;">
            <p style="color:#c8a97a;font-size:13px;letter-spacing:2px;margin:0 0 6px;text-transform:uppercase;">TK Moments Capture</p>
            <p style="color:rgba(245,222,179,0.5);font-size:12px;margin:0;letter-spacing:1px;">Please do not reply to this email. We will contact you directly.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`,
    });

    res.json({ success: true, message: "Message sent successfully ✅" });

  } catch (error) {
    console.log("Contact Mail Error:", error.message);
    res.json({ success: false, message: error.message });
  }
}

module.exports = { sendContactMail };
