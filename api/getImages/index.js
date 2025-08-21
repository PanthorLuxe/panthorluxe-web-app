const fs = require('fs');
const path = require('path');

module.exports = async function (context, req) {
  const folderName = req.query.folder;

  if (!folderName || !/^[a-zA-Z0-9_-]+$/.test(folderName)) {
    context.res = {
      status: 400,
      body: { error: "Nombre de carpeta inválido." }
    };
    return;
  }

  try {
    const imagesDirectory = path.join(process.env.HOME, 'site', 'wwwroot', 'img', folderName);

    // Verificamos si el directorio existe antes de intentar leerlo
    if (!fs.existsSync(imagesDirectory)) {
        context.res = {
            status: 404,
            body: { error: `La carpeta '${folderName}' no fue encontrada en el servidor.` }
        };
        return;
    }

    const files = fs.readdirSync(imagesDirectory);

    const imageFiles = files
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .map(file => `/img/${folderName}/${file}`);

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: imageFiles
    };

  } catch (error) {
    // CAMBIO PARA DEPURACIÓN: Devolvemos el error detallado
    context.log.error(`Error crítico al procesar la carpeta ${folderName}:`, error);
    context.res = {
      status: 500,
      body: { 
        error: "Ocurrió un error interno en el servidor.",
        debug_info: {
          message: error.message,
          stack: error.stack
        }
      }
    };
  }
};