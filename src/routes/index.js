import { Router } from "express";
import authRoutes from "./auth.js";
import gruposRoutes from "./grupos.js";
import pactosRoutes from "./pactos.js";
import sesionesRoutes from "./sesiones.js";
import violacionesRoutes from "./violaciones.js";
import focusRoutes from "./focus.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/grupos", gruposRoutes);
router.use("/pactos", pactosRoutes);
router.use("/sesiones", sesionesRoutes);
router.use("/violaciones", violacionesRoutes);
router.use("/focus", focusRoutes);

export default router;
