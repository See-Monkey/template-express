#! /usr/bin/env node

import { loadEnvFile } from "node:process";
import pkg from "pg";

if (process.env.NODE_ENV !== "production") {
	loadEnvFile();
}

const { Client } = pkg;

const SQL = `
DROP TABLE IF EXISTS inventory, categories CASCADE;

CREATE TABLE categories (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR (255) UNIQUE NOT NULL
);

CREATE TABLE inventory (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  item VARCHAR (255) NOT NULL,
  qty INT NOT NULL CHECK (qty >= 0),
  price INT NOT NULL CHECK (price >= 0),
  category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE
);

INSERT INTO categories (name) 
VALUES
  ('Weapons')
ON CONFLICT (name) DO NOTHING;

INSERT INTO inventory (item, qty, price, category_id)
VALUES
  ('Iron Sword', 10, 150, 1)
`;

async function main() {
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl:
			process.env.NODE_ENV === "production"
				? { rejectUnauthorized: false }
				: false,
	});

	try {
		console.log("Seeding database...");

		await client.connect();
		await client.query("BEGIN");
		await client.query(SQL);
		await client.query("COMMIT");

		console.log("Done");
	} catch (err) {
		console.error("Seed failed, rolling back:", err.message);
		await client.query("ROLLBACK");
	} finally {
		await client.end();
	}
}

main();
