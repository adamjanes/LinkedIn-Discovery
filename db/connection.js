import pg from "pg"
import dotenv from "dotenv"

dotenv.config()

const { Pool } = pg

// Create a connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
})

// Test the connection
export async function testConnection() {
  try {
    const client = await pool.connect()
    const result = await client.query("SELECT NOW()")
    console.log("✅ Database connection successful!")
    console.log("Current time:", result.rows[0].now)
    client.release()
    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error.message)
    return false
  }
}

// Execute a query
export async function query(text, params) {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    console.log("⏱️  Query executed in", duration, "ms")
    return result
  } catch (error) {
    console.error("❌ Query error:", error.message)
    throw error
  }
}

// Get a client from the pool (for transactions)
export async function getClient() {
  return await pool.connect()
}

// Close the pool
export async function closePool() {
  await pool.end()
}

export default pool
