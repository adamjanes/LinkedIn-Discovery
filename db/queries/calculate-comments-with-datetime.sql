-- Calculate Comments Query with optional datetime filtering
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

-- ✅ Collect all comments where either commenter or post owner is a seed
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

-- ✅ Merge inbound / outbound for each seed ↔ other profile
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

-- ✅ Expand both directions for later joins (no limit - show all connections)
comments_map AS (
  SELECT 
    de.seed_id AS commenter_id,
    de.other_profile_id AS target_id,
    de.total_comments AS comment_count
  FROM distinct_edges de
  UNION ALL
  SELECT 
    de.other_profile_id AS commenter_id,
    de.seed_id AS target_id,
    de.total_comments AS comment_count
  FROM distinct_edges de
),

-- ✅ Separate seed↔seed subset
seed_comments_map AS (
  SELECT *
  FROM comments_map
  WHERE commenter_id IN (SELECT profile_id FROM seed_creators)
    AND target_id   IN (SELECT profile_id FROM seed_creators)
),

-- ✅ All profiles appearing in limited interactions
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
    SELECT commenter_id FROM comments_map
    UNION
    SELECT target_id FROM comments_map
  )
),

-- ✅ Profile ↔ seed stats
profile_stats AS (
  SELECT 
    np.profile_id,
    np.picture_url,
    np.name,
    np.headline,
    np."linkedinUrl",
    np."followerCount",
    COALESCE(SUM(cm.comment_count) FILTER (
      WHERE cm.target_id = np.profile_id 
        AND cm.commenter_id IN (SELECT profile_id FROM seed_creators)
    ), 0) AS commentsReceived,
    COALESCE(SUM(cm.comment_count) FILTER (
      WHERE cm.commenter_id = np.profile_id 
        AND cm.target_id IN (SELECT profile_id FROM seed_creators)
    ), 0) AS commentsMade
  FROM network_profiles np
  LEFT JOIN comments_map cm 
    ON cm.commenter_id = np.profile_id OR cm.target_id = np.profile_id
  WHERE np.profile_id NOT IN (SELECT profile_id FROM seed_creators)
  GROUP BY np.profile_id, np.picture_url, np.name, np.headline, np."linkedinUrl", np."followerCount"
),

-- ✅ Seed stats (seed ↔ seed)
seed_creators_stats AS (
  SELECT 
    np.profile_id,
    np.picture_url,
    np.name,
    np.headline,
    np."linkedinUrl",
    np."followerCount",
    COALESCE(SUM(scm.comment_count) FILTER (WHERE scm.commenter_id = np.profile_id), 0) AS CommentsMade,
    COALESCE(SUM(scm.comment_count) FILTER (WHERE scm.target_id = np.profile_id), 0) AS CommentsReceived
  FROM network_profiles np
  LEFT JOIN seed_comments_map scm
    ON scm.commenter_id = np.profile_id OR scm.target_id = np.profile_id
  WHERE np.profile_id IN (SELECT profile_id FROM seed_creators)
  GROUP BY np.profile_id, np.picture_url, np.name, np.headline, np."linkedinUrl", np."followerCount"
),

-- ✅ Profile ↔ seed relationships
profile_relationships AS (
  SELECT
    p.profile_id AS prof_id,
    jsonb_agg(
      jsonb_build_object(
        'profile_id', np.profile_id,
        'name', np.name,
        'picture_url', np.picture_url,
        'commentsFromProfile', cm.comment_count
      ) ORDER BY cm.comment_count DESC
    ) FILTER (WHERE cm.commenter_id = p.profile_id AND cm.target_id IN (SELECT profile_id FROM seed_creators)) AS profile_comments,
    jsonb_agg(
      jsonb_build_object(
        'profile_id', np.profile_id,
        'name', np.name,
        'picture_url', np.picture_url,
        'commentsToProfile', cm.comment_count
      ) ORDER BY cm.comment_count DESC
    ) FILTER (WHERE cm.target_id = p.profile_id AND cm.commenter_id IN (SELECT profile_id FROM seed_creators)) AS profile_commenters
  FROM profile_stats p
  LEFT JOIN comments_map cm
    ON cm.commenter_id = p.profile_id OR cm.target_id = p.profile_id
  LEFT JOIN network_profiles np
    ON np.profile_id = CASE 
                         WHEN cm.commenter_id = p.profile_id THEN cm.target_id
                         ELSE cm.commenter_id
                       END
  GROUP BY p.profile_id
),

