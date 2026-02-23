import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";

// Create a new user
async function createUser({
	username,
	password,
	firstname,
	lastname,
	role = "USER",
	avatarUrl,
}) {
	const hashedPassword = await bcrypt.hash(password, 10);

	return prisma.user.create({
		data: {
			username,
			password: hashedPassword,
			firstname,
			lastname,
			role,
			avatarUrl,
		},
	});
}

// Find user by username
async function findByUsername(username) {
	return prisma.user.findUnique({
		where: { username },
	});
}

// Find user by id
async function findById(id) {
	return prisma.user.findUnique({
		where: { id },
	});
}

// Validate user password
async function validatePassword(user, password) {
	return bcrypt.compare(password, user.password);
}

// Remove password field before returning user
function sanitizeUser(user) {
	if (!user) return null;
	const { password, ...safeUser } = user;
	return safeUser;
}

export default {
	createUser,
	findByUsername,
	findById,
	validatePassword,
	sanitizeUser,
};
