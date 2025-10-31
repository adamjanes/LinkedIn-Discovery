import { query, testConnection, closePool } from "./connection.js"

async function exploreSchema() {
  console.log("🔍 Exploring database schema...\n")

  try {
    // Test connection first
    const connected = await testConnection()
    if (!connected) {
      process.exit(1)
    }

    console.log("\n" + "=".repeat(60))
    console.log("📊 DATABASE TABLES")
    console.log("=".repeat(60))

    // Get all tables
    const tablesResult = await query(`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `)

    if (tablesResult.rows.length === 0) {
      console.log("No tables found in the public schema.")
      return
    }

    console.log(`\nFound ${tablesResult.rows.length} table(s):\n`)

    for (const table of tablesResult.rows) {
      const tableName = table.table_name
      console.log(`\n${"─".repeat(60)}`)
      console.log(`📋 Table: ${tableName}`)
      console.log(`   Type: ${table.table_type}`)
      console.log(`${"─".repeat(60)}`)

      // Get columns for this table
      const columnsResult = await query(
        `
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = $1
        ORDER BY ordinal_position;
      `,
        [tableName]
      )

      console.log("\n   Columns:")
      if (columnsResult.rows.length > 0) {
        columnsResult.rows.forEach((col) => {
          const length = col.character_maximum_length
            ? `(${col.character_maximum_length})`
            : ""
          const nullable = col.is_nullable === "YES" ? "NULL" : "NOT NULL"
          const defaultValue = col.column_default
            ? ` DEFAULT ${col.column_default}`
            : ""
          console.log(
            `     • ${col.column_name.padEnd(30)} ${
              col.data_type
            }${length} ${nullable}${defaultValue}`
          )
        })
      }

      // Get primary key constraints
      const pkResult = await query(
        `
        SELECT 
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
          AND tc.table_name = $1
          AND tc.constraint_type = 'PRIMARY KEY'
        ORDER BY kcu.ordinal_position;
      `,
        [tableName]
      )

      if (pkResult.rows.length > 0) {
        const pkColumns = pkResult.rows.map((r) => r.column_name).join(", ")
        console.log(`\n   Primary Key: ${pkColumns}`)
      }

      // Get foreign key constraints
      const fkResult = await query(
        `
        SELECT 
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = $1;
      `,
        [tableName]
      )

      if (fkResult.rows.length > 0) {
        console.log(`\n   Foreign Keys:`)
        fkResult.rows.forEach((fk) => {
          console.log(
            `     • ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`
          )
        })
      }

      // Get indexes
      const indexResult = await query(
        `
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = $1;
      `,
        [tableName]
      )

      if (indexResult.rows.length > 0) {
        console.log(`\n   Indexes:`)
        indexResult.rows.forEach((idx) => {
          console.log(`     • ${idx.indexname}`)
        })
      }

      // Get row count
      try {
        const countResult = await query(
          `SELECT COUNT(*) as count FROM ${tableName}`
        )
        console.log(
          `\n   Row Count: ${parseInt(
            countResult.rows[0].count
          ).toLocaleString()}`
        )
      } catch (e) {
        // Ignore count errors (might be a view or permission issue)
      }
    }

    console.log(`\n${"─".repeat(60)}\n`)

    // Get views if any
    const viewsResult = await query(`
      SELECT 
        table_name,
        view_definition
      FROM information_schema.views
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `)

    if (viewsResult.rows.length > 0) {
      console.log("\n" + "=".repeat(60))
      console.log("👁️  DATABASE VIEWS")
      console.log("=".repeat(60))
      viewsResult.rows.forEach((view) => {
        console.log(`\n📋 View: ${view.table_name}`)
        console.log(
          `   Definition: ${view.view_definition.substring(0, 200)}...`
        )
      })
    }
  } catch (error) {
    console.error("❌ Error exploring schema:", error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

// Run if called directly (when executed via npm script or node command)
if (process.argv[1] && process.argv[1].includes("schema.js")) {
  exploreSchema()
}

export { exploreSchema }
