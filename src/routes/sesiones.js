import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import { iniciarSesion, finalizarSesion, cancelarSesion } from "../controllers/sesionesController.js";

const router = Router();

router.post("/", auth, iniciarSesion);
router.post("/:id/fin", auth, finalizarSesion);
router.post("/:id/cancelar", auth, cancelarSesion);

export default router;
