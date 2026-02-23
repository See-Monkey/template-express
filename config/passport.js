import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import userService from "../services/userService.js";

export function configurePassport() {
	passport.use(
		new LocalStrategy(async (username, password, done) => {
			try {
				const user = await userService.findByUsername(username);

				if (!user) {
					return done(null, false, { message: "Incorrect username" });
				}

				const valid = await userService.validatePassword(user, password);
				if (!valid) {
					return done(null, false, { message: "Incorrect password" });
				}

				return done(null, userService.sanitizeUser(user));
			} catch (err) {
				return done(err);
			}
		}),
	);

	passport.serializeUser((user, done) => {
		done(null, user.id);
	});

	passport.deserializeUser(async (id, done) => {
		try {
			const user = await userService.findById(id);

			if (!user) {
				return done(null, false);
			}

			return done(null, userService.sanitizeUser(user));
		} catch (err) {
			return done(err);
		}
	});
}
