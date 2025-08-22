const { app } = require('@azure/functions');
const sgMail = require('@sendgrid/mail');

app.http('contact', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
        if (!SENDGRID_API_KEY) {
            return { status: 500, jsonBody: { ok: false, error: "La configuración del servidor de correo no está completa." } };
        }
        sgMail.setApiKey(SENDGRID_API_KEY);

        const data = await request.json();

        if (!data || !data.nombre || !data.email || !data.acepto) {
            return { status: 400, jsonBody: { ok: false, error: "Faltan campos requeridos." } };
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
            return { status: 200, jsonBody: { ok: true } };
        } catch (error) {
            context.log.error('Error al enviar con SendGrid:', error);
            if (error.response) { context.log.error(error.response.body); }
            return { status: 500, jsonBody: { ok: false, error: "No se pudo enviar el email." } };
        }
    }
});