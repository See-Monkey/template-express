import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "node:url";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { prisma } from "./config/prisma.js";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import userRoutes from "./routes/userRoutes.js";
import userModel from "./models/userModel.js";

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
app.use(
	session({
		store: new PrismaSessionStore(prisma, {
			checkPeriod: 2 * 60 * 1000, // delete expired sessions every 2 min
			dbRecordIdIsSessionId: true,
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

// enable currentPath and user inside ejs
app.use((req, res, next) => {
	res.locals.currentPath = req.path;
	res.locals.user = req.user;
	next();
});

// custom routers
app.use("/", userRoutes);

// 404 for no routes found
app.use((req, res, next) => {
	res.status(404).render("error", {
		status: 404,
		message:
			"We're sorry, there must be some mistake. The content you're looking for no longer exists or has been moved.",
	});
});

// catch middleware errors
app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).render("error", {
		status: 500,
		message: "Something went wrong",
	});
});

// server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
