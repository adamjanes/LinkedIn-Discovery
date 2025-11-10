# Database Queries

This directory contains SQL queries for the LinkedIn Network Discovery application.

## Updated Queries with Datetime Filtering

### calculate-comments-with-datetime.sql
Calculates comment statistics for a network with optional datetime filtering.

**Parameters:**
- `$1` - networkId (required)
- `$2` - fromDateTime (optional, ISO string like '2025-10-20T00:00:00Z')
- `$3` - toDateTime (optional, ISO string like '2025-10-21T00:00:00Z')

**Backward Compatibility:**
- If `$2` and `$3` are NULL, the query returns all data (same as original query)
- This allows existing endpoints to work without changes

**Usage:**
```sql
-- All data (backward compatible)
SELECT * FROM calculate_comments_query(13, NULL, NULL);

-- Filtered by datetime range
SELECT * FROM calculate_comments_query(13, '2025-10-20T00:00:00Z', '2025-10-21T00:00:00Z');
```

### calculate-nodes-edges-with-datetime.sql
Calculates nodes and edges for network graph visualization with optional datetime filtering.

**Parameters:**
- `$1` - networkId (required)
- `$2` - fromDateTime (optional, ISO string)
- `$3` - toDateTime (optional, ISO string)

**Backward Compatibility:**
- If `$2` and `$3` are NULL, the query returns all data (same as original query)

**Usage:**
```sql
-- All data (backward compatible)
SELECT * FROM calculate_nodes_edges_query(13, NULL, NULL);

-- Filtered by datetime range
SELECT * FROM calculate_nodes_edges_query(13, '2025-10-20T00:00:00Z', '2025-10-21T00:00:00Z');
```

## Testing

Use the test script to verify the queries work correctly:

```bash
node db/test-queries.js
```

This will test:
1. Backward compatibility (no datetime filter)
2. Datetime filtering functionality
3. Both comments and nodes/edges queries

## Integration with n8n

These queries are designed to be used in n8n workflows. The n8n endpoints should:
1. Accept optional `from` and `to` query parameters
2. Pass them as `$2` and `$3` to the SQL queries
3. If not provided, pass NULL for backward compatibility

Example n8n endpoint behavior:
- `/networkgraph/13` → Query with NULL, NULL (all data)
- `/networkgraph/13?from=2025-10-20T00:00:00Z&to=2025-10-21T00:00:00Z` → Query with datetime filter

