/** Academy content: 5 modules × 6 chapters = 30 lectures
 *  videoUrl stores ONLY the YouTube video ID (11 chars) — never full URLs.
 */

const VERIFIED_VIDEOS = {
  SQL_INTRO: 'HXV3zeQKqGY',
  MOSH_SQL: '7S_tz1z_5bA',
  SELECT_WHERE: 'nS9n_Yj_P94',
  JOINS: '9yeOJ0ZMUYw',
  GROUP_BY: '0rB_P_shM8Y',
  SUBQUERIES: '31rjXf6Y8ek',
  INDEXING: '7S_tz1z_5bA',
  AGGREGATES: '0rB_P_shM8Y',
  TRANSACTIONS: 'HXV3zeQKqGY',
  DATA_CLEANING: '8rO7zkBnGkY',
  POSTGRESQL: 'qw--VYLpxG4',
  DB_DESIGN: 'K6w0_6v06vA',
};

const MODULES = [
  {
    id: 'module-1-fundamentals',
    title: 'Module 1: SQL Fundamentals',
    description: 'Core relational concepts, SELECT projections, filtering, and operators.',
    chapters: [
      { title: 'Introduction to SQL & Relational Databases', videoUrl: VERIFIED_VIDEOS.SQL_INTRO, practiceSql: 'SELECT 1 AS hello_sql;' },
      { title: 'SQL for Beginners — Core Syntax', videoUrl: VERIFIED_VIDEOS.MOSH_SQL, practiceSql: 'SELECT first_name, last_name, email FROM users;' },
      { title: 'SELECT Statements & Column Projection', videoUrl: VERIFIED_VIDEOS.SELECT_WHERE, practiceSql: 'SELECT id, name, email FROM users LIMIT 10;' },
      { title: 'WHERE Clauses & Predicate Filtering', videoUrl: VERIFIED_VIDEOS.SELECT_WHERE, practiceSql: "SELECT * FROM orders WHERE status = 'pending';" },
      { title: 'Database Design Fundamentals', videoUrl: VERIFIED_VIDEOS.DB_DESIGN, practiceSql: 'SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id;' },
      { title: 'Comparison, ORDER BY & LIMIT', videoUrl: VERIFIED_VIDEOS.MOSH_SQL, practiceSql: 'SELECT * FROM products WHERE price > 50 ORDER BY price DESC LIMIT 10;' },
    ],
  },
  {
    id: 'module-2-intermediate',
    title: 'Module 2: Intermediate SQL',
    description: 'Joins, aggregations, HAVING filters, and subquery patterns.',
    chapters: [
      { title: 'INNER JOIN & Relationship Modeling', videoUrl: VERIFIED_VIDEOS.JOINS, practiceSql: 'SELECT u.name, o.total FROM users u INNER JOIN orders o ON u.id = o.user_id;' },
      { title: 'LEFT, RIGHT & FULL Outer Joins', videoUrl: VERIFIED_VIDEOS.JOINS, practiceSql: 'SELECT u.name, o.id FROM users u LEFT JOIN orders o ON u.id = o.user_id;' },
      { title: 'GROUP BY & Aggregate Functions', videoUrl: VERIFIED_VIDEOS.GROUP_BY, practiceSql: 'SELECT category, COUNT(*) AS total FROM products GROUP BY category;' },
      { title: 'HAVING & Post-Aggregation Filters', videoUrl: VERIFIED_VIDEOS.GROUP_BY, practiceSql: 'SELECT user_id, SUM(total) AS spend FROM orders GROUP BY user_id HAVING SUM(total) > 500;' },
      { title: 'Scalar & Correlated Subqueries', videoUrl: VERIFIED_VIDEOS.SUBQUERIES, practiceSql: "SELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE country = 'US');" },
      { title: 'Data Cleaning with SQL', videoUrl: VERIFIED_VIDEOS.DATA_CLEANING, practiceSql: "SELECT TRIM(name), LOWER(email) FROM users WHERE email IS NOT NULL;" },
    ],
  },
  {
    id: 'module-3-advanced',
    title: 'Module 3: Advanced SQL',
    description: 'Indexing strategies, transactional integrity, and window analytics.',
    chapters: [
      { title: 'B-Tree Indexes & Seek Patterns', videoUrl: VERIFIED_VIDEOS.INDEXING, practiceSql: "EXPLAIN SELECT * FROM users WHERE email = 'admin@example.com';" },
      { title: 'Composite Indexes & Query Optimization', videoUrl: VERIFIED_VIDEOS.INDEXING, practiceSql: 'CREATE INDEX idx_orders_user_status ON orders(user_id, status);' },
      { title: 'ACID Transactions & Isolation', videoUrl: VERIFIED_VIDEOS.TRANSACTIONS, practiceSql: 'BEGIN; UPDATE accounts SET balance = balance - 100 WHERE id = 1; COMMIT;' },
      { title: 'Aggregate Functions Deep Dive', videoUrl: VERIFIED_VIDEOS.AGGREGATES, practiceSql: 'SELECT user_id, AVG(total), MAX(total) FROM orders GROUP BY user_id;' },
      { title: 'Window Functions & Analytics', videoUrl: VERIFIED_VIDEOS.MOSH_SQL, practiceSql: 'SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn FROM orders;' },
      { title: 'Query Refactoring & Anti-Patterns', videoUrl: VERIFIED_VIDEOS.SUBQUERIES, practiceSql: 'SELECT u.id FROM users u WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);' },
    ],
  },
  {
    id: 'module-4-postgresql',
    title: 'Module 4: PostgreSQL Mastery',
    description: 'Vacuum mechanics, MVCC internals, and EXPLAIN plan literacy.',
    chapters: [
      { title: 'PostgreSQL Architecture Overview', videoUrl: VERIFIED_VIDEOS.POSTGRESQL, practiceSql: 'SELECT version();' },
      { title: 'MVCC & Tuple Visibility', videoUrl: VERIFIED_VIDEOS.POSTGRESQL, practiceSql: 'SELECT xmin, xmax, * FROM users LIMIT 5;' },
      { title: 'Reading EXPLAIN Plans', videoUrl: VERIFIED_VIDEOS.POSTGRESQL, practiceSql: "EXPLAIN (FORMAT JSON) SELECT * FROM orders WHERE status = 'shipped';" },
      { title: 'EXPLAIN ANALYZE & Runtime Stats', videoUrl: VERIFIED_VIDEOS.INDEXING, practiceSql: 'EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM orders WHERE user_id = 1;' },
      { title: 'Indexes & Performance Tuning', videoUrl: VERIFIED_VIDEOS.INDEXING, practiceSql: 'EXPLAIN SELECT * FROM orders WHERE id = 42;' },
      { title: 'Statistics, ANALYZE & Planner Tuning', videoUrl: VERIFIED_VIDEOS.INDEXING, practiceSql: "ANALYZE orders; EXPLAIN SELECT * FROM orders WHERE status = 'pending';" },
    ],
  },
  {
    id: 'module-5-autotune',
    title: 'Module 5: AutoTune Mastery',
    description: 'Production optimization workflows with the AutoTune-SQL engine.',
    chapters: [
      { title: 'AutoTune Optimizer Architecture', videoUrl: VERIFIED_VIDEOS.SQL_INTRO, practiceSql: 'SELECT * FROM users u JOIN orders o ON u.id = o.user_id;' },
      { title: 'ML Risk Scoring & Slowness Prediction', videoUrl: VERIFIED_VIDEOS.INDEXING, practiceSql: "EXPLAIN ANALYZE SELECT * FROM orders WHERE created_at > NOW() - INTERVAL '30 days';" },
      { title: 'AI Query Rewriting Fundamentals', videoUrl: VERIFIED_VIDEOS.DATA_CLEANING, practiceSql: 'SELECT DISTINCT user_id FROM orders WHERE total > 100;' },
      { title: 'Schema Error vs Syntax Classification', videoUrl: VERIFIED_VIDEOS.DATA_CLEANING, practiceSql: 'SELECT name FROM users WHERE active = true;' },
      { title: 'Production Read-Only Guardrails', videoUrl: VERIFIED_VIDEOS.DB_DESIGN, practiceSql: 'SELECT id, email FROM users LIMIT 100;' },
      { title: 'Certification Capstone & Best Practices', videoUrl: VERIFIED_VIDEOS.POSTGRESQL, practiceSql: 'WITH ranked AS (SELECT *, ROW_NUMBER() OVER (ORDER BY total DESC) rn FROM orders) SELECT * FROM ranked WHERE rn <= 5;' },
    ],
  },
];

