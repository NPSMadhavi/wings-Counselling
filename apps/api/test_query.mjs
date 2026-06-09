import { db } from './src/config/db.js';

try {
  const [rows] = await db.execute(`
    SELECT
      ja.id,
      ja.application_number  AS applicationNumber,
      ja.job_id              AS jobId,
      ja.candidate_id        AS userId,
      ja.cover_letter        AS coverLetter,
      ja.resume_url          AS resumePath,
      ja.status,
      ja.admin_notes         AS adminRemarks,
      NULL                   AS internalRemarks,
      ja.submitted_at        AS createdAt,
      CONCAT(c.first_name, ' ', c.last_name) AS applicantName,
      c.email                AS applicantEmail,
      COALESCE(jp.title, ca.title, '') AS jobTitle,
      COALESCE(jp.job_id, ca.job_id, '') AS jobIdCode,
      COALESCE(jp.category_id, 0) AS categoryId,
      COALESCE(jc.name, '') AS categoryName
    FROM job_applications ja
    LEFT JOIN candidates c ON c.id = ja.candidate_id
    LEFT JOIN careers ca ON ca.id = ja.job_id
    LEFT JOIN job_postings jp ON jp.job_id = ca.job_id
    LEFT JOIN job_categories jc ON jc.id = jp.category_id
    ORDER BY ja.submitted_at DESC
  `);
  console.log('SUCCESS, rows:', rows.length);
  if (rows.length > 0) console.log('Sample:', JSON.stringify(rows[0], null, 2));
} catch (err) {
  console.error('SQL ERROR:', err.message);
  console.error('SQL:', err.sql);
}
process.exit(0);
