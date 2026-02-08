import pool from "./pool.js";

export default async function query(text, params) {
	return pool.query(text, params);
}
