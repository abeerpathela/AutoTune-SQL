/**
 * Video chapter quizzes — unique 10 MCQs each (correct answer stored at index 0).
 */
const VIDEO_QUIZZES = {
  'module-2': [
    { q: 'WHERE clause filters rows:', opts: ['Before projection in the logical order', 'After GROUP BY only', 'During PDF export', 'Never'], ans: 0 },
    { q: 'AND operator requires:', opts: ['All conditions true', 'Any condition true', 'No conditions', 'Sort order'], ans: 0 },
    { q: 'ORDER BY default direction is:', opts: ['ASC', 'DESC', 'RANDOM', 'NULLS ONLY'], ans: 0 },
    { q: 'LIMIT is useful for:', opts: ['Previewing large result sets safely', 'Deleting rows', 'Creating indexes', 'Dropping tables'], ans: 0 },
    { q: 'Comparison with NULL should use:', opts: ['IS NULL / IS NOT NULL', '= NULL', '> NULL', 'LIKE NULL'], ans: 0 },
    { q: 'OR combines predicates with:', opts: ['Logical disjunction', 'Mandatory AND', 'Index rebuild', 'Certificate issue'], ans: 0 },
    { q: 'Filtering module focuses on:', opts: ['WHERE, ORDER BY, LIMIT patterns', 'Kubernetes pods', 'React hooks', 'OAuth flows'], ans: 0 },
    { q: 'Selectivity means:', opts: ['Fraction of rows matching a predicate', 'Video length', 'Quiz attempts', 'Email domain'], ans: 0 },
    { q: 'Sargable predicates:', opts: ['Allow index use on columns', 'Always disable indexes', 'Require TRUNCATE', 'Skip WHERE'], ans: 0 },
    { q: 'After this video you should:', opts: ['Mark complete and continue theory chapters', 'Skip to certificate', 'Drop tables', 'Disable auth'], ans: 0 },
  ],
  'module-3': [
    { q: 'INNER JOIN returns:', opts: ['Rows matching on both sides', 'All left rows always', 'Cartesian product only', 'Schema metadata'], ans: 0 },
    { q: 'JOIN requires:', opts: ['ON or USING clause with relationship', 'No predicates', 'DROP TABLE', 'VACUUM FULL'], ans: 0 },
    { q: 'LEFT JOIN preserves:', opts: ['All rows from the left table', 'Only matched rows', 'Only right table', 'Indexes only'], ans: 0 },
    { q: 'Join fan-out occurs when:', opts: ['One parent matches many children', 'Using LIMIT 1', 'Selecting constants', 'Using DISTINCT'], ans: 0 },
    { q: 'Self join uses:', opts: ['Table aliases for same table', 'Two databases', 'No ON clause', 'Only CROSS JOIN'], ans: 0 },
    { q: 'Missing join condition causes:', opts: ['Cartesian product explosion', 'Faster queries always', 'Auto index creation', 'Certificate unlock'], ans: 0 },
    { q: 'Foreign keys help joins by:', opts: ['Enforcing referential relationships', 'Disabling WHERE', 'Removing NULLs', 'Creating PDFs'], ans: 0 },
    { q: 'Hash Join is chosen when:', opts: ['Planner estimates hash is cheaper', 'Always for 1 row', 'Never in PostgreSQL', 'Only for DDL'], ans: 0 },
    { q: 'Join module video covers:', opts: ['Visual explanation of join types', 'CSS flexbox', 'Git rebase', 'Docker compose'], ans: 0 },
    { q: 'Best practice after joins lecture:', opts: ['Validate row counts with LIMIT in labs', 'Skip practice', 'Delete users table', 'Ignore EXPLAIN'], ans: 0 },
  ],
  'module-4': [
    { q: 'GROUP BY creates:', opts: ['One output row per distinct group key', 'Duplicate rows', 'Indexes automatically', 'PDF certificates'], ans: 0 },
    { q: 'COUNT(*) counts:', opts: ['All rows in each group including NULLs', 'Only non-null columns in SELECT', 'Indexes only', 'Videos watched'], ans: 0 },
    { q: 'HAVING filters:', opts: ['Groups after aggregation', 'Rows before GROUP BY', 'Connection strings', 'OAuth tokens'], ans: 0 },
    { q: 'SUM() ignores:', opts: ['NULL values in the aggregated column', 'All numeric values', 'GROUP BY keys', 'ORDER BY'], ans: 0 },
    { q: 'AVG() computes:', opts: ['Mean of non-null values in group', 'Maximum only', 'Row width bytes', 'Video duration'], ans: 0 },
    { q: 'Non-aggregated SELECT columns must appear in:', opts: ['GROUP BY (in standard SQL)', 'HAVING only', 'LIMIT only', 'Nowhere'], ans: 0 },
    { q: 'ROLLUP provides:', opts: ['Subtotals and grand totals', 'Index-only scans only', 'Row deletion', 'Schema drops'], ans: 0 },
    { q: 'Window functions differ from GROUP BY because:', opts: ['They keep detail rows', 'They always delete rows', 'They skip ORDER BY', 'They disable auth'], ans: 0 },
    { q: 'Aggregation video prepares you for:', opts: ['Analytics queries on orders/products', 'HTML templating', 'SSH keys', 'Email SMTP'], ans: 0 },
    { q: 'Pass threshold for chapter quizzes:', opts: ['80%', '50%', '100%', 'No quiz required'], ans: 0 },
  ],
  'module-5': [
    { q: 'B-tree indexes accelerate:', opts: ['Equality and range lookups', 'Full table drops', 'Email sending', 'Video streaming'], ans: 0 },
    { q: 'Sequential scan reads:', opts: ['Entire heap pages for the table', 'Only index pages', 'Only WAL files', 'Only certificates'], ans: 0 },
    { q: 'EXPLAIN shows:', opts: ['Planner operator tree without executing (plain EXPLAIN)', 'User passwords', 'Git history', 'PDF bytes'], ans: 0 },
    { q: 'EXPLAIN ANALYZE:', opts: ['Executes query and records actual timings', 'Never runs SQL', 'Creates backups', 'Issues certificates'], ans: 0 },
    { q: 'Leading wildcard LIKE patterns:', opts: ['Often prevent index use', 'Always use indexes', 'Delete tables', 'Unlock all chapters'], ans: 0 },
    { q: 'Composite indexes help when:', opts: ['Predicates match leftmost columns', 'No WHERE clause exists', 'Using TRUNCATE', 'Disabling auth'], ans: 0 },
    { q: 'Query rewriting aims to:', opts: ['Make predicates sargable and reduce cost', 'Remove all indexes', 'Drop foreign keys', 'Skip EXPLAIN'], ans: 0 },
    { q: 'Production guardrails include:', opts: ['Timeouts and read-only replicas', 'Unlimited seq scans', 'Shared admin passwords', 'Skipping migrations'], ans: 0 },
    { q: 'Optimization module video topic:', opts: ['Indexes and performance tuning', 'React state', 'OAuth dance', 'CSS grids'], ans: 0 },
    { q: 'After optimization video:', opts: ['Complete lab and mark video done', 'Generate certificate immediately', 'Drop Chapter table', 'Skip theory'], ans: 0 },
  ],
};

module.exports = { VIDEO_QUIZZES };
