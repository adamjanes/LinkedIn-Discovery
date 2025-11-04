/**
 * Migration: Add connectionsCount column to ProfileFollowerHistory table
 * 
 * This allows tracking both follower count and connection count changes over time
 */

const SCHEMA = "prt93nehio7wd1d"

export default {
  description:
    "Add connectionsCount column to ProfileFollowerHistory table",

  /**
   * UP migration: Add connectionsCount column
   */
  async up(client) {
    console.log("   ➕ Adding connectionsCount column to ProfileFollowerHistory table...")

    await client.query(`
      ALTER TABLE "${SCHEMA}"."ProfileFollowerHistory"
      ADD COLUMN IF NOT EXISTS "connectionsCount" BIGINT;
    `)

    console.log("   ✅ Added connectionsCount column")
    console.log(
      "   ℹ️  Table now tracks both followerCount and connectionsCount over time"
    )
  },

  /**
   * DOWN migration: Remove connectionsCount column
   */
  async down(client) {
    console.log("   🗑️  Removing connectionsCount column from ProfileFollowerHistory table...")

    await client.query(`
      ALTER TABLE "${SCHEMA}"."ProfileFollowerHistory"
      DROP COLUMN IF EXISTS "connectionsCount";
    `)

    console.log("   ✅ Rollback complete - connectionsCount column removed")
  },
}

