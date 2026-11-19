import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Storage } from 'megajs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function subirArchivosAMega() {

    const archivoConfig = path.join(__dirname, 'upload_files.json');

    const config = JSON.parse(
        fs.readFileSync(archivoConfig, 'utf8')
    );

    const { name_folder, path_files } = config;

    if (!Array.isArray(path_files) || path_files.length === 0) {
        throw new Error('No hay archivos o carpetas para subir.');
    }

    const storage = await new Storage({
        email: 'matoscosmexazure@gmail.com',
        password: 'venecachera122'
    }).ready;

    try {

        let destino = storage;

        // Crear carpeta contenedora opcional
        if (name_folder?.trim()) {

            destino = await storage.mkdir(name_folder.trim());

            console.log(`Carpeta contenedora: ${name_folder}`);

        }

        // Función recursiva para subir archivos y carpetas
        async function subirElemento(rutaLocal, destinoMega) {

            if (!fs.existsSync(rutaLocal)) {
                console.log(`No encontrado: ${rutaLocal}`);
                return;
            }

            const stats = fs.statSync(rutaLocal);
            const nombre = path.basename(rutaLocal);

            if (stats.isDirectory()) {

                console.log(`Creando carpeta: ${nombre}`);

                const nuevaCarpeta = await destinoMega.mkdir(nombre);

                const elementos = fs.readdirSync(rutaLocal);

                for (const elemento of elementos) {

                    const rutaCompleta = path.join(rutaLocal, elemento);

                    await subirElemento(rutaCompleta, nuevaCarpeta);
                }

            } else if (stats.isFile()) {

                console.log(`Subiendo archivo: ${nombre}`);

                const stream = fs.createReadStream(rutaLocal);

                const archivo = await destinoMega.upload({
                    name: nombre,
                    size: stats.size
                }, stream).complete;

                console.log(`Subido correctamente: ${archivo.name}`);
            }
        }

        // Procesar las rutas del JSON
        for (const ruta of path_files) {

            await subirElemento(ruta, destino);
        }

        console.log('\nTodos los elementos fueron procesados.');

    } finally {

        await storage.close();
    }
}

subirArchivosAMega().catch(error => {
    console.error('Error:', error.message);
});
