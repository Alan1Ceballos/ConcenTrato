import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import { startFocus, endFocus, joinFocus, getFocus } from "../controllers/focusController.js";

const router = Router();

router.get("/:groupId", auth, getFocus);
router.post("/:groupId/start", auth, startFocus);
router.post("/:groupId/join", auth, joinFocus);
router.post("/:groupId/end", auth, endFocus);

export default router;
