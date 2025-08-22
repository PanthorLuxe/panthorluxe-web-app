const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');

const connectionString = process.env.STORAGE_CONNECTION_STRING;
const containerName = 'images';

app.http('getImages', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        if (!connectionString) {
            context.log.error("La cadena de conexión del almacenamiento no está configurada.");
            return { status: 500, jsonBody: { error: "La configuración del servidor no está completa." }};
        }

        const folderName = request.query.get('folder');
        if (!folderName) {
            return { status: 400, jsonBody: { error: "Falta el parámetro 'folder' en la solicitud." } };
        }

        try {
            const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
            const containerClient = blobServiceClient.getContainerClient(containerName);

            const imageFiles = [];
            
            for await (const blob of containerClient.listBlobsByHierarchy("/", { prefix: `${folderName}/` })) {
                if (blob.kind === 'blob' && /\.(jpg|jpeg|png|webp)$/i.test(blob.name)) {
                    
                    // --- INICIO DE LA CORRECCIÓN ---
                    // Esta es la forma correcta de obtener la URL pública de cada blob
                    const blobClient = containerClient.getBlobClient(blob.name);
                    imageFiles.push(blobClient.url);
                    // --- FIN DE LA CORRECCIÓN ---

                }
            }
            
            imageFiles.sort((a, b) => {
                const numA = parseInt(a.match(/(\d+)\.\w+$/)?.[1] || 0, 10);
                const numB = parseInt(b.match(/(\d+)\.\w+$/)?.[1] || 0, 10);
                return numA - numB;
            });

            return { status: 200, jsonBody: imageFiles };

        } catch (error) {
            context.log.error(`Error al listar imágenes para la carpeta ${folderName}:`, error);
            return { status: 500, jsonBody: { error: "Ocurrió un error interno al obtener las imágenes." } };
        }
    }
});