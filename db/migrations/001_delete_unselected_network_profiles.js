/**
 * Migration: Delete UserNetworkProfiles where Selected=false and Exploded=false
 *
 * This migration removes network profile records that are neither selected
 * nor exploded, effectively cleaning up unused profile links.
 *
 * Note: The user mentioned "exploed" which we interpret as "Exploded"
 * based on the schema definition.
 *
 * This migration stores backup data in a temporary table for rollback capability.
 */

const SCHEMA = "prt93nehio7wd1d"
const BACKUP_TABLE = `"${SCHEMA}"."_migration_001_backup"`

export default {
  description:
    "Delete UserNetworkProfiles where Selected=false and Exploded=false (with backup for rollback)",

  /**
   * UP migration: Backup and delete the records
   */
  async up(client) {
    // First, count how many records will be deleted
    const countResult = await client.query(`
      SELECT COUNT(*) as count
      FROM "${SCHEMA}"."UserNetworkProfiles"
      WHERE "Selected" = false AND "Exploded" = false
    `)

    const count = parseInt(countResult.rows[0].count)
    console.log(`   📊 Will delete ${count} record(s)`)

    if (count === 0) {
      console.log("   ℹ️  No records to delete")
      return
    }

    // Create backup table
    console.log("   💾 Creating backup table...")
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${BACKUP_TABLE} (
        LIKE "${SCHEMA}"."UserNetworkProfiles" INCLUDING ALL
      )
    `)

    // Backup the records that will be deleted
    console.log("   💾 Backing up records...")
    await client.query(`
      INSERT INTO ${BACKUP_TABLE}
      SELECT * FROM "${SCHEMA}"."UserNetworkProfiles"
      WHERE "Selected" = false AND "Exploded" = false
    `)

    const backupCount = await client.query(
      `SELECT COUNT(*) as count FROM ${BACKUP_TABLE}`
    )
    console.log(`   ✅ Backed up ${backupCount.rows[0].count} record(s)`)

    // Delete the records
    console.log("   🗑️  Deleting records...")
    const deleteResult = await client.query(`
      DELETE FROM "${SCHEMA}"."UserNetworkProfiles"
      WHERE "Selected" = false AND "Exploded" = false
    `)

    console.log(`   ✅ Deleted ${deleteResult.rowCount} record(s)`)
    console.log(
      `   ℹ️  Backup stored in ${BACKUP_TABLE} for rollback capability`
    )
  },

  /**
   * DOWN migration: Restore from backup
   */
  async down(client) {
    // Check if backup table exists
    const tableExists = await client.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name = $2
      )
    `,
      [SCHEMA, "_migration_001_backup"]
    )

    if (!tableExists.rows[0].exists) {
      throw new Error(
        "Backup table not found - cannot rollback. Data was permanently deleted."
      )
    }

    // Count records in backup
    const backupCount = await client.query(
      `SELECT COUNT(*) as count FROM ${BACKUP_TABLE}`
    )
    const count = parseInt(backupCount.rows[0].count)

    if (count === 0) {
      console.log("   ℹ️  Backup table is empty - nothing to restore")
      // Clean up backup table
      await client.query(`DROP TABLE IF EXISTS ${BACKUP_TABLE}`)
      return
    }

    console.log(`   📊 Restoring ${count} record(s) from backup...`)

    // Restore records - use conflict resolution based on unique constraints
    // The table has unique constraints on UserNetworkID and Username
    const restoreResult = await client.query(`
      INSERT INTO "${SCHEMA}"."UserNetworkProfiles"
      SELECT * FROM ${BACKUP_TABLE}
      ON CONFLICT (id) DO NOTHING
    `)

    console.log(`   ✅ Restored ${restoreResult.rowCount} record(s)`)

    // Clean up backup table
    console.log("   🧹 Cleaning up backup table...")
    await client.query(`DROP TABLE IF EXISTS ${BACKUP_TABLE}`)
    console.log("   ✅ Rollback complete")
  },
}
