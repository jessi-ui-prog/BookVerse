

import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

export async function cargarLibrosFirebase() {
  try {
    const consulta = query(
      collection(db, "libros"),
      where("publico", "==", true)
    );

    const resultado = await getDocs(consulta);

    const libros = resultado.docs.map(doc => ({
      id: "firebase-" + doc.id,
      firebaseId: doc.id,
      titulo: doc.data().titulo || "Sin título",
      autor: doc.data().autor || "Autor desconocido",
      genero: doc.data().genero || "General",
      descripcion: doc.data().descripcion || "",
      archivoURL: doc.data().archivoURL || "",
      origen: "firebase"
    }));

    // Mantener el catálogo de Firebase separado
    // de los libros almacenados localmente.
    window.bookverseLibrosFirebase = libros;

    // Avisar al panel para que actualice sus tarjetas.
    window.dispatchEvent(
      new CustomEvent("bookverse:catalogo-actualizado")
    );

    console.log(
      "Catálogo Firebase integrado:",
      libros.length,
      "libros"
    );

  } catch (error) {
    console.error("Error cargando catálogo Firebase:", error);
  }
}

await cargarLibrosFirebase();
