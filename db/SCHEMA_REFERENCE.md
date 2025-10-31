# 📘 Database Schema Reference (Updated)

**Schema:** `prt93nehio7wd1d`  
**Last Updated:** October 31, 2025

---

## Overview

This database contains LinkedIn network analysis data with profiles, posts, comments, and user management tables. All tables are case-sensitive and reside in the `prt93nehio7wd1d` schema.

---

## 1. Users

Internal application users who manage profiles and networks.

**Row Count:** 6

### Columns

| Column          | Type      | Constraints                  | Description                         |
| --------------- | --------- | ---------------------------- | ----------------------------------- |
| `id`            | integer   | PK, NOT NULL, AUTO_INCREMENT | Primary key                         |
| `created_at`    | timestamp |                              | Creation timestamp                  |
| `updated_at`    | timestamp |                              | Last update timestamp               |
| `created_by`    | varchar   |                              | Creator identifier                  |
| `updated_by`    | varchar   |                              | Last updater identifier             |
| `nc_order`      | numeric   |                              | NocoDB ordering                     |
| `Name`          | text      |                              | User display name                   |
| `Description`   | text      |                              | User description                    |
| `apify_api_key` | text      |                              | Apify API key for LinkedIn scraping |

### Relationships

- One-to-many → `Profiles.Users_id`
- One-to-many → `CommentOpportunities.Users_id`
- One-to-many → `UserFollows.Users_id`

### Indexes

- `Users_pkey` (primary key)
- `Users_order_idx`

---

## 2. Profiles

Represents LinkedIn profiles (people).

**Row Count:** 1,584

### Columns

| Column                    | Type      | Constraints                  | Description                           |
| ------------------------- | --------- | ---------------------------- | ------------------------------------- |
| `id`                      | integer   | PK, NOT NULL, AUTO_INCREMENT | Primary key                           |
| `created_at`              | timestamp |                              | Creation timestamp                    |
| `updated_at`              | timestamp |                              | Last update timestamp                 |
| `created_by`              | varchar   |                              | Creator identifier                    |
| `updated_by`              | varchar   |                              | Last updater identifier               |
| `nc_order`                | numeric   |                              | NocoDB ordering                       |
| `publicIdentifier`        | text      | UNIQUE                       | LinkedIn public identifier (username) |
| `linkedinUrl`             | text      |                              | Full LinkedIn profile URL             |
| `firstName`               | text      |                              | First name                            |
| `lastName`                | text      |                              | Last name                             |
| `headline`                | text      |                              | Profile headline                      |
| `about`                   | text      |                              | About section                         |
| `openToWork`              | boolean   | DEFAULT false                | Open to work flag                     |
| `hiring`                  | boolean   | DEFAULT false                | Hiring flag                           |
| `photo`                   | text      |                              | Profile photo URL                     |
| `premium`                 | boolean   | DEFAULT false                | Premium member flag                   |
| `influencer`              | boolean   | DEFAULT false                | Influencer flag                       |
| `location`                | json      |                              | Location information                  |
| `verified`                | boolean   | DEFAULT false                | Verified account flag                 |
| `registeredAt`            | text      |                              | Registration date                     |
| `topSkills`               | text      |                              | Top skills (text format)              |
| `connectionsCount`        | bigint    |                              | Number of connections                 |
| `followerCount`           | bigint    |                              | Number of followers                   |
| `currentPosition`         | json      |                              | Current job position                  |
| `experience`              | json      |                              | Work experience array                 |
| `education`               | json      |                              | Education history                     |
| `certifications`          | json      |                              | Certifications                        |
| `projects`                | json      |                              | Projects                              |
| `volunteering`            | json      |                              | Volunteering experience               |
| `receivedRecommendations` | json      |                              | Recommendations received              |
| `skills`                  | json      |                              | Skills array                          |
| `publications`            | json      |                              | Publications                          |
| `courses`                 | json      |                              | Courses                               |
| `patents`                 | json      |                              | Patents                               |
| `honorsAndAwards`         | json      |                              | Honors and awards                     |
| `languages`               | json      |                              | Languages                             |
| `featured`                | json      |                              | Featured content                      |
| `composeOptionType`       | text      |                              | Compose option type                   |
| `moreProfiles`            | json      |                              | Additional profiles                   |
| `profileId`               | text      |                              | LinkedIn external profile ID          |
| `websites`                | json      |                              | Website URLs                          |
| `Users_id`                | integer   | UNIQUE                       | Foreign key → Users.id                |

