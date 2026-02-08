import { loadEnvFile } from "node:process";

if (process.env.NODE_ENV !== "production") {
	loadEnvFile();
}

import express from "express";
import path from "path";
import { fileURLToPath } from "node:url";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import pgSession from "connect-pg-simple";
import bcrypt from "bcryptjs";
import pool from "./db/pool.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

// get directory to resolve relative paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// setup public folder for static assets
const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));

// use ejs as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// put form submissions into objects on req.body
app.use(express.urlencoded({ extended: true }));

// setup passport sessions
const PgSession = pgSession(session);

app.use(
	session({
		store: new PgSession({
			pool,
			tableName: "session",
			createTableIfMissing: true,
		}),
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		cookie: {
			maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
		},
	}),
);

app.use(passport.initialize());
app.use(passport.session());

// define necessary passport functions
passport.use(
	new LocalStrategy(async (username, password, done) => {
		try {
			const { rows } = await pool.query(
				"SELECT * FROM users WHERE username = $1",
				[username],
			);
			const user = rows[0];

			if (!user) {
				return done(null, false, { message: "Incorrect username" });
			}

			const match = await bcrypt.compare(password, user.password);
			if (!match) {
				// passwords do not match!
				return done(null, false, { message: "Incorrect password" });
			}

			return done(null, user);
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
		const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
			id,
		]);
		done(null, rows[0]);
	} catch (err) {
		done(err);
	}
});

// enable currentPath inside ejs
app.use((req, res, next) => {
	res.locals.currentPath = req.path;
	next();
});

// passport login route
app.post(
	"/log-in",
	passport.authenticate("local", {
		successRedirect: "/",
		failureRedirect: "/log-in",
	}),
);

// passport logout route
app.post("/log-out", (req, res, next) => {
	req.logout((err) => {
		if (err) return next(err);
		res.redirect("/");
	});
});

// hash stored password with bcrypt when submitting user
app.post("/sign-up", async (req, res, next) => {
	try {
		const hashedPassword = await bcrypt.hash(req.body.password, 10);
		await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [
			req.body.username,
			hashedPassword,
		]);
		res.redirect("/");
	} catch (error) {
		console.error(error);
		next(error);
	}
});

// custom routers
app.use("/", userRoutes);

// 404 for no routes found
app.use((req, res) => {
	res.status(404).render("404");
});

// server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
