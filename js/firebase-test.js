
import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

async function probarFirebase() {
  try {
    console.log("Conectando BookVerse con Firebase...");

    const librosPublicos = query(
      collection(db, "libros"),
      where("publico", "==", true)
    );

    const resultado = await getDocs(librosPublicos);

    console.log("Libros encontrados:", resultado.size);

    resultado.forEach((documento) => {
      console.log("ID:", documento.id);
      console.log("Datos:", documento.data());
    });

    console.log("¡Conexión completada!");
  } catch (error) {
    console.error("Error al consultar Firebase:", error);
  }
}

probarFirebase();
