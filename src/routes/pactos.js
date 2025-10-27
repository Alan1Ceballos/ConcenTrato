import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import { crearPacto, verPacto, actualizarPacto } from "../controllers/pactosController.js";

const router = Router();

router.post("/", auth, crearPacto);
router.get("/:grupoId", auth, verPacto);
router.patch("/:id", auth, actualizarPacto);

export default router;
