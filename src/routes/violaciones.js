import { Router } from "express";
import multer from "multer";
import { auth } from "../middlewares/auth.js";
import { crearViolacion } from "../controllers/violacionesController.js";

const router = Router();

// Configurar multer para almacenar la imagen directamente en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Ruta para registrar violaciones (imagen opcional, se guarda en BD)
router.post("/", auth, upload.single("imagen"), crearViolacion);

export default router;
