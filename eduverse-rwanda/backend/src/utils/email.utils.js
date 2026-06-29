const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"EduVerse Rwanda" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

const welcomeEmail = (name, email, password) => ({
  subject: 'Welcome to EduVerse Rwanda',
  html: `<h2>Welcome, ${name}!</h2>
    <p>Your account has been created on EduVerse Rwanda.</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Password:</strong> ${password}</p>
    <p>Please login and change your password immediately.</p>`,
});

module.exports = { sendEmail, welcomeEmail };
