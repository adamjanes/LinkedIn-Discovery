-- Calculate Nodes + Edges Query with optional datetime filtering
-- Parameters: $1 = networkId, $2 = fromDateTime (optional, ISO string), $3 = toDateTime (optional, ISO string)
-- If $2 and $3 are NULL, returns all data (backward compatible)

WITH seed_creators AS (
  SELECT 
    unp."Username",
    p.id AS profile_id,
    p."linkedinUrl",
    p."firstName" || ' ' || p."lastName" AS name,
    p."headline",
    p."photo" AS picture_url,
    p."followerCount"
  FROM "prt93nehio7wd1d"."UserNetworkProfiles" unp
  JOIN "prt93nehio7wd1d"."UserNetworks" un
    ON un.id = unp."UserNetworkID"::int
  JOIN "prt93nehio7wd1d"."Profiles" p
    ON p."publicIdentifier" = unp."Username"
  WHERE un.id = $1
    AND unp."Selected" = TRUE
),

-- ✅ Combine all seed↔anyone edges (both directions)
-- Filter by datetime range if provided
all_edges AS (
  SELECT 
    CASE 
      WHEN sc.profile_id = c."Profiles_id" THEN sc.profile_id
      WHEN sc.profile_id = po."Profiles_id" THEN sc.profile_id
    END AS seed_id,
    c."Profiles_id"  AS commenter_id,
    po."Profiles_id" AS target_id,
    COUNT(*) AS comment_count,
    MAX(c."createdAtTime") AS last_comment_time
  FROM "prt93nehio7wd1d"."Comments" c
  JOIN "prt93nehio7wd1d"."Posts" po
    ON po.id = c."Posts_id"
  JOIN seed_creators sc
    ON sc.profile_id IN (c."Profiles_id", po."Profiles_id")
  WHERE c."Profiles_id" <> po."Profiles_id"
    AND (
      -- If datetime parameters are NULL, empty, or the string "null", return all data
      (NULLIF(NULLIF($2::text, ''), 'null') IS NULL AND NULLIF(NULLIF($3::text, ''), 'null') IS NULL)
      OR
      -- Otherwise, filter by post creation time (postedTime) - includes all comments on posts in the time window
      (
        NULLIF(NULLIF($2::text, ''), 'null') IS NOT NULL 
        AND NULLIF(NULLIF($3::text, ''), 'null') IS NOT NULL
        AND po."postedTime" >= NULLIF(NULLIF($2::text, ''), 'null')::timestamptz 
        AND po."postedTime" < NULLIF(NULLIF($3::text, ''), 'null')::timestamptz
      )
    )
  GROUP BY seed_id, c."Profiles_id", po."Profiles_id"
),

-- ✅ Merge inbound/outbound edges per seed and de-duplicate pairs
distinct_edges AS (
  SELECT 
    seed_id,
    CASE 
      WHEN commenter_id = seed_id THEN target_id
      ELSE commenter_id
    END AS other_profile_id,
    SUM(comment_count) AS total_comments,
    MAX(last_comment_time) AS last_comment_time
  FROM all_edges
  GROUP BY seed_id, other_profile_id
),

-- ✅ Convert to standard source/target edges for graph output (no limit - show all connections)
final_edges AS (
  SELECT 
    seed_id AS source,
    other_profile_id AS target,
    total_comments AS comment_count
  FROM distinct_edges
),

-- ✅ Collect all unique profiles that appear in the edges
network_profiles AS (
  SELECT DISTINCT
    p.id AS profile_id,
    p."firstName" || ' ' || p."lastName" AS name,
    p."headline",
    p."linkedinUrl",
    p."photo" AS picture_url,
    p."followerCount",
    (p.id IN (SELECT profile_id FROM seed_creators)) AS is_seed
  FROM "prt93nehio7wd1d"."Profiles" p
  WHERE p.id IN (
    SELECT source FROM final_edges
    UNION
    SELECT target FROM final_edges
  )
)

-- ✅ Return final JSON structure
SELECT jsonb_build_object(
  'network_id', $1,
  'nodes', (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', np.profile_id,
        'name', np.name,
        'headline', np.headline,
        'linkedin_url', np."linkedinUrl",
        'picture_url', np.picture_url,
        'followers', np."followerCount",
        'is_seed', np.is_seed
      )
    )
    FROM network_profiles np
  ),
  'edges', (
    SELECT jsonb_agg(
      jsonb_build_object(
        'source', fe.source,
        'target', fe.target,
        'weight', fe.comment_count
      )
    )
    FROM final_edges fe
  )
) AS graph_data;

