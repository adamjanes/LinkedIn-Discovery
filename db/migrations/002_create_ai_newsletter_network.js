/**
 * Migration: Create "AI Influencers - Newsletter" network for User 2
 * and add all profiles from networks 13 and 14 with Selected=true and Exploded=true
 */

const SCHEMA = "prt93nehio7wd1d"

export default {
  description:
    "Create 'AI Influencers - Newsletter' network for User 2 with profiles from networks 13 and 14",

  /**
   * UP migration: Create network and add profiles
   */
  async up(client) {
    // Profiles from networks 13 and 14
    const profiles = [
      // From network 13
      "akantjas",
      "alex-lieberman",
      "benvansprundel",
      "charlie-hills",
      "davidarnoux",
      "emollick",
      "ethan-kinnan",
      "gisenberg",
      "jacobbank",
      "kieranjflanagan",
      "marvin-aziz",
      "pj-accetturo-b3b693129",
      // From network 14
      "aemal",
      "alexcinovoj",
      "joshsystems",
      "leadgenmanthan",
      "nadezhda-privalikhina",
      "nateherkelman",
      "parsadanyan",
      "solomonchristai",
      "vishnugupta12",
      "walid-boulanouar",
    ]

    console.log(`   📊 Will create network and add ${profiles.length} profile(s)`)

    // Create the new UserNetwork
    console.log("   ➕ Creating new UserNetwork...")
    const networkResult = await client.query(
      `
      INSERT INTO "${SCHEMA}"."UserNetworks" ("User_ID", "Name", "created_at", "updated_at")
      VALUES ($1, $2, NOW(), NOW())
      RETURNING id
    `,
      ["2", "AI Influencers - Newsletter"]
    )

    const newNetworkId = networkResult.rows[0].id.toString()
    console.log(`   ✅ Created UserNetwork with ID: ${newNetworkId}`)

    // Add all profiles to the new network with Selected=true and Exploded=true
    console.log(`   ➕ Adding ${profiles.length} profile(s) to network...`)
    let addedCount = 0

    for (const username of profiles) {
      try {
        const result = await client.query(
          `
          INSERT INTO "${SCHEMA}"."UserNetworkProfiles" 
            ("UserNetworkID", "Username", "Selected", "Exploded", "created_at", "updated_at")
          VALUES ($1, $2, true, true, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `,
          [newNetworkId, username]
        )
        if (result.rowCount > 0) {
          addedCount++
        }
      } catch (error) {
        // Log error but continue with other profiles
        console.log(`   ⚠️  Failed to add profile ${username}: ${error.message}`)
      }
    }

    console.log(`   ✅ Added ${addedCount} profile(s) to the new network`)
    console.log(
      `   ℹ️  Network ID: ${newNetworkId}, Name: "AI Influencers - Newsletter"`
    )
  },

  /**
   * DOWN migration: Remove the network and all its profiles
   */
  async down(client) {
    console.log("   🔍 Finding network to remove...")

    // Find the network by name and User_ID
    const networkResult = await client.query(
      `
      SELECT id FROM "${SCHEMA}"."UserNetworks"
      WHERE "User_ID" = $1 AND "Name" = $2
    `,
      ["2", "AI Influencers - Newsletter"]
    )

    if (networkResult.rows.length === 0) {
      console.log("   ℹ️  Network not found - nothing to remove")
      return
    }

    const networkId = networkResult.rows[0].id.toString()
    console.log(`   🔍 Found network with ID: ${networkId}`)

    // Count profiles to be deleted
    const countResult = await client.query(
      `
      SELECT COUNT(*) as count
      FROM "${SCHEMA}"."UserNetworkProfiles"
      WHERE "UserNetworkID" = $1
    `,
      [networkId]
    )

    const profileCount = parseInt(countResult.rows[0].count)
    console.log(`   📊 Will remove ${profileCount} profile(s) and the network`)

    // Delete all profiles from this network
    if (profileCount > 0) {
      console.log("   🗑️  Removing profiles...")
      const deleteResult = await client.query(
        `
        DELETE FROM "${SCHEMA}"."UserNetworkProfiles"
        WHERE "UserNetworkID" = $1
      `,
        [networkId]
      )
      console.log(`   ✅ Removed ${deleteResult.rowCount} profile(s)`)
    }

    // Delete the network
    console.log("   🗑️  Removing network...")
    await client.query(
      `
      DELETE FROM "${SCHEMA}"."UserNetworks"
      WHERE id = $1
    `,
      [networkId]
    )

    console.log("   ✅ Rollback complete - network and profiles removed")
  },
}

