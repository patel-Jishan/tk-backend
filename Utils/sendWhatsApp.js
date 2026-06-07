const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendWhatsApp(to, message) {
  try {
    const response = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      body: message,
      to: `whatsapp:+91${to}`
    });

    console.log("WhatsApp Sent:", response.sid);
    return response;

  } catch (error) {
    console.log(
      "WhatsApp Error:",
      error.message
    );
  }
}

module.exports = sendWhatsApp;