### Relationships

- Many-to-one → `Users.id` (via `Users_id`)
- One-to-many → `Posts.Profiles_id`
- One-to-many → `Comments.Profiles_id`
- One-to-many → `UserFollows.Profiles_id`

### Indexes

- `Profiles_csv_pkey` (primary key)
- `Profiles_csv_order_idx`
- `Profiles_Users_id_key` (unique)
- `profiles_publicidentifier_unique` (unique)
- `fk_Users_Profiles_nvw9cniuw0`

### Notes

- `Users_id` has a UNIQUE constraint, meaning each profile is associated with exactly one user (one-to-one relationship)
- Many JSON fields store structured LinkedIn data

---

## 3. Posts

Represents LinkedIn posts.

**Row Count:** 1,528

### Columns

| Column              | Type      | Constraints                  | Description                    |
| ------------------- | --------- | ---------------------------- | ------------------------------ |
| `id`                | integer   | PK, NOT NULL, AUTO_INCREMENT | Primary key                    |
| `created_at`        | timestamp |                              | Creation timestamp             |
| `updated_at`        | timestamp |                              | Last update timestamp          |
| `created_by`        | varchar   |                              | Creator identifier             |
| `updated_by`        | varchar   |                              | Last updater identifier        |
| `nc_order`          | numeric   |                              | NocoDB ordering                |
| `linkedinUrl`       | text      |                              | Full LinkedIn post URL         |
| `content`           | text      |                              | Post content/text              |
| `contentAttributes` | json      |                              | Content attributes             |
| `postedAt`          | json      |                              | Posted timestamp (JSON format) |
| `postImages`        | json      |                              | Post images array              |
| `postVideo`         | json      |                              | Post video information         |
| `socialContent`     | json      |                              | Social content data            |
| `header`            | json      |                              | Header information             |
| `engagement`        | json      |                              | Engagement metrics             |
| `postId`            | text      | UNIQUE                       | LinkedIn external post ID      |
| `postedTime`        | timestamp |                              | Posted timestamp               |
| `likes`             | bigint    |                              | Number of likes                |
| `comments`          | bigint    |                              | Number of comments             |
| `shares`            | bigint    |                              | Number of shares               |
| `impressions`       | bigint    |                              | Number of impressions          |
| `author`            | text      |                              | Author identifier              |
| `reposter`          | text      |                              | Reposter identifier            |
| `isRepost`          | boolean   | DEFAULT false                | Is this a repost?              |
| `repostedBy`        | json      |                              | Reposted by information        |
| `Profiles_id`       | integer   |                              | Foreign key → Profiles.id      |
| `Thumbnail`         | text      |                              | Thumbnail image URL            |

### Relationships

- Many-to-one → `Profiles.id` (via `Profiles_id`)
- One-to-many → `Comments.Posts_id`
- One-to-many → `CommentOpportunities.Posts_id`

### Indexes

- `table_pkey` (primary key)
- `table_order_idx`
- `posts_postid_unique` (unique)
- `fk_Profiles_Posts_8g593pehjc`

---

## 4. Comments

Represents comments on posts.

**Row Count:** 3,321

### Columns

| Column          | Type      | Constraints                  | Description                           |
| --------------- | --------- | ---------------------------- | ------------------------------------- |
| `id`            | integer   | PK, NOT NULL, AUTO_INCREMENT | Primary key                           |
| `created_at`    | timestamp |                              | Creation timestamp                    |
| `updated_at`    | timestamp |                              | Last update timestamp                 |
| `created_by`    | varchar   |                              | Creator identifier                    |
| `updated_by`    | varchar   |                              | Last updater identifier               |
| `nc_order`      | numeric   |                              | NocoDB ordering                       |
| `linkedinUrl`   | text      |                              | Full LinkedIn comment URL             |
| `commentary`    | text      |                              | Comment text/content                  |
| `createdAt`     | text      |                              | Creation date (text format)           |
| `createdAtTime` | timestamp |                              | Creation timestamp                    |
| `likes`         | bigint    |                              | Number of likes                       |
| `comments`      | bigint    |                              | Number of replies                     |
| `shares`        | bigint    |                              | Number of shares                      |
| `impressions`   | bigint    |                              | Number of impressions                 |
| `reactions`     | json      |                              | Reactions data                        |
| `postId`        | text      |                              | LinkedIn external post ID (duplicate) |
| `contributed`   | boolean   | DEFAULT false                | User contributed flag                 |
| `edited`        | boolean   | DEFAULT false                | Comment was edited flag               |
| `commentId`     | text      | UNIQUE                       | LinkedIn external comment ID          |
| `Posts_id`      | integer   |                              | Foreign key → Posts.id                |
| `Profiles_id`   | integer   |                              | Foreign key → Profiles.id             |
| `author`        | text      |                              | Author identifier                     |

