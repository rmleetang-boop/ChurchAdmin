INSERT INTO departments (branchId, name)
SELECT 1, requested.name
FROM (
  SELECT 'Finance' AS name
  UNION ALL
  SELECT 'Attendance' AS name
  UNION ALL
  SELECT 'Usher' AS name
  UNION ALL
  SELECT 'Cleaning' AS name
  UNION ALL
  SELECT 'Choir' AS name
  UNION ALL
  SELECT 'Charity' AS name
  UNION ALL
  SELECT 'Fundraising' AS name
  UNION ALL
  SELECT 'Youth' AS name
  UNION ALL
  SELECT 'Men' AS name
  UNION ALL
  SELECT 'Women' AS name
  UNION ALL
  SELECT 'Media' AS name
  UNION ALL
  SELECT 'Hospitality' AS name
  UNION ALL
  SELECT 'Intercessor' AS name
  UNION ALL
  SELECT 'Sunday School' AS name
  UNION ALL
  SELECT 'Moderation' AS name
) AS requested
WHERE NOT EXISTS (
  SELECT 1 FROM departments AS existing
  WHERE existing.branchId = 1 AND LOWER(TRIM(existing.name)) = LOWER(requested.name)
);
