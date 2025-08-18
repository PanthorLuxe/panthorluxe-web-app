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
    from: 'info@panthorluxe.com',
    subject: `Nuevo Contacto Web de ${data.nombre}`,
    text: emailBody,
  };

  try {
    await sgMail.send(msg);
    context.res = { status: 200, body: { ok: true } };
  } catch (error) {
    // CAMBIO PARA DEPURACIÓN: Devolvemos el error detallado
    context.log.error('Error al enviar con SendGrid:', error);
    context.res = {
      status: 500,
      body: {
        ok: false,
        error: "Hubo un error en el servidor.", // Mensaje genérico para el usuario
        debug_info: { // Información detallada para nosotros
          message: error.message,
          response_body: error.response ? error.response.body : "No response body"
        }
      }
    };
  }
};