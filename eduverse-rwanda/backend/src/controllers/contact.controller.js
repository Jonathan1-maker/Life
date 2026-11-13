const { sendEmail } = require('../utils/email.utils');

const sendContactMessage = async (req, res) => {
  const { firstName, lastName, email, schoolName, message } = req.body;

  if (!firstName || !email || !message) {
    return res.status(400).json({ success: false, message: 'First name, email and message are required.' });
  }

  try {
    await sendEmail({
      to: process.env.SMTP_USER,
      subject: `New Contact Message from ${firstName} ${lastName || ''}`.trim(),
      html: `
        <h2>New message from EduVerse Contact Form</h2>
        <table cellpadding="8" style="border-collapse:collapse;width:100%">
          <tr><td><strong>Name</strong></td><td>${firstName} ${lastName || ''}</td></tr>
          <tr><td><strong>Email</strong></td><td>${email}</td></tr>
          <tr><td><strong>School</strong></td><td>${schoolName || '—'}</td></tr>
          <tr><td><strong>Message</strong></td><td style="white-space:pre-wrap">${message}</td></tr>
        </table>
      `,
    });

    res.json({ success: true, message: 'Message sent successfully.' });
  } catch (err) {
    console.error('Contact email error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to send message. Please try again.' });
  }
};

module.exports = { sendContactMessage };
