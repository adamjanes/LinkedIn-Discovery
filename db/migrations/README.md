# Database Migrations

This directory contains database migrations with rollback support. Migrations track all database schema changes and data modifications, allowing you to safely apply and rollback changes.

## Overview

The migration system:

- ✅ Tracks all applied migrations in a `_migrations` table
- ✅ Supports rollback for all migrations (where applicable)
- ✅ Stores backup data for DELETE operations
- ✅ Provides transaction safety
- ✅ Allows you to list migration status

## Usage

### Apply a Migration

```bash
npm run db:migrate up <migration-name>
```

Example:

```bash
npm run db:migrate up 001_delete_unselected_network_profiles
```

### Rollback a Migration

```bash
npm run db:migrate down <migration-name>
```

Example:

```bash
npm run db:migrate down 001_delete_unselected_network_profiles
```

### Run All Pending Migrations

```bash
npm run db:migrate all
```

### List Migration Status

```bash
npm run db:migrate list
```

## Migration Files

Migration files should be named with a numeric prefix (e.g., `001_`, `002_`) and a descriptive name. Each migration file should export a default object with:

- `description`: Human-readable description of the migration
- `up(client)`: Async function that applies the migration (takes a database client)
- `down(client)`: Async function that rolls back the migration (takes a database client)

Example:

```javascript
export default {
  description: "Migration description",

  async up(client) {
    // Apply migration
    await client.query(`...`)
  },

  async down(client) {
    // Rollback migration
    await client.query(`...`)
  },
}
```

## How Rollbacks Work

### For Data Deletions

When a migration deletes data, it automatically:

1. Creates a backup table (e.g., `_migration_001_backup`)
2. Backs up all records that will be deleted
3. Deletes the records from the original table
4. Stores the backup for rollback capability

When rolling back:

1. Restores records from the backup table
2. Deletes the backup table after successful restoration

### For Schema Changes

For schema changes (ALTER TABLE, CREATE TABLE, etc.):

- You must implement the reverse operation in the `down` function
- Example: If `up` adds a column, `down` should drop it
- Example: If `up` creates a table, `down` should drop it

## Migration Tracking

All migrations are tracked in the `"prt93nehio7wd1d"."_migrations"` table with:

- `name`: Migration file name
- `applied_at`: When the migration was applied
- `rolled_back_at`: When the migration was rolled back (NULL if not rolled back)
- `up_sql`: The up migration code (for reference)
- `down_sql`: The down migration code (for reference)
- `description`: Migration description

## Best Practices

1. **Always test migrations** on a development database first
2. **Backup before large migrations** - even though the system creates backups for deletes
3. **Use transactions** - migrations automatically run in transactions
4. **Name migrations clearly** - use descriptive names that explain what the migration does
5. **Never modify applied migrations** - create a new migration instead
6. **Document complex migrations** - add comments explaining why and what

## Current Migrations

### 001_delete_unselected_network_profiles

Deletes records from `UserNetworkProfiles` where `Selected=false` and `Exploded=false`.

- **Status**: ✅ Applied
- **Records Deleted**: 1,665
- **Backup**: Stored in `_migration_001_backup` for rollback

To rollback:

```bash
npm run db:migrate down 001_delete_unselected_network_profiles
```

## Troubleshooting

### Migration Already Applied

If you try to apply a migration that's already been applied, you'll see:

```
⚠️  Migration <name> already applied
```

### Migration Not Found for Rollback

If you try to rollback a migration that wasn't applied:

```
⚠️  Migration <name> not found or already rolled back
```

### Backup Table Missing

If the backup table is missing during rollback (for DELETE migrations):

```
❌ Backup table not found - cannot rollback
```

This can happen if:

- The backup table was manually deleted
- The migration was applied before backup functionality was added

## See Also

- [Database Schema Reference](../SCHEMA_REFERENCE.md)
- [Database Connection](../connection.js)

