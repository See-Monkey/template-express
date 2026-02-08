import { loadEnvFile } from "node:process";

if (process.env.NODE_ENV !== "production") {
	loadEnvFile();
}

import express from "express";
import path from "path";
import { fileURLToPath } from "node:url";
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

app.use(express.urlencoded({ extended: true }));

// enable currentPath inside ejs
app.use((req, res, next) => {
	res.locals.currentPath = req.path;
	next();
});

// wire in custom routers
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
