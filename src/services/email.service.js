const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, text, html) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `"BanKLED" <${process.env.EMAIL_FROM}>`,
      to: [to],
      subject,
      text,
      html,
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log("Message sent:", data.id);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

async function sendRegistrationEmail(userEmail, name) {
  const subject = "Welcome to BanKLED";

  const text = `Hello ${name},

Thank you for registering with BanKLED. We are excited to have you on board!

Best regards,
The BanKLED Team`;

  const html = `
    <p>Hello ${name},</p>
    <p>Thank you for registering with <strong>BanKLED</strong>. We are excited to have you on board!</p>
    <p>Best regards,<br>The BanKLED Team</p>
  `;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  const subject = "Transaction Successful";

  const text = `Hello ${name},

Your transaction of $${amount} to ${toAccount} has been completed successfully.`;

  const html = `
    <p>Hello ${name},</p>
    <p>Your transaction of <strong>$${amount}</strong> to <strong>${toAccount}</strong> has been completed successfully.</p>
  `;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(
  userEmail,
  name,
  fromAccount,
  toAccount,
) {
  const subject = "Transaction Failed";

  const text = `Hello ${name},

Unfortunately, your transaction from account ${fromAccount} to account ${toAccount} could not be completed.

No amount has been deducted from your account. Please try again later or contact support if the issue persists.`;

  const html = `
    <p>Hello ${name},</p>
    <p>
      Unfortunately, your transaction from account
      <strong>${fromAccount}</strong> to account
      <strong>${toAccount}</strong> could not be completed.
    </p>
    <p>
      <strong>No amount has been deducted from your account.</strong>
    </p>
    <p>
      Please try again later or contact support if the issue persists.
    </p>
  `;

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
