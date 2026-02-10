import { Router } from "express";
import passport from "passport";
import { isAuth } from "../middleware/auth.js";
import {
	validateUser,
	validateMessage,
	validateUpgrade,
	handleValidationErrors,
} from "../middleware/validators.js";

import userController from "../controllers/userController.js";

const router = Router();

router.get("/", userController.getIndex);

// passport login route
router.post(
	"/login",
	passport.authenticate("local", {
		successRedirect: "/",
		failureRedirect: "/login",
	}),
);

// passport logout route
router.post("/logout", (req, res, next) => {
	req.logout((err) => {
		if (err) return next(err);
		res.redirect("/");
	});
});

router.post(
	"/register",
	validateUser,
	handleValidationErrors("register"),
	userController.register,
);

export default router;
