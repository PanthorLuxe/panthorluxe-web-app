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

  // Ruta base donde se despliega el contenido de la web
  // Azure establece la variable de entorno 'AZURE_WWW_ROOT' para esto.
  // Si no existe, usamos un valor por defecto.
  const wwwRoot = process.env.AZURE_WWW_ROOT || path.join(process.env.HOME, 'site', 'wwwroot');
  
  try {
    const imagesDirectory = path.join(wwwRoot, 'img', folderName);

    if (!fs.existsSync(imagesDirectory)) {
        // CAMBIO PARA DEPURACIÓN: Devolvemos la ruta que hemos intentado buscar
        context.res = {
            status: 404,
            body: { 
                error: `La carpeta '${folderName}' no fue encontrada en el servidor.`,
                debug_info: {
                    searched_path: imagesDirectory
                }
            }
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
    context.log.error(`Error crítico al procesar la carpeta ${folderName}:`, error);
    context.res = {
      status: 500,
      body: { 
        error: "Ocurrió un error interno en el servidor.",
        debug_info: {
          message: error.message,
          stack: error.stack,
          searched_path: path.join(wwwRoot, 'img', folderName)
        }
      }
    };
  }
};