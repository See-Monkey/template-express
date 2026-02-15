import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import userModel from "../models/userModel.js";

export function configurePassport() {
	passport.use(
		new LocalStrategy(async (username, password, done) => {
			try {
				const user = await userModel.findByUsername(username);

				if (!user) {
					return done(null, false, { message: "Incorrect username" });
				}

				const valid = await userModel.validatePassword(user, password);
				if (!valid) {
					return done(null, false, { message: "Incorrect password" });
				}

				return done(null, userModel.sanitizeUser(user));
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
			const user = await userModel.findById(id);

			if (!user) {
				return done(null, false);
			}

			return done(null, userModel.sanitizeUser(user));
		} catch (err) {
			return done(err);
		}
	});
}
