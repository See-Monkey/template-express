import userModel from "../models/userModel.js";

async function getIndex(req, res) {
	res.render("index");
}

async function register(req, res, next) {
	try {
		const { username, password, firstName, lastName, avatarURL } = req.body;

		const user = await userModel.createUser({
			username,
			password: password,
			firstname: firstName,
			lastname: lastName,
			role_id: 1,
			avatar_url: avatarURL,
		});

		req.login(user, (err) => {
			if (err) return next(err);
			res.redirect("/messages");
		});
	} catch (err) {
		next(err);
	}
}

export default {
	getIndex,
	register,
};
