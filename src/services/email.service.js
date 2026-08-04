const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.GOOGLE_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
});

//verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.log("error connecting to email server ", error);
  } else {
    console.log("server is ready to take our messages");
  }
});

const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"BanKLED" <${process.env.GOOGLE_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("message sent :%s", info.messageId);
    console.log("preview URL :%s ", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("error sending email ", error);
  }
};
async function sendRegistrationEmail(userEmail, name) {
  const subject = "Welcome to BanKLED";
  const text = `Hello ${name},\n\nThank you for registering with BanKLED. We are excited to have you on board!\n\nBest regards,\nThe BanKLED Team`;
  const html = `<p>Hello ${name},</p><p>Thank you for registering with <strong>BanKLED</strong>. We are excited to have you on board!</p><p>Best regards,<br>The BanKLED Team</p>`;
  await sendEmail(userEmail, subject, text, html);
}
async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  const subject = "Transaction Successfull ";
  const text = `Hello ${name},\n\n Your transaction of $ ${amount} to  ${toAccount}`;
  const html = `<p> Hello ${name},</p><p> Your transaction of $ ${amount} is completed `;
  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(
  userEmail,
  name,
  fromAccount,
  toAccount,
) {
  const subject = "Transaction Failed";

  const text = `Hello ${name},\n\nUnfortunately, your transaction from account ${fromAccount} to account ${toAccount} could not be completed.\n\nNo amount has been deducted from your account. Please try again later or contact support if the issue persists.`;

  const html = `<p>Hello ${name},</p>
                  <p>Unfortunately, your transaction from account <strong>${fromAccount}</strong> to account <strong>${toAccount}</strong> could not be completed.</p>
                  <p><strong>No amount has been deducted from your account.</strong></p>
                  <p>Please try again later or contact support if the issue persists.</p>`;

  await sendEmail(userEmail, subject, text, html);
}

async function sendPasswordResetOTP(userEmail, otp) {
  const subject = "BanKLED Password Reset OTP";

  const text = `Your password reset OTP is ${otp}. It will expire in 10 minutes.`;

  const html = `
        <p>Your password reset OTP is:</p>
        <h2>${otp}</h2>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
    `;

  await sendEmail(userEmail, subject, text, html);
}

module.exports = {
  sendEmail,
  sendRegistrationEmail,
  sendTransactionEmail,
  sendTransactionFailureEmail,
  sendPasswordResetOTP,
};
