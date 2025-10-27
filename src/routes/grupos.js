import { Router } from "express";
import auth from "../middlewares/auth.js";
import {
  crearGrupo,
  unirseGrupo,
  misGrupos,
  detalleGrupo,
  grupoPreferido,
  setGrupoActivo,
  leaderboardGrupo, // ⬅️ nuevo
} from "../controllers/gruposController.js";

const router = Router();

router.post("/", auth, crearGrupo);
router.post("/unirse", auth, unirseGrupo);
router.get("/mis", auth, misGrupos);
router.get("/preferido/mio", auth, grupoPreferido);
router.post("/activo", auth, setGrupoActivo);

// detalle y leaderboard
router.get("/:id", auth, detalleGrupo);
router.get("/:id/leaderboard", auth, leaderboardGrupo); // ⬅️ nuevo

export default router;
