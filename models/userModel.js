import bcrypt from "bcryptjs";
import pool from "../db/pool.js";

async function createUser({
	username,
	password,
	firstname,
	lastname,
	role_id,
	avatar_url,
}) {
	const hashedPassword = await bcrypt.hash(password, 10);

	const query = `
    INSERT INTO users
      (username, password, firstname, lastname, role_id, avatar_url)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

	const values = [
		username,
		hashedPassword,
		firstname,
		lastname,
		role_id,
		avatar_url,
	];

	const { rows } = await pool.query(query, values);
	return rows[0];
}

export default {
	createUser,
};
