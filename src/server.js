import http from "http";
import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./realtime/socket.js";
import { fixGroupFocusIndexes } from "./startup/fixIndexes.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Inicializar Socket.IO sobre el mismo servidor HTTP
initSocket(server);

// Conectar a Mongo y levantar server
(async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`✅ ConcenTrato backend iniciado en puerto ${PORT}`);
    });
  } catch (err) {
    console.error("❌ No se pudo iniciar el servidor:", err);
    process.exit(1);
  }
  await fixGroupFocusIndexes();
})();