### Relationships

- Many-to-one → `Posts.id` (via `Posts_id`)
- Many-to-one → `Profiles.id` (via `Profiles_id`)

### Indexes

- `table_pkey1` (primary key)
- `comment_id_unique` (unique)
- `fk_Posts_Comments_ynnneyltta`
- `fk_Profiles_Comments_yzwvw3218h`

---

## 5. CommentOpportunities

Represents opportunities for internal users to engage with posts.

**Row Count:** 102

### Columns

| Column       | Type             | Constraints                  | Description               |
| ------------ | ---------------- | ---------------------------- | ------------------------- |
| `id`         | integer          | PK, NOT NULL, AUTO_INCREMENT | Primary key               |
| `created_at` | timestamp        |                              | Creation timestamp        |
| `updated_at` | timestamp        |                              | Last update timestamp     |
| `created_by` | varchar          |                              | Creator identifier        |
| `updated_by` | varchar          |                              | Last updater identifier   |
| `nc_order`   | numeric          |                              | NocoDB ordering           |
| `Content`    | text             |                              | Post content summary      |
| `URL`        | text             |                              | Post URL                  |
| `TLDR`       | text             |                              | TLDR summary              |
| `Uniqueness` | double precision |                              | Uniqueness score          |
| `Relevance`  | double precision |                              | Relevance score           |
| `PostedTime` | timestamp        |                              | Post timestamp            |
| `Posts_id`   | integer          | UNIQUE                       | Foreign key → Posts.id    |
| `PostID`     | text             | UNIQUE                       | LinkedIn external post ID |
| `Users_id`   | integer          |                              | Foreign key → Users.id    |

### Relationships

- Many-to-one → `Posts.id` (via `Posts_id`, UNIQUE - one-to-one)
- Many-to-one → `Users.id` (via `Users_id`)

### Indexes

- `CommentOpportunities_pkey` (primary key)
- `CommentOpportunities_order_idx`
- `CommentOpportunities_Posts_id_key` (unique)
- `comment_opportunity_id_unique` (unique)
- `fk_Users_CommentOpp_ycj8scx3a1`
- `fk_Posts_CommentOpp_wrtdxyd0mt`

### Notes

- `Posts_id` is UNIQUE, meaning each post can have only one comment opportunity per user

---

## 6. UserFollows

Represents LinkedIn accounts followed by an internal user.

**Row Count:** 106

### Columns

| Column            | Type      | Constraints                  | Description                |
| ----------------- | --------- | ---------------------------- | -------------------------- |
| `id`              | integer   | PK, NOT NULL, AUTO_INCREMENT | Primary key                |
| `created_at`      | timestamp |                              | Creation timestamp         |
| `updated_at`      | timestamp |                              | Last update timestamp      |
| `created_by`      | varchar   |                              | Creator identifier         |
| `updated_by`      | varchar   |                              | Last updater identifier    |
| `nc_order`        | numeric   |                              | NocoDB ordering            |
| `Name`            | text      |                              | Profile name               |
| `LinkedIn`        | text      | UNIQUE                       | LinkedIn URL or identifier |
| `Users_id`        | integer   |                              | Foreign key → Users.id     |
| `Follow_Posts`    | boolean   | DEFAULT false                | Follow posts flag          |
| `Follow_Comments` | boolean   | DEFAULT false                | Follow comments flag       |
| `Profiles_id`     | integer   |                              | Foreign key → Profiles.id  |

### Relationships

- Many-to-one → `Users.id` (via `Users_id`)
- Many-to-one → `Profiles.id` (via `Profiles_id`)

