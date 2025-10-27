// Intenta eliminar el índice único viejo "grupo_1" en GroupFocus
// Llamalo una vez al iniciar la app (después de conectar a Mongo).
import GroupFocus from "../models/GroupFocus.js";

export async function fixGroupFocusIndexes() {
  try {
    const indexes = await GroupFocus.collection.indexes();
    const hasUniqueGrupo = indexes.find(ix => ix.name === "grupo_1" && ix.unique);
    if (hasUniqueGrupo) {
      await GroupFocus.collection.dropIndex("grupo_1");
      console.log("🧹 Drop index grupo_1 (unique) en GroupFocus");
    }
    // Asegura índices actuales del modelo (incluye {grupo:1, estado:1})
    await GroupFocus.syncIndexes();
    console.log("✅ Índices de GroupFocus sincronizados");
  } catch (e) {
    console.warn("⚠️ No se pudo ajustar índices de GroupFocus:", e.message);
  }
}
