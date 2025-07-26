const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Esta línea permite servir archivos estáticos como redirect.html
app.use(express.static('public'));

// ✅ Ruta raíz
app.get('/', (req, res) => {
  res.send('🚀 Servidor de BusPoint activo y funcionando');
});

app.post('/send-reset-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email es obligatorio' });
  }

  const token = require('crypto').randomUUID();

  // Enlace que abrirá una página web que redirige a tu app
  const resetLink = `https://buspoint-backend.onrender.com/redirect.html?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"BusPoint" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Recuperación de contraseña - BusPoint',
    html: `
      <h2>Hola 👋</h2>
      <p>Has solicitado restablecer tu contraseña.</p>
      <p>Haz clic en el siguiente enlace para continuar:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p><i>Este enlace caduca en 15 minutos.</i></p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Correo enviado correctamente' });
  } } catch (error) {
  console.error("❌ Error enviando correo:");
  console.error("Mensaje completo:", error.message);
  console.error("Stack:", error.stack);
  if (error.response) {
    console.error("SMTP Response:", error.response);
  }
  res.status(500).json({ error: 'No se pudo enviar el correo' });


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