### Indexes

- `UserFollowing_pkey` (primary key)
- `UserFollowing_order_idx`
- `user_follows_linkedin_unique` (unique)
- `fk_Users_UserFollow_w_8yb3_lj9`
- `fk_Profiles_UserFollow___phekeok6`

---

## 7. UserNetworks

Represents logical groupings of networked profiles for each user.

**Row Count:** 8

### Columns

| Column       | Type      | Constraints                  | Description                    |
| ------------ | --------- | ---------------------------- | ------------------------------ |
| `id`         | integer   | PK, NOT NULL, AUTO_INCREMENT | Primary key                    |
| `created_at` | timestamp |                              | Creation timestamp             |
| `updated_at` | timestamp |                              | Last update timestamp          |
| `created_by` | varchar   |                              | Creator identifier             |
| `updated_by` | varchar   |                              | Last updater identifier        |
| `nc_order`   | numeric   |                              | NocoDB ordering                |
| `User_ID`    | text      |                              | User identifier (text, not FK) |
| `Name`       | text      |                              | Network name/title             |

### Relationships

- One-to-many → `UserNetworkProfiles.UserNetworkID`

### Indexes

- `UserNetworks_pkey` (primary key)
- `UserNetworks_order_idx`

### Notes

- `User_ID` is stored as text, not a foreign key to `Users.id`

---

## 8. UserNetworkProfiles

Junction table linking networks to profiles.

**Row Count:** 1,764

### Columns

| Column          | Type      | Constraints                  | Description                       |
| --------------- | --------- | ---------------------------- | --------------------------------- |
| `id`            | integer   | PK, NOT NULL, AUTO_INCREMENT | Primary key                       |
| `created_at`    | timestamp |                              | Creation timestamp                |
| `updated_at`    | timestamp |                              | Last update timestamp             |
| `created_by`    | varchar   |                              | Creator identifier                |
| `updated_by`    | varchar   |                              | Last updater identifier           |
| `nc_order`      | numeric   |                              | NocoDB ordering                   |
| `UserNetworkID` | text      | UNIQUE                       | Network identifier (text, not FK) |
| `Username`      | text      | UNIQUE                       | Profile username/publicIdentifier |
| `Selected`      | boolean   | DEFAULT false                | Selected flag                     |
| `Exploded`      | boolean   | DEFAULT false                | Exploded/expanded flag            |

### Relationships

- Many-to-one → `UserNetworks.id` (via `UserNetworkID`, implicit)
- Implicit join → `Profiles.publicIdentifier` = `UserNetworkProfiles.Username`

### Indexes

- `UserNetworkProfiles_pkey` (primary key)
- `UserNetworkProfiles_order_idx`
- `username_network_unique` (unique constraint on UserNetworkID + Username)

### Notes

- `UserNetworkID` and `Username` each have UNIQUE constraints separately
- The relationship to `Profiles` is implicit via `Username` matching `Profiles.publicIdentifier`
- The relationship to `UserNetworks` is implicit via `UserNetworkID`

---

## 9. ProfileScoresTable

Materialized/aggregate table representing scoring/analytics for profiles.

**Row Count:** 97

### Columns

| Column               | Type    | Constraints  | Description                  |
| -------------------- | ------- | ------------ | ---------------------------- |
| `id`                 | bigint  | PK, NOT NULL | Primary key                  |
| `profile_id`         | integer |              | Profile ID (not a formal FK) |
| `firstName`          | text    |              | First name (denormalized)    |
| `lastName`           | text    |              | Last name (denormalized)     |
| `linkedinUrl`        | text    |              | LinkedIn URL (denormalized)  |
| `followerCount`      | bigint  |              | Follower count               |
| `post_count`         | bigint  |              | Number of posts              |
| `total_comments`     | bigint  |              | Total comments               |
| `commenter_profiles` | ARRAY   |              | Array of profile IDs         |
| `influencer_overlap` | bigint  |              | Influencer overlap metric    |
| `profile_score`      | bigint  |              | Overall profile score        |

### Relationships

- Implicit reference → `Profiles.id` (via `profile_id`)

### Indexes

- `ProfileScoresTable_pkey` (primary key)

### Notes

