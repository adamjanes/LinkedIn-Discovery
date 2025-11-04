import { getClient, closePool, testConnection } from "../connection.js"
import { readdir } from "fs/promises"
import { join } from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SCHEMA = "prt93nehio7wd1d"

/**
 * Migration system for tracking and executing SQL migrations with rollback support
 */

/**
 * Initialize the migrations tracking table
 */
async function initMigrationsTable(client) {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS "${SCHEMA}"."_migrations" (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
      rolled_back_at TIMESTAMP,
      up_sql TEXT NOT NULL,
      down_sql TEXT NOT NULL,
      description TEXT
    );
  `
  await client.query(createTableQuery)
}

/**
 * Get all applied migrations
 */
async function getAppliedMigrations(client) {
  const result = await client.query(`
    SELECT name, rolled_back_at 
    FROM "${SCHEMA}"."_migrations" 
    WHERE rolled_back_at IS NULL
    ORDER BY applied_at ASC
  `)
  return result.rows.map((row) => row.name)
}

/**
 * Load a migration file
 */
async function loadMigration(migrationName) {
  try {
    const migrationPath = join(__dirname, `${migrationName}.js`)
    const migrationModule = await import(`file://${migrationPath}`)
    return migrationModule.default
  } catch (error) {
    throw new Error(`Failed to load migration ${migrationName}: ${error.message}`)
  }
}

/**
 * Execute a migration
 */
