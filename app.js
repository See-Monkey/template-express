import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "node:url";
import passport from "passport";
import session from "express-session";
import { configurePassport } from "./config/passport.js";
import { prisma } from "./config/prisma.js";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
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

// parse JSON and form data into req.body
app.use(express.json());
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

configurePassport();

app.use(passport.initialize());
app.use(passport.session());

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
