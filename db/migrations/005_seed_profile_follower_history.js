/**
 * Migration: Seed ProfileFollowerHistory with current follower/connection counts
 *
 * This migration populates the ProfileFollowerHistory table with the current
 * follower and connection counts from the Profiles table for all profiles
 * that exist in UserNetworkProfiles. Only one record per profile is created.
 */

const SCHEMA = "prt93nehio7wd1d"

export default {
  description:
    "Seed ProfileFollowerHistory with current follower/connection counts for all profiles in UserNetworkProfiles",

  /**
   * UP migration: Insert current follower/connection counts
   */
  async up(client) {
    console.log("   📊 Counting profiles to seed...")

    // Count how many profiles we'll seed
    const countResult = await client.query(`
      SELECT COUNT(DISTINCT p.id) as profile_count
      FROM "${SCHEMA}"."UserNetworkProfiles" unp
      JOIN "${SCHEMA}"."Profiles" p ON unp."Username" = p."publicIdentifier"
      WHERE p."followerCount" IS NOT NULL 
         OR p."connectionsCount" IS NOT NULL
    `)

    const profileCount = parseInt(countResult.rows[0].profile_count)
    console.log(`   📊 Found ${profileCount} profile(s) to seed`)

    if (profileCount === 0) {
      console.log("   ℹ️  No profiles to seed")
      return
    }

    // Check if any records already exist
    const existingResult = await client.query(`
      SELECT COUNT(*) as count FROM "${SCHEMA}"."ProfileFollowerHistory"
    `)
    const existingCount = parseInt(existingResult.rows[0].count)

    if (existingCount > 0) {
      console.log(
        `   ⚠️  Warning: ${existingCount} record(s) already exist in ProfileFollowerHistory`
      )
      console.log("   ℹ️  Skipping profiles that already have history records")
    }

    // Insert current follower/connection counts for all profiles in UserNetworkProfiles
    console.log("   ➕ Seeding ProfileFollowerHistory with current values...")

    const insertResult = await client.query(`
      INSERT INTO "${SCHEMA}"."ProfileFollowerHistory" 
        ("Profiles_id", "followerCount", "connectionsCount", "recorded_at")
      SELECT DISTINCT ON (p.id)
        p.id as "Profiles_id",
        COALESCE(p."followerCount", 0) as "followerCount",
        p."connectionsCount" as "connectionsCount",
        NOW() as "recorded_at"
      FROM "${SCHEMA}"."UserNetworkProfiles" unp
      JOIN "${SCHEMA}"."Profiles" p ON unp."Username" = p."publicIdentifier"
      WHERE (p."followerCount" IS NOT NULL OR p."connectionsCount" IS NOT NULL)
        AND NOT EXISTS (
          SELECT 1 FROM "${SCHEMA}"."ProfileFollowerHistory" pfh
          WHERE pfh."Profiles_id" = p.id
        )
    `)

    const insertedCount = insertResult.rowCount
    console.log(
      `   ✅ Seeded ${insertedCount} profile(s) with current follower/connection counts`
    )

    if (insertedCount < profileCount) {
      console.log(
        `   ℹ️  ${
          profileCount - insertedCount
        } profile(s) already had history records`
      )
    }
  },

  /**
   * DOWN migration: Remove seeded records
   */
  async down(client) {
    console.log("   🔍 Finding seeded records to remove...")

    // Count records that match the seeded data pattern
    const countResult = await client.query(`
      SELECT COUNT(*) as count
      FROM "${SCHEMA}"."ProfileFollowerHistory" pfh
      WHERE EXISTS (
        SELECT 1 FROM "${SCHEMA}"."UserNetworkProfiles" unp
        JOIN "${SCHEMA}"."Profiles" p ON unp."Username" = p."publicIdentifier"
        WHERE p.id = pfh."Profiles_id"
      )
    `)

    const count = parseInt(countResult.rows[0].count)
    console.log(`   📊 Found ${count} record(s) to remove`)

    if (count === 0) {
      console.log("   ℹ️  No seeded records found")
      return
    }

    // Delete all records for profiles in UserNetworkProfiles
    console.log("   🗑️  Removing seeded records...")
    const deleteResult = await client.query(`
      DELETE FROM "${SCHEMA}"."ProfileFollowerHistory" pfh
      WHERE EXISTS (
        SELECT 1 FROM "${SCHEMA}"."UserNetworkProfiles" unp
        JOIN "${SCHEMA}"."Profiles" p ON unp."Username" = p."publicIdentifier"
        WHERE p.id = pfh."Profiles_id"
      )
    `)

    console.log(`   ✅ Removed ${deleteResult.rowCount} record(s)`)
    console.log("   ✅ Rollback complete")
  },
}
