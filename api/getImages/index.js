const fs = require('fs');
const path = require('path');

module.exports = async function (context, req) {
  const folderName = req.query.folder;

  // Medida de seguridad CRÍTICA:
  // Solo permitimos nombres de carpeta simples para evitar que alguien pueda acceder a otros directorios.
  if (!folderName || !/^[a-zA-Z0-9_-]+$/.test(folderName)) {
    context.res = {
      status: 400,
      body: { error: "Nombre de carpeta inválido." }
    };
    return;
  }

  try {
    // NUEVA RUTA: Busca las imágenes DENTRO de la propia carpeta de la API.
    // __dirname es la ubicación actual del archivo (api/getImages)
    const imagesDirectory = path.join(__dirname, '..', 'img', folderName);

    if (!fs.existsSync(imagesDirectory)) {
        context.res = {
            status: 404,
            body: { 
                error: `La carpeta '${folderName}' no fue encontrada.`,
                debug_info: {
                    searched_path: imagesDirectory
                }
            }
        };
        return;
    }

    const files = fs.readdirSync(imagesDirectory);

    // La URL pública ahora debe incluir /api
    const imageFiles = files
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .sort((a, b) => { // AÑADIDO: Ordenación numérica
        const numA = parseInt(a.match(/^\d+/), 10);
        const numB = parseInt(b.match(/^\d+/), 10);
        return numA - numB;
      })
      .map(file => `/img/${folderName}/${file}`); // CORREGIDO: Ruta pública con /api

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: imageFiles
    };

  } catch (error) {
    context.log.error(`Error crítico al procesar la carpeta ${folderName}:`, error);
    context.res = {
      status: 500,
      body: { 
        error: "Ocurrió un error interno en el servidor.",
        debug_info: { message: error.message, stack: error.stack }
      }
    };
  }
};