import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import { crearViolacion } from "../controllers/violacionesController.js";

const router = Router();

router.post("/", auth, crearViolacion);

export default router;
