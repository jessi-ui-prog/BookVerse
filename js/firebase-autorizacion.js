import { auth } from "./firebase-config.js";
import { SUPABASE_URL, SUPABASE_KEY } from "./supabase-config.js";

const pendientes = new Map();
export async function autorizarUsuario(usuario = auth.currentUser) {
  if (!usuario || auth.currentUser?.uid !== usuario.uid) throw new Error("Inicia sesión.");
  if (pendientes.has(usuario.uid)) return pendientes.get(usuario.uid);
  const tarea = (async () => {
    let token = await usuario.getIdTokenResult();
    if (token.claims.role === "authenticated") return;
    const respuesta = await fetch(`${SUPABASE_URL}/functions/v1/autorizar-usuario`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token.token}`, apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(20000)
    });
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok || datos.autorizado !== true) throw new Error(datos.error || `Autorización fallida (${respuesta.status})`);
    token = await usuario.getIdTokenResult(true);
    if (auth.currentUser?.uid !== usuario.uid || token.claims.role !== "authenticated") throw new Error("Permiso aún no disponible. Intenta nuevamente.");
  })();
  pendientes.set(usuario.uid, tarea);
  try { await tarea; } finally { pendientes.delete(usuario.uid); }
}
