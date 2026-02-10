function isAuth(req, res, next) {
	if (req.isAuthenticated()) return next();
	else
		return res.status(401).render("error", {
			status: 401,
			message: "You must be logged in to view this page",
		});
}

function isAdmin(req, res, next) {
	if (req.isAuthenticated() && req.user.role_id === 3) return next();
	else
		return res.status(403).render("error", {
			status: 403,
			message: "You must have an Admin role to view this page",
		});
}

export { isAuth, isAdmin };
