import { query, testConnection, closePool } from "./connection.js"

// Get query from command line arguments
const sqlQuery = process.argv.slice(2).join(" ")

async function runQuery() {
  if (!sqlQuery) {
    console.log("📝 Interactive SQL Query Tool")
    console.log("=".repeat(60))
    console.log("\nUsage:")
    console.log('  npm run db:query "SELECT * FROM users LIMIT 10"')
    console.log('  npm run db:query "SELECT COUNT(*) FROM networks"')
    console.log("\nOr run interactively by passing your query as arguments:")
    console.log('  node db/query.js "SELECT * FROM table_name"')
    console.log("\nYou can also use environment variables or a .env file")
    console.log("for database credentials.\n")
    process.exit(0)
  }

  try {
    // Test connection first
    const connected = await testConnection()
    if (!connected) {
      console.log("\n💡 Tip: Make sure you have a .env file with:")
      console.log("   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD")
      process.exit(1)
    }

    console.log("\n" + "=".repeat(60))
    console.log("🔍 Executing Query:")
    console.log("=".repeat(60))
    console.log(sqlQuery)
    console.log("=".repeat(60) + "\n")

    // Execute the query
    const result = await query(sqlQuery)

    // Display results
    if (result.rows.length === 0) {
      console.log("✅ Query executed successfully (0 rows returned)")
    } else {
      console.log(
        `✅ Query executed successfully (${result.rows.length} row(s) returned)\n`
      )

      // Get column names
      const columns = Object.keys(result.rows[0])
      const columnWidths = {}

      // Calculate column widths
      columns.forEach((col) => {
        columnWidths[col] = Math.max(
          col.length,
          ...result.rows.map((row) => {
            const val =
              row[col] !== null && row[col] !== undefined
                ? String(row[col])
                : "NULL"
            return Math.min(val.length, 50) // Cap at 50 chars for display
          })
        )
      })

      // Print header
      const header = columns
        .map((col) => col.padEnd(Math.min(columnWidths[col], 50)))
        .join(" | ")
      console.log(header)
      console.log("─".repeat(header.length))

      // Print rows (limit to 100 for readability)
      const rowsToShow = result.rows.slice(0, 100)
      rowsToShow.forEach((row) => {
        const values = columns.map((col) => {
          let val = row[col]
          if (val === null || val === undefined) {
            val = "NULL"
          } else if (typeof val === "object") {
            val = JSON.stringify(val).substring(0, 50)
          } else {
            val = String(val).substring(0, 50)
          }
          return val.padEnd(Math.min(columnWidths[col], 50))
        })
        console.log(values.join(" | "))
      })

      if (result.rows.length > 100) {
        console.log(`\n... and ${result.rows.length - 100} more row(s)`)
      }

      // Print metadata
      console.log(`\n📊 Metadata:`)
      console.log(`   Rows returned: ${result.rows.length}`)
      console.log(`   Columns: ${columns.length} (${columns.join(", ")})`)
      if (result.rowCount !== undefined) {
        console.log(`   Row count: ${result.rowCount}`)
      }
    }
  } catch (error) {
    console.error("\n❌ Query failed:", error.message)
    if (error.hint) {
      console.error("💡 Hint:", error.hint)
    }
    if (error.code) {
      console.error("   Error code:", error.code)
    }
    process.exit(1)
  } finally {
    await closePool()
  }
}

// Run if called directly (when executed via npm script or node command)
if (process.argv[1] && process.argv[1].includes("query.js")) {
  runQuery()
}

export { runQuery }
