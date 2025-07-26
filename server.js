const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Inicializar Firebase Admin con variables de entorno (sin serviceAccountKey.json)
admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FB_TYPE,
    project_id: process.env.FB_PROJECT_ID,
    private_key_id: process.env.FB_PRIVATE_KEY_ID,
    private_key: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FB_CLIENT_EMAIL,
    client_id: process.env.FB_CLIENT_ID,
    auth_uri: process.env.FB_AUTH_URI,
    token_uri: process.env.FB_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FB_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FB_CLIENT_CERT_URL
  }),
});

const db = admin.firestore();

// ✅ Servir archivos estáticos (como redirect.html)
app.use(express.static('public'));

// ✅ Ruta raíz
app.get('/', (req, res) => {
  res.send('🚀 Servidor de BusPoint activo y funcionando');
});

// ✅ Ruta para enviar correo de recuperación
app.post('/send-reset-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email es obligatorio' });
  }

  const token = require('crypto').randomUUID();
  const createdAt = Date.now();

  try {
    await db.collection('resetTokens').doc(token).set({
      email,
      createdAt,
      used: false
    });
  } catch (error) {
    console.error('❌ Error guardando token en Firestore:', error);
    return res.status(500).json({ error: 'Error al guardar token' });
  }

  const resetLink = `https://buspoint-backend.onrender.com/redirect.html?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
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
  } catch (error) {
    console.error("❌ Error enviando correo:");
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);
    if (error.response) {
      console.error("SMTP Response:", error.response);
    }
    res.status(500).json({ error: 'No se pudo enviar el correo' });
  }
});

// ✅ Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});
