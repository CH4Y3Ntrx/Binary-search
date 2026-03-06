import express from "express";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "202.29.70.18",
  port: parseInt(process.env.DB_PORT || "28000"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "student",
  database: process.env.DB_NAME || "6860506021",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initialize database table
async function initDb() {
  try {
    const connection = await pool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bst_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numbers TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    connection.release();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}

initDb();

// API Routes
app.get("/api/bst/history", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM bst_history ORDER BY created_at DESC LIMIT 10");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching BST history:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/bst", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM bst_history ORDER BY created_at DESC LIMIT 1");
    res.json(rows[0] || { numbers: "" });
  } catch (error) {
    console.error("Error fetching BST data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/bst", async (req, res) => {
  const { numbers } = req.body;
  if (typeof numbers !== "string") {
    return res.status(400).json({ error: "Invalid numbers format" });
  }
  try {
    await pool.query("INSERT INTO bst_history (numbers) VALUES (?)", [numbers]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving BST data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
