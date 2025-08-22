const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');

// Lee la "llave maestra" que guardamos en las variables de entorno de Azure
const connectionString = process.env.STORAGE_CONNECTION_STRING;
const containerName = 'images'; // El nombre del contenedor que creamos

app.http('getImages', {
    methods: ['GET'], // Solo necesitamos el método GET para esta función
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // Comprobamos que la llave esté configurada en Azure
        if (!connectionString) {
            context.log.error("La cadena de conexión del almacenamiento no está configurada.");
            return { status: 500, jsonBody: { error: "La configuración del servidor no está completa." }};
        }

        // Obtenemos el nombre de la carpeta de la URL (ej: ...?folder=alquiler1)
        const folderName = request.query.get('folder');
        if (!folderName) {
            return { status: 400, jsonBody: { error: "Falta el parámetro 'folder' en la solicitud." } };
        }

        try {
            // Conectamos con nuestra cuenta de almacenamiento
            const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
            const containerClient = blobServiceClient.getContainerClient(containerName);

            const imageFiles = [];
            
            // Listamos todos los archivos que estén dentro de la carpeta virtual que nos han pedido
            for await (const blob of containerClient.listBlobsByHierarchy("/", { prefix: `${folderName}/` })) {
                if (blob.kind === 'blob' && /\.(jpg|jpeg|png|webp)$/i.test(blob.name)) {
                    imageFiles.push(blob.url);
                }
            }
            
            // Ordenamos las imágenes por su número (1.jpg, 2.jpg, 10.jpg, etc.)
            imageFiles.sort((a, b) => {
                const numA = parseInt(a.match(/(\d+)\.\w+$/)?.[1] || 0, 10);
                const numB = parseInt(b.match(/(\d+)\.\w+$/)?.[1] || 0, 10);
                return numA - numB;
            });

            // Devolvemos la lista de URLs de las imágenes encontradas
            return { status: 200, jsonBody: imageFiles };

        } catch (error) {
            context.log.error(`Error al listar imágenes para la carpeta ${folderName}:`, error);
            return { status: 500, jsonBody: { error: "Ocurrió un error interno al obtener las imágenes." } };
        }
    }
});