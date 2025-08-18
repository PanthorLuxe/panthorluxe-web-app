// Importamos la librería de SendGrid
const sgMail = require('@sendgrid/mail');

module.exports = async function (context, req) {
  // Mensaje por defecto por si algo falla
  context.res = {
    status: 500,
    body: { ok: false, error: "Error procesando la solicitud." }
  };

  // Obtenemos la API Key de SendGrid de la configuración de Azure (más seguro)
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  sgMail.setApiKey(SENDGRID_API_KEY);

  // Obtenemos los datos del formulario que nos envía el frontend
  const data = req.body;

  // Validación simple en el servidor
  if (!data.nombre || !data.email || !data.acepto) {
    context.res = {
      status: 400,
      body: { ok: false, error: "Faltan campos requeridos." }
    };
    return;
  }

  // Creamos el contenido del email que nos llegará a nosotros
  const emailBody = `
    Nueva consulta desde la web PanthorLuxe.com:
    -----------------------------------------
    Nombre: ${data.nombre}
    Email: ${data.email}
    Teléfono: ${data.telefono || 'No proporcionado'}
    Ciudad: ${data.ciudad || 'No proporcionada'}
    -----------------------------------------
    Mensaje:
    ${data.mensaje}
    -----------------------------------------
  `;

  // Creamos el objeto del mensaje para SendGrid
  const msg = {
    to: 'info@panthorluxe.com', // El email donde recibirás las notificaciones
    from: 'web@panthorluxe.com', // Un email que crearemos en SendGrid para que no sea SPAM
    subject: `Nuevo Contacto Web de ${data.nombre}`,
    text: emailBody,
  };

  try {
    // Intentamos enviar el email
    await sgMail.send(msg);

    // Si todo va bien, enviamos una respuesta de éxito al frontend
    context.res = {
      status: 200,
      body: { ok: true }
    };
  } catch (error) {
    // Si SendGrid falla, lo registramos y enviamos un error
    context.log.error('Error al enviar con SendGrid:', error);
    if (error.response) {
      context.log.error(error.response.body);
    }
    context.res = {
      status: 500,
      body: { ok: false, error: "No se pudo enviar el email." }
    };
  }
};