- This appears to be a computed/denormalized materialized table
- No formal foreign key constraints
- `commenter_profiles` is an array type storing profile IDs
- Data is likely refreshed periodically via a refresh job

---

## 🔗 Relationships Summary (ERD)

### Direct Relationships

1. **Users → Profiles**

   - `Users.id` → `Profiles.Users_id` (one-to-one, UNIQUE on Profiles side)

2. **Users → CommentOpportunities**

   - `Users.id` → `CommentOpportunities.Users_id` (one-to-many)

3. **Users → UserFollows**

   - `Users.id` → `UserFollows.Users_id` (one-to-many)

4. **Profiles → Posts**

   - `Profiles.id` → `Posts.Profiles_id` (one-to-many)

5. **Profiles → Comments**

   - `Profiles.id` → `Comments.Profiles_id` (one-to-many)

6. **Profiles → UserFollows**

   - `Profiles.id` → `UserFollows.Profiles_id` (one-to-many)

7. **Posts → Comments**

   - `Posts.id` → `Comments.Posts_id` (one-to-many)

8. **Posts → CommentOpportunities**

   - `Posts.id` → `CommentOpportunities.Posts_id` (one-to-one, UNIQUE on CommentOpportunities side)

9. **UserNetworks → UserNetworkProfiles**
   - `UserNetworks.id` → `UserNetworkProfiles.UserNetworkID` (implicit, one-to-many)

### Implicit/Logical Relationships

10. **Profiles ↔ UserNetworkProfiles**

    - `Profiles.publicIdentifier` = `UserNetworkProfiles.Username` (many-to-many via junction table)

11. **Profiles ↔ ProfileScoresTable**
    - `Profiles.id` = `ProfileScoresTable.profile_id` (one-to-one, computed)

---

## 📝 Important Notes

1. **Case Sensitivity**: All table and column names are case-sensitive. Use double quotes when referencing: `"prt93nehio7wd1d"."Profiles"`

2. **NocoDB System Columns**: All tables include NocoDB-managed columns:

   - `created_at`, `updated_at`, `created_by`, `updated_by`, `nc_order`

3. **JSON Fields**: Many columns store structured data as JSON. When querying, use JSON operators:

   ```sql
   SELECT content->>'title' FROM "Profiles"
   ```

4. **Array Fields**: `ProfileScoresTable.commenter_profiles` is an array type. Use array operators:

   ```sql
   SELECT * FROM "ProfileScoresTable" WHERE 123 = ANY(commenter_profiles)
   ```

5. **Foreign Keys**: While logical relationships exist, there are **no formal foreign key constraints** in the database. Relationships are maintained at the application level.

6. **Unique Constraints**: Several columns have UNIQUE constraints preventing duplicates:
   - `Profiles.publicIdentifier`
   - `Profiles.Users_id`
   - `Posts.postId`
   - `Comments.commentId`
   - `CommentOpportunities.Posts_id`
   - `CommentOpportunities.PostID`
   - `UserFollows.LinkedIn`

---

## 🔍 Example Queries

### Get all profiles for a user

```sql
SELECT * FROM "prt93nehio7wd1d"."Profiles"
WHERE "Users_id" = 1;
```

### Get all posts with engagement metrics

```sql
SELECT p.*, pr."firstName", pr."lastName"
FROM "prt93nehio7wd1d"."Posts" p
JOIN "prt93nehio7wd1d"."Profiles" pr ON p."Profiles_id" = pr.id
ORDER BY p."postedTime" DESC;
```

### Get comment opportunities with relevance scores

```sql
SELECT co.*, p.content, p.likes, p.comments
FROM "prt93nehio7wd1d"."CommentOpportunities" co
JOIN "prt93nehio7wd1d"."Posts" p ON co."Posts_id" = p.id
WHERE co."Relevance" > 0.7
ORDER BY co."Relevance" DESC;
```

### Get network profiles for a user network

```sql
SELECT unp.*, p."firstName", p."lastName", p."headline"
FROM "prt93nehio7wd1d"."UserNetworkProfiles" unp
JOIN "prt93nehio7wd1d"."Profiles" p ON unp."Username" = p."publicIdentifier"
WHERE unp."UserNetworkID" = 'some-network-id';
```

---

**Schema Version:** 1.0  
**Database:** PostgreSQL (via Railway/NocoDB)  
**Last Validated:** October 31, 2025
