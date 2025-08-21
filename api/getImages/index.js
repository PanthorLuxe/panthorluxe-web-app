const fs = require('fs');
const path = require('path');

module.exports = async function (context, req) {
  const folderName = req.query.folder;

  if (!folderName || !/^[a-zA-Z0-9_-]+$/.test(folderName)) {
    return context.res = { status: 400, body: { error: "Nombre de carpeta inválido." } };
  }

  try {
    // RUTA CORRECTA Y DEFINITIVA para acceder al contenido estático desde una función
    const wwwRoot = process.env.HOME ? path.join(process.env.HOME, 'site', 'wwwroot') : path.resolve(__dirname, '../../');
    const imagesDirectory = path.join(wwwRoot, 'img', folderName);

    if (!fs.existsSync(imagesDirectory)) {
        return context.res = {
            status: 404,
            body: { 
                error: `La carpeta '${folderName}' no fue encontrada en el servidor.`,
                debug_info: {
                    searched_path: imagesDirectory
                }
            }
        };
    }

    const files = fs.readdirSync(imagesDirectory);

    const imageFiles = files
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .sort((a, b) => {
        const numA = parseInt(a.match(/^\d+/), 10);
        const numB = parseInt(b.match(/^\d+/), 10);
        return numA - numB;
      })
      .map(file => `/img/${folderName}/${file}`); // La ruta pública es sin /api

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: imageFiles
    };

  } catch (error) {
    context.log.error(`Error crítico al procesar la carpeta ${folderName}:`, error);
    context.res = { status: 500, body: { error: "Ocurrió un error interno.", debug_info: { message: error.message } } };
  }
};