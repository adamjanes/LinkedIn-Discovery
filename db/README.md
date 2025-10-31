# Database Connection Setup

This directory contains utilities for directly connecting to your Postgres/NocoDB database for query testing and schema exploration.

## Setup Instructions

### 1. Install Dependencies

First, install the required packages:

```bash
npm install
```

### 2. Configure Database Connection

Create a `.env` file in the project root with your database credentials:

```env
# Postgres Database Connection
DB_HOST=your-database-host.com
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password

# SSL Connection (set to "true" if your database requires SSL)
DB_SSL=false
```

**For Railway/NocoDB deployments:**

```env
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=5432
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=true
```

You can find your database credentials in:

- Railway: Project → Database → Connection Info
- NocoDB: Settings → Database → Connection String

### 3. Usage

#### Explore Database Schema

To see all tables, columns, relationships, and indexes:

```bash
npm run db:schema
```

This will display:

- All tables in the database
- Column names, types, and constraints
- Primary keys and foreign key relationships
- Indexes
- Row counts for each table
- Database views (if any)

#### Run Custom Queries

To test SQL queries:

```bash
npm run db:query "SELECT * FROM users LIMIT 10"
```

Or with more complex queries:

```bash
npm run db:query "SELECT COUNT(*) as total_networks FROM networks WHERE user_id = 'some-uuid'"
```

You can also run queries directly:

```bash
node db/query.js "SELECT * FROM networks"
```

## Examples

### Get all networks for a user

```bash
npm run db:query "SELECT * FROM networks WHERE user_id = 'your-user-id'"
```

### Count profiles in a network

```bash
npm run db:query "SELECT network_id, COUNT(*) as profile_count FROM network_profiles GROUP BY network_id"
```

### Find tables matching a pattern

```bash
npm run db:query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%network%'"
```

## Direct Import Usage

You can also import these utilities in your own scripts:

```javascript
import { query, testConnection } from "./db/connection.js"

// Test connection
await testConnection()

// Run a query
const result = await query("SELECT * FROM users LIMIT 5")
console.log(result.rows)
```

## Troubleshooting

**Connection failed:**

- Verify your `.env` file exists and has correct credentials
- Check that your database allows connections from your IP
- For Railway: Make sure your database is running and accessible

**SSL errors:**

- Try setting `DB_SSL=true` in your `.env` file
- Some databases require SSL connections by default

**Permission errors:**

- Verify your database user has SELECT permissions
- Check if you're using the correct database name

## Files

- `connection.js` - Database connection pool and utility functions
- `schema.js` - Schema exploration script
- `query.js` - Interactive query testing script
- `README.md` - This file
