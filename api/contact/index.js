const sgMail = require('@sendgrid/mail');

module.exports = async function (context, req) {
  context.res = { status: 500, body: { ok: false, error: "Error procesando la solicitud." } };

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  sgMail.setApiKey(SENDGRID_API_KEY);

  const data = req.body;

  if (!data.nombre || !data.email || !data.acepto) {
    context.res = { status: 400, body: { ok: false, error: "Faltan campos requeridos." } };
    return;
  }

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

  const msg = {
    to: 'info@panthorluxe.com',
    from: 'info@panthorluxe.com', // Usamos el email verificado
    subject: `Nuevo Contacto Web de ${data.nombre}`,
    text: emailBody,
  };

  try {
    await sgMail.send(msg);
    context.res = { status: 200, body: { ok: true } };
  } catch (error) {
    context.log.error('Error al enviar con SendGrid:', error);
    if (error.response) { context.log.error(error.response.body); }
    context.res = { status: 500, body: { ok: false, error: "No se pudo enviar el email." } };
  }
};