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
    // Construimos la ruta a la carpeta de imágenes de la web
    const imagesDirectory = path.join(process.env.HOME, 'site', 'wwwroot', 'img', folderName);

    // Leemos los nombres de los archivos de la carpeta
    const files = fs.readdirSync(imagesDirectory);

    // Filtramos para quedarnos solo con las imágenes y creamos la URL completa
    const imageFiles = files
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .map(file => `/img/${folderName}/${file}`);

    // Devolvemos la lista de imágenes en formato JSON
    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: imageFiles
    };

  } catch (error) {
    // Si la carpeta no existe o hay otro error, lo notificamos
    context.log.error(`Error al leer la carpeta ${folderName}:`, error);
    context.res = {
      status: 404,
      body: { error: `La carpeta de imágenes '${folderName}' no fue encontrada.` }
    };
  }
};