function buildSummary(moduleTitle, chapterTitle) {
  return `# ${chapterTitle}

> **AI Summary** · Generated by AutoTune-AI

## Engineering Overview

This lecture situates **${chapterTitle}** within the ${moduleTitle} learning track. You will develop production-grade mental models for how PostgreSQL parses, plans, and executes the patterns demonstrated in the accompanying video.

## Key Concepts

- **Relational algebra mapping** — how declarative SQL compiles into scan/join/aggregate operators
- **Predicate selectivity** — why filter placement materially affects cardinality estimates
- **Execution-plan awareness** — reading operator costs before deploying to production
- **Idempotent read patterns** — safe analytical queries for observability workloads

## Production Tips

1. Always validate row counts with \`LIMIT\` during exploratory analysis
2. Prefer sargable predicates (avoid wrapping indexed columns in functions)
3. Capture \`EXPLAIN (ANALYZE, BUFFERS)\` when promoting query changes
4. Treat missing schema objects as **Schema Errors**, not syntax failures

## Lab Exercise

Use the **Practice Lab** below to execute the canonical query from this lecture. Mark the exercise complete after verifying results.
`;
}

function buildQuizQuestions(chapterTitle, moduleTitle) {
  const templates = [
    { q: `In "${chapterTitle}", what is the primary learning objective?`, opts: ['Master the core SQL pattern taught in this lecture', 'Learn NoSQL document modeling', 'Configure Kubernetes pods', 'Write frontend React hooks'], ans: 0 },
    { q: `Which clause is most associated with filtering rows before aggregation in ${moduleTitle}?`, opts: ['WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT'], ans: 0 },
    { q: `A production EXPLAIN plan primarily helps engineers understand:`, opts: ['Operator tree and cost estimates', 'CSS layout', 'JWT signing', 'DNS propagation'], ans: 0 },
    { q: `Which join returns all rows from the left table plus matches from the right?`, opts: ['LEFT JOIN', 'INNER JOIN', 'CROSS JOIN', 'SELF JOIN'], ans: 0 },
    { q: `HAVING differs from WHERE because it filters:`, opts: ['Grouped results after aggregation', 'Rows before aggregation', 'Indexes only', 'Sequences'], ans: 0 },
    { q: `In PostgreSQL, MVCC primarily enables:`, opts: ['Concurrent reads without blocking writers', 'Automatic index creation', 'Schema-less storage', 'GPU acceleration'], ans: 0 },
    { q: `Which error category applies when table "orders" does not exist?`, opts: ['Schema Error (42P01)', 'Syntax Error only', 'Network timeout', 'OAuth failure'], ans: 0 },
    { q: `A covering index is valuable because it can:`, opts: ['Satisfy queries from the index without heap access', 'Delete tables faster', 'Disable WAL', 'Remove the need for statistics'], ans: 0 },
    { q: `EXPLAIN ANALYZE compared to EXPLAIN:`, opts: ['Executes the query and records actual timings', 'Only parses SQL text', 'Creates backups', 'Vacuums tables'], ans: 0 },
    { q: `AutoTune-SQL ML Risk Score predicts:`, opts: ['Probability of slow execution', 'GitHub stars', 'Certificate expiry', 'Email bounce rate'], ans: 0 },
    { q: `Which statement is read-only safe for the optimizer lab?`, opts: ['SELECT with optional WITH/EXPLAIN', 'DROP TABLE', 'DELETE without WHERE', 'TRUNCATE'], ans: 0 },
    { q: `CTE (WITH clause) improves readability by:`, opts: ['Naming intermediate result sets', 'Bypassing the planner', 'Disabling indexes', 'Forcing seq scans'], ans: 0 },
    { q: `To pass a chapter quiz in AutoTune Academy you need:`, opts: ['≥ 80% score', '50% score', 'Admin approval only', 'No quiz required'], ans: 0 },
    { q: `Window functions require which clause for partitioning?`, opts: ['OVER (...)', 'GROUP BY only', 'HAVING', 'RETURNING'], ans: 0 },
    { q: `VACUUM in PostgreSQL helps reclaim:`, opts: ['Dead tuple space and reduce bloat', 'CPU cores', 'SSL certificates', 'API tokens'], ans: 0 },
    { q: `A correlated subquery executes:`, opts: ['Once per outer row (conceptually)', 'Never', 'Only at COMMIT', 'Only on replicas'], ans: 0 },
    { q: `Selectivity estimation errors often cause:`, opts: ['Suboptimal join order and mischosen indexes', 'Faster queries always', 'Schema deletion', 'Connection pooling'], ans: 0 },
    { q: `DISTINCT removes:`, opts: ['Duplicate rows in the result set', 'All NULLs automatically', 'Indexes', 'Foreign keys'], ans: 0 },
    { q: `For "${chapterTitle}", the best next step after watching is:`, opts: ['Complete the practice lab and quiz', 'Skip to certificate', 'Drop production tables', 'Disable auth'], ans: 0 },
    { q: `Certificate unlock requires completing how many chapters?`, opts: ['All 30 chapters with ≥80% quiz scores', '1 chapter', '5 chapters', 'No chapters'], ans: 0 },
  ];

  return templates.map((t, i) => ({
    id: i + 1,
    question: t.q,
    options: t.opts,
    correctAnswer: t.ans,
  }));
}

function normalizeVideoId(value) {
  if (!value || typeof value !== 'string') return value;
  const trimmed = value.trim();

  const urlMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (urlMatch) return urlMatch[1];

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  return trimmed;
}

function getAllChaptersFlat() {
  const flat = [];
  let globalOrder = 1;
  for (const mod of MODULES) {
    mod.chapters.forEach((ch, idx) => {
      flat.push({
        moduleId: mod.id,
        moduleTitle: mod.title,
        order: idx + 1,
        globalOrder: globalOrder++,
        title: ch.title,
        videoUrl: normalizeVideoId(ch.videoUrl),
        practiceSql: ch.practiceSql,
        content: buildSummary(mod.title, ch.title),
        quizQuestions: buildQuizQuestions(ch.title, mod.title),
      });
    });
  }
  return flat;
}

module.exports = { MODULES, VERIFIED_VIDEOS, getAllChaptersFlat, buildQuizQuestions, buildSummary, normalizeVideoId };
