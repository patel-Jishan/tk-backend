const nodemailer = require("nodemailer");

async function sendBookingMail({ name, email, bookingId, events, estimate }) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // 📅 Event table
        const eventHtml = events.map(e => `
            <tr>
                <td>${e.day}</td>
                <td>${e.date}</td>
                <td>${e.location}</td>
            </tr>
        `).join("");

        // ================= USER MAIL =================
        await transporter.sendMail({
            from: `TK MOMENTS CAPTURE <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "🎉 Booking Confirmed",
            html: `
            <div style="font-family:Arial;padding:20px;background:#f4f4f4">
                <div style="max-width:600px;margin:auto;background:#fff;padding:20px;border-radius:10px">
                    
                    <h2>Hello ${name} 👋</h2>
                    <p>Your booking is confirmed ✅</p>

                    <h3>📌 Booking ID: ${bookingId}</h3>

                    <table border="1" cellpadding="10" style="width:100%;border-collapse:collapse">
                        <tr style="background:#333;color:#fff">
                            <th>Day</th>
                            <th>Date</th>
                            <th>Location</th>
                        </tr>
                        ${eventHtml}
                    </table>

                    <h3>💰 Total: ₹${estimate}</h3>

                    <p>We will contact you soon 🙌</p>

                    <hr/>
                    <p style="text-align:center;color:#888">
                        📸 TK MOMENTS CAPTURE
                    </p>
                </div>
            </div>
            `
        });

        // ================= ADMIN MAIL =================
        await transporter.sendMail({
            from: `${name} <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: "🚨 New Booking Alert",
            html: `
            <div style="font-family:Arial;padding:20px;background:#fff3f3">
                <div style="max-width:600px;margin:auto;background:#fff;padding:20px;border-radius:10px">
                    
                    <h2 style="color:red">🚨 New Booking Received</h2>

                    <p><b>Name:</b> ${name}</p>
                    <p><b>Email:</b> ${email}</p>
                    <p><b>Booking ID:</b> ${bookingId}</p>

                    <h3>Event Details</h3>

                    <table border="1" cellpadding="10" style="width:100%;border-collapse:collapse">
                        <tr style="background:black;color:white">
                            <th>Day</th>
                            <th>Date</th>
                            <th>Location</th>
                        </tr>
                        ${eventHtml}
                    </table>

                    <h3>💰 Total: ₹${estimate}</h3>

                    <p style="color:#555">
                        👉 Assign photographer ASAP
                    </p>

                </div>
            </div>
            `
        });

    } catch (error) {
        console.log("Mail Error:", error.message);
    }
}

module.exports = { sendBookingMail };