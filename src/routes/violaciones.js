import { Router } from "express";
import multer from "multer";
import path from "path";
import { auth } from "../middlewares/auth.js";
import { crearViolacion } from "../controllers/violacionesController.js";

const router = Router();

// Configuración de multer para guardar las imágenes en /uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Ruta para registrar violaciones (imagen opcional)
router.post("/", auth, upload.single("imagen"), crearViolacion);

export default router;