-- ✅ Seed ↔ seed relationships
seed_relationships AS (
  SELECT
    s.profile_id AS seed_id,
    jsonb_agg(
      jsonb_build_object(
        'profile_id', np.profile_id,
        'name', np.name,
        'picture_url', np.picture_url,
        'commentsFromSeed', scm.comment_count
      ) ORDER BY scm.comment_count DESC
    ) FILTER (WHERE scm.commenter_id = s.profile_id) AS seed_comments,
    jsonb_agg(
      jsonb_build_object(
        'profile_id', np.profile_id,
        'name', np.name,
        'picture_url', np.picture_url,
        'commentsToSeed', scm.comment_count
      ) ORDER BY scm.comment_count DESC
    ) FILTER (WHERE scm.target_id = s.profile_id) AS seed_commenters
  FROM seed_creators_stats s
  LEFT JOIN seed_comments_map scm
    ON scm.commenter_id = s.profile_id OR scm.target_id = s.profile_id
  LEFT JOIN network_profiles np
    ON np.profile_id = CASE 
                         WHEN scm.commenter_id = s.profile_id THEN scm.target_id
                         ELSE scm.commenter_id
                       END
  GROUP BY s.profile_id
)

SELECT jsonb_build_object(
  'network_id', $1,
  'profiles', (
    SELECT COALESCE(jsonb_agg(profile_obj ORDER BY (profile_obj->>'totalComments')::int DESC), '[]'::jsonb)
    FROM (
      SELECT jsonb_build_object(
         'profile_id', ps.profile_id,
         'picture_url', ps.picture_url,
         'name', ps.name,
         'headline', ps.headline,
         'linkedin_url', ps."linkedinUrl",
         'followers', ps."followerCount",
         'commentsTo', ps.commentsReceived,
         'commentsFrom', ps.commentsMade,
         'totalComments', (ps.commentsReceived + ps.commentsMade),
         'profile_comments', (
            SELECT jsonb_agg(x)
            FROM (
              SELECT x
              FROM jsonb_array_elements(pr.profile_comments) AS x
              ORDER BY (x->>'commentsFromProfile')::int DESC
              LIMIT 5
            ) sub
         ),
         'profile_commenters', (
            SELECT jsonb_agg(x)
            FROM (
              SELECT x
              FROM jsonb_array_elements(pr.profile_commenters) AS x
              ORDER BY (x->>'commentsToProfile')::int DESC
              LIMIT 5
            ) sub
         )
       ) AS profile_obj
      FROM profile_stats ps
      LEFT JOIN profile_relationships pr ON pr.prof_id = ps.profile_id
    ) t
  ),
  'seed_creators', (
    SELECT COALESCE(jsonb_agg(seed_obj ORDER BY (seed_obj->>'totalComments')::int DESC), '[]'::jsonb)
    FROM (
      SELECT jsonb_build_object(
         'profile_id', sc.profile_id,
         'picture_url', sc.picture_url,
         'name', sc.name,
         'headline', sc.headline,
         'linkedin_url', sc."linkedinUrl",
         'followers', sc."followerCount",
         'CommentsMade', sc.CommentsMade,
         'CommentsReceived', sc.CommentsReceived,
         'totalComments', (sc.CommentsMade + sc.CommentsReceived),
         'seed_comments', (
            SELECT jsonb_agg(x)
            FROM (
              SELECT x
              FROM jsonb_array_elements(sr.seed_comments) AS x
              ORDER BY (x->>'commentsFromSeed')::int DESC
              LIMIT 5
            ) sub
         ),
         'seed_commenters', (
            SELECT jsonb_agg(x)
            FROM (
              SELECT x
              FROM jsonb_array_elements(sr.seed_commenters) AS x
              ORDER BY (x->>'commentsToSeed')::int DESC
              LIMIT 5
            ) sub
         )
       ) AS seed_obj
      FROM seed_creators_stats sc
      LEFT JOIN seed_relationships sr ON sr.seed_id = sc.profile_id
    ) t
  )
);