async function runMigration(migrationName, direction = "up") {
  const client = await getClient()

  try {
    await client.query("BEGIN")

    // Initialize migrations table
    await initMigrationsTable(client)

    // Load migration
    const migration = await loadMigration(migrationName)

    if (direction === "up") {
      // Check if already applied
      const existing = await client.query(
        `SELECT * FROM "${SCHEMA}"."_migrations" WHERE name = $1 AND rolled_back_at IS NULL`,
        [migrationName]
      )

      if (existing.rows.length > 0) {
        console.log(`⚠️  Migration ${migrationName} already applied`)
        await client.query("ROLLBACK")
        return false
      }

      // Check if migration was previously rolled back
      const rolledBack = await client.query(
        `SELECT * FROM "${SCHEMA}"."_migrations" WHERE name = $1 AND rolled_back_at IS NOT NULL`,
        [migrationName]
      )

      // Execute up migration
      if (migration.up) {
        console.log(`▶️  Executing UP migration: ${migrationName}`)
        await migration.up(client)
      }

      // Record migration - update if previously rolled back, insert if new
      if (rolledBack.rows.length > 0) {
        // Re-applying a rolled-back migration - update existing record
        await client.query(
          `UPDATE "${SCHEMA}"."_migrations" 
           SET applied_at = NOW(), 
               rolled_back_at = NULL,
               up_sql = $2,
               down_sql = $3,
               description = $4
           WHERE name = $1`,
          [
            migrationName,
            migration.up?.toString() || "",
            migration.down?.toString() || "",
            migration.description || "",
          ]
        )
      } else {
        // New migration - insert record
        await client.query(
          `INSERT INTO "${SCHEMA}"."_migrations" (name, up_sql, down_sql, description) 
           VALUES ($1, $2, $3, $4)`,
          [
            migrationName,
            migration.up?.toString() || "",
            migration.down?.toString() || "",
            migration.description || "",
          ]
        )
      }

      await client.query("COMMIT")
      console.log(`✅ Migration ${migrationName} applied successfully`)
      return true
    } else {
      // Rollback (down)
      const existing = await client.query(
        `SELECT * FROM "${SCHEMA}"."_migrations" WHERE name = $1 AND rolled_back_at IS NULL`,
        [migrationName]
      )

      if (existing.rows.length === 0) {
        console.log(`⚠️  Migration ${migrationName} not found or already rolled back`)
        await client.query("ROLLBACK")
        return false
      }

      // Execute down migration
      if (migration.down) {
        console.log(`◀️  Executing DOWN migration: ${migrationName}`)
        await migration.down(client)
      }

      // Mark as rolled back
      await client.query(
        `UPDATE "${SCHEMA}"."_migrations" 
         SET rolled_back_at = NOW() 
         WHERE name = $1 AND rolled_back_at IS NULL`,
        [migrationName]
      )

      await client.query("COMMIT")
      console.log(`✅ Migration ${migrationName} rolled back successfully`)
      return true
    }
  } catch (error) {
    await client.query("ROLLBACK")
    console.error(`❌ Migration ${migrationName} failed:`, error.message)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Run all pending migrations
 */
async function runAllMigrations() {
  const client = await getClient()

  try {
    await initMigrationsTable(client)
    const appliedMigrations = await getAppliedMigrations(client)

    // Get all migration files
    const files = await readdir(__dirname)
    const migrationFiles = files
      .filter((f) => f.endsWith(".js") && f !== "migrate.js")
      .map((f) => f.replace(".js", ""))
      .sort()

    const pendingMigrations = migrationFiles.filter(
      (m) => !appliedMigrations.includes(m)
    )

    if (pendingMigrations.length === 0) {
      console.log("✅ No pending migrations")
      return
    }

    console.log(`📦 Found ${pendingMigrations.length} pending migration(s)`)

    for (const migrationName of pendingMigrations) {
      await runMigration(migrationName, "up")
    }

    console.log(`✅ All migrations completed`)
  } catch (error) {
    console.error("❌ Migration process failed:", error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * List all migrations and their status
 */
async function listMigrations() {
  const client = await getClient()

  try {
    await initMigrationsTable(client)
    const result = await client.query(`
      SELECT name, applied_at, rolled_back_at, description
      FROM "${SCHEMA}"."_migrations"
      ORDER BY applied_at DESC
    `)

    console.log("\n📋 Migration Status:")
    console.log("=".repeat(80))

    if (result.rows.length === 0) {
      console.log("No migrations found")
    } else {
      result.rows.forEach((row) => {
        const status = row.rolled_back_at ? "🔄 ROLLED BACK" : "✅ APPLIED"
        const date = row.rolled_back_at || row.applied_at
        console.log(`${status} | ${row.name} | ${date}`)
        if (row.description) {
          console.log(`     ${row.description}`)
        }
      })
    }
    console.log("=".repeat(80))
  } catch (error) {
    console.error("❌ Failed to list migrations:", error)
    throw error
  } finally {
    client.release()
  }
}

// CLI interface
const command = process.argv[2]
const migrationName = process.argv[3]

async function main() {
  const connected = await testConnection()
  if (!connected) {
    console.error("❌ Database connection failed")
    process.exit(1)
  }

  try {
    switch (command) {
      case "up":
        if (!migrationName) {
          console.error("❌ Please provide a migration name")
          process.exit(1)
        }
        await runMigration(migrationName, "up")
        break

      case "down":
        if (!migrationName) {
          console.error("❌ Please provide a migration name")
          process.exit(1)
        }
        await runMigration(migrationName, "down")
        break

      case "all":
        await runAllMigrations()
        break

      case "list":
        await listMigrations()
        break

      default:
        console.log("📦 Migration Tool")
        console.log("=".repeat(60))
        console.log("\nUsage:")
        console.log("  npm run db:migrate up <migration-name>   Apply a migration")
        console.log("  npm run db:migrate down <migration-name> Rollback a migration")
        console.log("  npm run db:migrate all                   Run all pending migrations")
        console.log("  npm run db:migrate list                  List all migrations")
        console.log("\nExample:")
        console.log('  npm run db:migrate up "001_delete_unselected_profiles"')
        process.exit(0)
    }
  } catch (error) {
    console.error("❌ Error:", error.message)
    process.exit(1)
  } finally {
    await closePool()
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].includes("migrate.js")) {
  main()
}

export { runMigration, runAllMigrations, listMigrations, initMigrationsTable }

