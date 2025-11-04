/**
 * Migration: Create ProfileFollowerHistory table to track follower count changes over time
 *
 * This table stores historical snapshots of follower counts for profiles,
 * allowing us to track growth trends and calculate metrics like:
 * - Weekly/monthly follower growth
 * - Growth rates
 * - Historical comparisons
 */

const SCHEMA = "prt93nehio7wd1d"

export default {
  description:
    "Create ProfileFollowerHistory table to track follower count changes over time",

  /**
   * UP migration: Create the history table
   */
  async up(client) {
    console.log("   ➕ Creating ProfileFollowerHistory table...")

    // Create the table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${SCHEMA}"."ProfileFollowerHistory" (
        id SERIAL PRIMARY KEY,
        "Profiles_id" INTEGER NOT NULL,
        "followerCount" BIGINT NOT NULL,
        "recorded_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)

    console.log("   ✅ Created ProfileFollowerHistory table")

    // Create indexes for efficient queries
    console.log("   ➕ Creating indexes...")

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_profile_follower_history_profile 
      ON "${SCHEMA}"."ProfileFollowerHistory" ("Profiles_id", "recorded_at" DESC);
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_profile_follower_history_date 
      ON "${SCHEMA}"."ProfileFollowerHistory" ("recorded_at" DESC);
    `)

    console.log("   ✅ Created indexes for efficient querying")
    console.log(
      "   ℹ️  Table ready for tracking follower count history over time"
    )
  },

  /**
   * DOWN migration: Drop the table
   */
  async down(client) {
    console.log("   🗑️  Dropping ProfileFollowerHistory table...")

    // Drop indexes first
    await client.query(`
      DROP INDEX IF EXISTS "${SCHEMA}".idx_profile_follower_history_profile;
    `)

    await client.query(`
      DROP INDEX IF EXISTS "${SCHEMA}".idx_profile_follower_history_date;
    `)

    // Drop the table
    await client.query(`
      DROP TABLE IF EXISTS "${SCHEMA}"."ProfileFollowerHistory";
    `)

    console.log(
      "   ✅ Rollback complete - ProfileFollowerHistory table removed"
    )
  },
}
