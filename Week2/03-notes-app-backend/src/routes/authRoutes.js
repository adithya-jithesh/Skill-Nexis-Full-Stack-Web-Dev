import { Router } from "express";
import { getMe, login, register } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Open routes - you cannot have a token before you have an account.
router.post("/register", register);
router.post("/login", login);

// Protected: protect runs first and only calls getMe if the token is valid.
router.get("/me", protect, getMe);

export default router;
