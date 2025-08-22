const { app } = require('@azure/functions');
const fs = require('fs');
const path = require('path');

app.http('getImages', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const folderName = request.query.get('folder');

        if (!folderName || !/^[a-zA-Z0-9_-]+$/.test(folderName)) {
            return { status: 400, jsonBody: { error: "Nombre de carpeta inválido." } };
        }

        const wwwRoot = path.resolve(__dirname, '../../../'); 
        const imagesDirectory = path.join(wwwRoot, 'img', folderName);

        try {
            if (!fs.existsSync(imagesDirectory)) {
                return {
                    status: 404,
                    jsonBody: { 
                        error: `La carpeta '${folderName}' no fue encontrada.`,
                        debug_info: { searched_path: imagesDirectory }
                    }
                };
            }

            const files = fs.readdirSync(imagesDirectory);
            const imageFiles = files
                .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
                .sort((a, b) => {
                    const numA = parseInt(a.match(/^\d+/), 10) || 0;
                    const numB = parseInt(b.match(/^\d+/), 10) || 0;
                    return numA - numB;
                })
                .map(file => `/img/${folderName}/${file}`);

            return { status: 200, jsonBody: imageFiles };

        } catch (error) {
            context.log.error(`Error crítico al procesar la carpeta ${folderName}:`, error);
            return { status: 500, jsonBody: { error: "Ocurrió un error interno.", debug_info: { message: error.message } } };
        }
    }
});