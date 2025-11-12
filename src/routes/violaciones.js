import { Router } from "express";
import multer from "multer";
import { auth } from "../middlewares/auth.js";
import { crearViolacion, historialUsuario } from "../controllers/violacionesController.js";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Registrar violación
router.post("/", auth, upload.single("imagen"), crearViolacion);

// Obtener historial de violaciones de un usuario
router.get("/usuario/:id", auth, historialUsuario);

export default router;
