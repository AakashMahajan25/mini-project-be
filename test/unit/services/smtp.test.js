import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtpout.secureserver.net",
  port: 587,
  secure: false,
  auth: {
    user: "noreply@frruit.co",
    pass: "Frruit#000", // current mailbox password
  },
});

transporter.sendMail({
  from: "noreply@frruit.co",
  to: "mahajanaakash108@gmail.com",
  subject: "SMTP Test",
  text: "Hello from Titan SMTP!",
}, (err, info) => {
  if (err) console.error("SendMail Error:", err);
  else console.log("Email sent:", info.response);
});
