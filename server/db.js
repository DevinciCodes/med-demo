// server/db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",        // <-- your MySQL username
  password: process.env.DB_PASS || "",        // <-- your MySQL password
  database: "pillar",                         // <-- use your pillar database
  waitForConnections: true,
  connectionLimit: 10,
});
