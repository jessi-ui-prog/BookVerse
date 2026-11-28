import { autorizarUsuario } from "./firebase-autorizacion.js";

import { supabase } from "./supabase-config.js";
import { auth } from "./firebase-config.js";

const BUCKET = "libros";
const MAX_SIZE = 50 * 1024 * 1024;

export async function subirArchivoLibro(archivo) {

    const usuario = auth.currentUser;

    if (!usuario) {
        throw new Error("Debes iniciar sesión.");
    }

    if (!archivo || archivo.size === 0) {
        throw new Error("Selecciona un archivo válido.");
    }

    const extension = archivo.name
        .split(".")
        .pop()
        .toLowerCase();

    const tiposPermitidos = {
        pdf: "application/pdf",
        epub: "application/epub+zip"
    };

    if (!tiposPermitidos[extension]) {
        throw new Error(
            "Solo se permiten archivos PDF y EPUB."
        );
    }

    if (archivo.size > MAX_SIZE) {
        throw new Error(
            "El archivo supera el límite de 50 MB."
        );
    }

    await autorizarUsuario(usuario);
    if (auth.currentUser?.uid !== usuario.uid) throw new Error("La sesión cambió.");
    const token = await usuario.getIdTokenResult();

    if (token.claims.role !== "authenticated") {
        throw new Error(
            "Tu cuenta aún no tiene permiso para subir archivos."
        );
    }

    const nombre = `${crypto.randomUUID()}.${extension}`;

    const ruta = `${usuario.uid}/${nombre}`;

    const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(ruta, archivo, {
            contentType: tiposPermitidos[extension],
            cacheControl: "3600",
            upsert: false
        });

    if (error) {
        throw new Error(error.message);
    }

    const { data: enlace } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(data.path);

    return {
        archivoURL: enlace.publicUrl,
        archivoRuta: data.path,
        archivoNombre: archivo.name,
        archivoTipo: extension,
        archivoTamano: archivo.size
    };
}

export async function eliminarArchivoLibro(ruta) {

    const usuario = auth.currentUser;

    if (!usuario) {
        throw new Error("Debes iniciar sesión.");
    }

    if (!ruta || !ruta.startsWith(`${usuario.uid}/`)) {
        throw new Error(
            "No tienes permiso para eliminar este archivo."
        );
    }

    const { error } = await supabase.storage
        .from(BUCKET)
        .remove([ruta]);

    if (error) {
        throw new Error(error.message);
    }

    return true;
}

// Solo reconoce rutas generadas por BookVerse en su propio bucket.
export function rutaArchivoBookVerse(enlace, uid) {
    try {
        const url = new URL(enlace);
        const prefijo = '/storage/v1/object/public/libros/';
        if (url.origin !== 'https://zhrjpdahqesjlzkovggq.supabase.co' || !url.pathname.startsWith(prefijo)) return null;
        const ruta = decodeURIComponent(url.pathname.slice(prefijo.length));
        const partes = ruta.split('/');
        if (partes.length !== 2 || partes[0] !== uid || !/^[a-f0-9-]{36}\.(pdf|epub)$/i.test(partes[1])) return null;
        return ruta;
    } catch { return null; }
}
