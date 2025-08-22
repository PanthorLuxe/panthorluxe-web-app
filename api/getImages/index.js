const fs = require('fs');
const path = require('path');

module.exports = async function (context, req) {
  const folderName = req.query.folder;

  // 1. Validación de seguridad
  if (!folderName || !/^[a-zA-Z0-9_-]+$/.test(folderName)) {
    return context.res = { status: 400, body: { error: "Nombre de carpeta inválido." } };
  }

  // 2. Construcción de la ruta correcta al contenido estático
  const wwwRoot = path.resolve(__dirname, '../../'); 
  const imagesDirectory = path.join(wwwRoot, 'img', folderName);
  
  try {
    // 3. Comprobación de existencia
    if (!fs.existsSync(imagesDirectory)) {
      return context.res = {
        status: 404,
        body: { 
          error: `La carpeta '${folderName}' no fue encontrada.`,
          debug_info: { searched_path: imagesDirectory }
        }
      };
    }

    // 4. Lectura, filtrado y ordenación
    const files = fs.readdirSync(imagesDirectory);
    const imageFiles = files
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .sort((a, b) => {
        const numA = parseInt(a.match(/^\d+/), 10) || 0;
        const numB = parseInt(b.match(/^\d+/), 10) || 0;
        return numA - numB;
      })
      .map(file => `/img/${folderName}/${file}`); // Ruta pública correcta

    // 5. Respuesta exitosa
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