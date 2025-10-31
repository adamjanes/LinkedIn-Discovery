import { query, testConnection, closePool } from "./connection.js"

const SCHEMA = "prt93nehio7wd1d"

async function exploreApplicationSchema() {
  console.log("🔍 Exploring Application Schema:", SCHEMA)
  console.log("=".repeat(80) + "\n")

  try {
    await testConnection()

    // Get all tables in the schema
    const tablesResult = await query(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = $1
      ORDER BY table_name;
    `,
      [SCHEMA]
    )

    const tables = tablesResult.rows.map((r) => r.table_name)

    const schemaInfo = {}

    for (const tableName of tables) {
      console.log(`📋 Analyzing: ${tableName}...`)

      // Get columns
      const columnsResult = await query(
        `
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          numeric_precision,
          numeric_scale,
          is_nullable,
          column_default,
          ordinal_position
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position;
      `,
        [SCHEMA, tableName]
      )

      // Get primary keys
      const pkResult = await query(
        `
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = $1
          AND tc.table_name = $2
          AND tc.constraint_type = 'PRIMARY KEY'
        ORDER BY kcu.ordinal_position;
      `,
        [SCHEMA, tableName]
      )

      // Get foreign keys
      const fkResult = await query(
        `
        SELECT 
          kcu.column_name AS local_column,
          ccu.table_schema AS foreign_schema,
          ccu.table_name AS foreign_table,
          ccu.column_name AS foreign_column
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = $1
          AND tc.table_name = $2;
      `,
        [SCHEMA, tableName]
      )

      // Get unique constraints
      const uniqueResult = await query(
        `
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = $1
          AND tc.table_name = $2
          AND tc.constraint_type = 'UNIQUE'
        ORDER BY kcu.column_name;
      `,
        [SCHEMA, tableName]
      )

      // Get indexes
      const indexResult = await query(
        `
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = $1 AND tablename = $2;
      `,
        [SCHEMA, tableName]
      )

      // Get row count
      let rowCount = 0
      try {
        const countResult = await query(
          `SELECT COUNT(*) as count FROM "${SCHEMA}"."${tableName}"`
        )
        rowCount = parseInt(countResult.rows[0].count)
      } catch (e) {
        // Ignore count errors
      }

      schemaInfo[tableName] = {
        columns: columnsResult.rows,
        primaryKeys: pkResult.rows.map((r) => r.column_name),
        foreignKeys: fkResult.rows,
        uniqueConstraints: uniqueResult.rows.map((r) => r.column_name),
        indexes: indexResult.rows,
        rowCount,
      }
    }

    // Output formatted schema
    console.log("\n" + "=".repeat(80))
    console.log("📘 UPDATED DATABASE SCHEMA REFERENCE")
    console.log("=".repeat(80))
    console.log(`\nSchema: "${SCHEMA}"\n`)

    for (const [tableName, info] of Object.entries(schemaInfo)) {
      console.log(`\n${"─".repeat(80)}`)
      console.log(
        `${Object.keys(schemaInfo).indexOf(tableName) + 1}. ${tableName}`
      )
      console.log(`${"─".repeat(80)}`)

      if (info.rowCount > 0) {
        console.log(`   📊 Row Count: ${info.rowCount.toLocaleString()}\n`)
      }

      console.log("   Columns:")
      for (const col of info.columns) {
        let type = col.data_type

        if (col.character_maximum_length) {
          type += `(${col.character_maximum_length})`
        } else if (col.numeric_precision && col.data_type === "numeric") {
          type += `(${col.numeric_precision}${
            col.numeric_scale ? "," + col.numeric_scale : ""
          })`
        }

        let constraints = []
        if (info.primaryKeys.includes(col.column_name)) {
          constraints.push("PK")
        }
        if (info.uniqueConstraints.includes(col.column_name)) {
          constraints.push("UNIQUE")
        }
        if (col.is_nullable === "NO") {
          constraints.push("NOT NULL")
        }
        if (col.column_default) {
          constraints.push(`DEFAULT ${col.column_default}`)
        }

        const fk = info.foreignKeys.find(
          (f) => f.local_column === col.column_name
        )
        if (fk) {
          constraints.push(`FK → ${fk.foreign_table}.${fk.foreign_column}`)
        }

        const constraintStr =
          constraints.length > 0 ? ` [${constraints.join(", ")}]` : ""

        console.log(
          `      • ${col.column_name.padEnd(35)} ${type.padEnd(
            25
          )}${constraintStr}`
        )
      }

      if (info.indexes.length > 0) {
        console.log(`\n   Indexes:`)
        info.indexes.forEach((idx) => {
          console.log(`      • ${idx.indexname}`)
        })
      }
    }

    // Generate relationships summary
    console.log(`\n${"─".repeat(80)}`)
    console.log("🔗 RELATIONSHIPS SUMMARY")
    console.log(`${"─".repeat(80)}\n`)

    const relationships = []
    for (const [tableName, info] of Object.entries(schemaInfo)) {
      for (const fk of info.foreignKeys) {
        relationships.push(
          `${tableName}.${fk.local_column} → ${fk.foreign_table}.${fk.foreign_column}`
        )
      }
    }

    relationships.forEach((rel, idx) => {
      console.log(`   ${idx + 1}. ${rel}`)
    })

    console.log("\n" + "=".repeat(80))

    return schemaInfo
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

if (process.argv[1] && process.argv[1].includes("explore-schema.js")) {
  exploreApplicationSchema()
}

export { exploreApplicationSchema }
