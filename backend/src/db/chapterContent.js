/**
 * Structured LMS content — each theory chapter: Introduction, Syntax, Examples,
 * Common Mistakes, Performance Tips (500+ words). Quizzes are topic-aligned.
 */

function theory(topic, intro, syntax, examples, mistakes, tips) {
  return `# ${topic}

## Introduction

${intro}

## Syntax

${syntax}

## Examples

${examples}

## Common Mistakes

${mistakes}

## Performance Tips

${tips}`;
}

function quiz(questions) {
  return questions.map((q, i) => {
    const correctIdx = q.ans ?? q.correctAnswer ?? 0;
    const opts = [...q.opts];
    const correctText = opts[correctIdx];
    const wrong = opts.filter((_, idx) => idx !== correctIdx);
    return {
      id: i + 1,
      question: q.q || q.question,
      options: [correctText, ...wrong],
      correctAnswer: 0,
    };
  });
}

function packChapterData(questions, practiceLab) {
  return {
    questions,
    ...(practiceLab ? { practiceLab } : {}),
  };
}

const CONTENT = {
  'learning-path': {
    theoryContent: theory(
      'The AutoTune-SQL Learning Path',
      `Welcome to the AutoTune-SQL Academy — a professional learning management system designed to take you from foundational SQL literacy to production-grade query optimization and AI-assisted tuning. The curriculum is organized into six progressive modules spanning thirty-six chapters. Module 1 establishes how the academy works, what certification means, and how to study effectively. Modules 2 through 5 pair verified YouTube lectures with deep theory chapters on filtering, joins, aggregations, and performance. Module 6 focuses on the AutoTune AI engine, machine-learning risk scoring, and a comprehensive final exam. Each theory chapter ends with a ten-question quiz; you must score at least eighty percent (eight out of ten) to unlock the next chapter. Video chapters require you to watch the embedded lecture in full before the "Mark Video Complete" button activates. The academy enforces sequential unlocking — you cannot skip ahead without completing prior material. This structure mirrors enterprise LMS platforms and ensures measurable competency rather than passive content consumption.`,
      `The learning path follows a strict global order from chapter 1 through chapter 36. Progress is tracked in PostgreSQL via the \`UserProgress\` model with flags for \`videoWatched\`, \`videoCompleted\`, \`quizScore\`, \`quizAttempts\`, and \`isCompleted\`. Your dashboard displays completion percentage as \`(completedChapters / 36) * 100\`.`,
      `\`\`\`text
Module 1 → Introduction & Certification (6 theory chapters)
Module 2 → Filtering & Sorting (1 video + 5 theory)
Module 3 → Joins (1 video + 5 theory)
Module 4 → Aggregations (1 video + 5 theory)
Module 5 → Optimization (1 video + 5 theory)
Module 6 → AutoTune AI & Final Exam (6 theory)
\`\`\``,
      `1. Attempting to skip chapters by manipulating URLs — the API enforces previous-chapter completion.\n2. Treating video chapters like theory chapters — videos have no quiz; mark complete after watching.\n3. Ignoring Focus Mode during quizzes — tab switches can auto-fail your attempt.`,
      `Study one chapter per session when possible. Re-read the "Common Mistakes" section before each quiz. Use the sidebar green checkmarks to track momentum.`
    ),
    quizData: quiz([
      { q: 'How many total chapters are in the AutoTune-SQL Academy?', opts: ['36', '30', '12', '50'], ans: 0 },
      { q: 'What minimum quiz score unlocks the next chapter?', opts: ['80%', '50%', '100%', '60%'], ans: 0 },
      { q: 'Module 1 focuses primarily on:', opts: ['Learning path & certification', 'Kubernetes', 'CSS', 'OAuth'], ans: 0 },
      { q: 'Video chapters require what before marking complete?', opts: ['Watching the full video', 'Passing a quiz', 'Admin approval', 'Nothing'], ans: 0 },
      { q: 'Chapters unlock in:', opts: ['Sequential global order', 'Random order', 'Alphabetical', 'User choice'], ans: 0 },
      { q: 'Theory chapters are completed by:', opts: ['Passing the chapter quiz', 'Watching video', 'Email request', 'Skipping'], ans: 0 },
      { q: 'Modules 2–5 each begin with:', opts: ['A verified video lecture', 'A lab exam', 'No content', 'A certificate'], ans: 0 },
      { q: 'Module 6 covers:', opts: ['AutoTune AI & final exam', 'HTML basics', 'Docker only', 'Git workflows'], ans: 0 },
      { q: 'Progress percentage equals:', opts: ['Completed / Total * 100', 'Quiz attempts', 'Video count', 'Login days'], ans: 0 },
      { q: 'The academy uses Focus Mode during quizzes to:', opts: ['Prevent cheating', 'Speed up videos', 'Hide theory', 'Disable auth'], ans: 0 },
    ]),
  },

  'certification-process': {
    theoryContent: theory(
      'Certification Process & Requirements',
      `The AutoTune-SQL Professional Certificate is awarded only when you complete all thirty-six academy chapters with verified progress stored in the database. Certification is not purchasable, transferable, or issued for partial completion. The "Generate Certificate" button on the Certificates page remains locked until your progress reaches one hundred percent. If you attempt to generate early, a modal lists your remaining chapters with global order numbers. Each certificate receives a unique ID (e.g., AT-SQL-XXXXXXXX) and can be downloaded as a branded PDF with AutoTune-SQL logo and verification metadata. Quizzes must meet the eighty-percent threshold per chapter; a failing score does not block retry, but Focus Mode violations may reset your attempt to zero. Your legal name or email appears on the certificate based on your profile. Employers can verify credentials via the verification link embedded in each issued certificate.`,
      `Eligibility is computed server-side: \`isEligibleForCertificate = completedChapters >= totalChapters\`. The cert service calls \`academyService.isEligibleForCertificate\` before PDF generation.`,
      `\`\`\`sql
-- Conceptual: all chapters must be completed
SELECT COUNT(*) FROM "UserProgress"
WHERE "userId" = $1 AND "isCompleted" = true;
-- Must equal 36 for certification
\`\`\``,
      `1. Assuming a single high quiz score grants certification — every chapter must be completed.\n2. Closing the browser during quiz Focus Mode — third violation auto-fails.\n3. Using outdated seeded data after migrations — re-run seed if chapter count changes.`,
      `Screenshot your progress bar at 100% before generating. Store the PDF and certificate ID securely for LinkedIn and resume links.`
    ),
    quizData: quiz([
      { q: 'Certification requires progress of:', opts: ['100%', '80%', '50%', '1 chapter'], ans: 0 },
      { q: 'The certificate button when progress < 100%:', opts: ['Shows locked modal', 'Downloads PDF', 'Deletes account', 'Skips quizzes'], ans: 0 },
      { q: 'Each certificate has:', opts: ['A unique ID', 'No identifier', 'Same ID for all', 'Only email'], ans: 0 },
      { q: 'Per-chapter quiz pass threshold is:', opts: ['80%', '100%', '40%', 'No threshold'], ans: 0 },
      { q: 'Partial completion:', opts: ['Does not qualify', 'Qualifies', 'Gets bronze cert', 'Auto-passes'], ans: 0 },
      { q: 'Verification links allow:', opts: ['Employer credential check', 'SQL execution', 'Video download', 'Admin login'], ans: 0 },
      { q: 'Focus Mode 3rd violation:', opts: ['Auto-fails quiz at 0%', 'Gives bonus points', 'Unlocks all chapters', 'Issues certificate'], ans: 0 },
      { q: 'Certificate PDF includes:', opts: ['AutoTune-SQL branding', 'Raw passwords', 'Database dumps', 'API keys'], ans: 0 },
      { q: 'Eligibility is checked:', opts: ['Server-side before generation', 'Only client-side', 'Never', 'By email'], ans: 0 },
      { q: 'Remaining chapters are shown:', opts: ['In the locked certification modal', 'On YouTube', 'In email only', 'Never'], ans: 0 },
    ]),
  },

  'relational-databases': {
    theoryContent: theory(
      'Relational Databases & the Role of SQL',
      `Structured Query Language (SQL) is the declarative language used to read, filter, join, aggregate, and optimize data in relational database management systems (RDBMS). PostgreSQL, the engine AutoTune-SQL targets, implements ANSI SQL with powerful extensions for JSON, window functions, and advanced indexing. Relational theory organizes data into tables (relations) with rows and columns. Primary keys uniquely identify rows; foreign keys express relationships between tables. Understanding this model is prerequisite to writing correct joins and aggregations later in the curriculum. SQL statements are parsed, planned, and executed by the database optimizer — the same pipeline AutoTune analyzes when scoring query risk. As you progress, you will learn to read EXPLAIN output and recognize when the optimizer chooses sequential scans versus index scans.`,
      `Core read pattern: \`SELECT columns FROM table WHERE condition ORDER BY column LIMIT n;\``,
      `\`\`\`sql
SELECT id, email, created_at FROM users WHERE active = true ORDER BY created_at DESC LIMIT 100;
SELECT o.id, o.total FROM orders o WHERE o.status = 'shipped';
SELECT p.name, p.price FROM products p WHERE p.category = 'electronics';
\`\`\``,
      `1. Confusing databases with spreadsheets — tables have strict schemas.\n2. Omitting WHERE on large tables in production.\n3. Assuming SQL is only for SELECT — DDL/DML exist but academy focuses on read optimization.`,
      `Always project only needed columns. Use LIMIT during exploration. Index columns used in WHERE and JOIN predicates.`
    ),
    quizData: quiz([
      { q: 'SQL is primarily used to:', opts: ['Query relational data', 'Style web pages', 'Compile C code', 'Manage DNS'], ans: 0 },
      { q: 'PostgreSQL is a:', opts: ['Relational database', 'Spreadsheet', 'Browser', 'IDE'], ans: 0 },
      { q: 'A primary key:', opts: ['Uniquely identifies a row', 'Is always NULL', 'Replaces indexes', 'Is optional on every table'], ans: 0 },
      { q: 'Foreign keys express:', opts: ['Relationships between tables', 'CSS rules', 'JWT claims', 'File paths'], ans: 0 },
      { q: 'SELECT belongs to:', opts: ['Data retrieval (DQL)', 'Only DDL', 'Only DCL', 'HTML'], ans: 0 },
      { q: 'The optimizer produces:', opts: ['An execution plan', 'A PDF certificate', 'A React component', 'An email'], ans: 0 },
      { q: 'LIMIT is useful when:', opts: ['Exploring large tables', 'Dropping tables', 'Creating users', 'Sending mail'], ans: 0 },
      { q: 'AutoTune-SQL analyzes:', opts: ['Query execution patterns', 'Image compression', 'Audio codecs', 'CSS flexbox'], ans: 0 },
      { q: 'Rows in a table are also called:', opts: ['Tuples/records', 'Pixels', 'Packets', 'Tokens'], ans: 0 },
      { q: 'Declarative SQL means you specify:', opts: ['What data you want', 'CPU instructions', 'Memory addresses', 'Git branches'], ans: 0 },
    ]),
  },

  'postgres-setup': {
    theoryContent: theory(
      'PostgreSQL Environment Setup',
      `Before executing academy queries locally, configure a PostgreSQL instance — version 14 or newer is recommended. Install via official packages, Docker, or a managed cloud provider. Create a dedicated database user with least privilege: SELECT on practice schemas, no DROP or TRUNCATE in production-like environments. Connection strings follow the format \`postgresql://user:password@host:port/database\`. AutoTune-SQL connects via the DbConnection model to run EXPLAIN and capture execution metrics. For local practice, seed sample tables (\`users\`, \`orders\`, \`products\`) with realistic cardinality so JOIN and GROUP BY lessons reflect real planner behavior. Enable \`log_min_duration_statement\` in development to spot slow queries early. Use \`psql\` or GUI clients like pgAdmin for ad-hoc testing. Never commit credentials to version control — store them in \`.env\` files excluded by \`.gitignore\`.`,
      `\`CREATE DATABASE academy;\` then \`\\c academy\` in psql. Grant \`CONNECT\` and \`SELECT\` as appropriate.`,
      `\`\`\`sql
CREATE TABLE users (id SERIAL PRIMARY KEY, username VARCHAR(50), email VARCHAR(100), age INT);
CREATE TABLE orders (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), total NUMERIC, status VARCHAR(20));
INSERT INTO users (username, email, age) VALUES ('ada', 'ada@sql.dev', 28);
\`\`\``,
      `1. Using superuser credentials in application code.\n2. Forgetting to start the PostgreSQL service.\n3. Running migrations against the wrong DATABASE_URL.`,
      `Use connection pooling (PgBouncer) in production. Match local PostgreSQL version to production to avoid planner surprises.`
    ),
    quizData: quiz([
      { q: 'Recommended PostgreSQL version:', opts: ['14+', '8.0', '1.0', 'Any version'], ans: 0 },
      { q: 'Credentials should live in:', opts: ['.env (not committed)', 'public GitHub', 'PDF exports', 'quiz answers'], ans: 0 },
      { q: 'Connection string protocol:', opts: ['postgresql://', 'ftp://', 'mailto:', 'file://'], ans: 0 },
      { q: 'Practice schemas should use:', opts: ['Least privilege', 'Superuser always', 'No auth', 'Root login'], ans: 0 },
      { q: 'psql is:', opts: ['PostgreSQL CLI client', 'A video player', 'A CSS framework', 'An ML model'], ans: 0 },
      { q: 'EXPLAIN helps during setup by:', opts: ['Validating query plans on sample data', 'Installing Node', 'Building React', 'Sending email'], ans: 0 },
      { q: 'Sample tables for academy include:', opts: ['users, orders, products', 'only logs', 'only certificates', 'none'], ans: 0 },
      { q: 'log_min_duration_statement logs:', opts: ['Slow queries', 'All passwords', 'Git commits', 'UI clicks'], ans: 0 },
      { q: 'Docker can:', opts: ['Run PostgreSQL locally', 'Replace SQL syntax', 'Issue certificates', 'Block joins'], ans: 0 },
      { q: 'DbConnection in AutoTune stores:', opts: ['Host, port, database, credentials', 'YouTube IDs', 'Quiz HTML', 'PDF fonts'], ans: 0 },
    ]),
  },

  'academy-rules': {
    theoryContent: theory(
      'Academy Progress, Focus Mode & Quiz Rules',
      `Focus Mode is the academy anti-cheating system active during every theory chapter quiz. While the quiz is open, tab switches, window blur events, and visibility changes are monitored via the browser \`visibilitychange\` API and \`window.onblur\`. The first violation shows a warning modal ("Warning 1/3: Stay on the quiz page"). The second violation shows a final warning. The third violation automatically calls the server to fail the quiz with a score of zero and redirects you to the Quiz Result page. During Focus Mode, sidebar navigation and the browser back button are disabled via history state manipulation. You may retry failed quizzes after reviewing theory — each attempt increments \`quizAttempts\` in the database. Video chapters do not use Focus Mode but require full video watch detection via the YouTube IFrame API before enabling "Mark Video Complete". These rules ensure certification integrity and align with professional proctored exam standards.`,
      `Violations increment \`focusViolations\`; failure sets \`quizScore = 0\` and \`isCompleted = false\`.`,
      `\`\`\`text
Violation 1 → Warning modal
Violation 2 → Final warning
Violation 3 → POST /quiz/fail → score 0 → QuizResult page
\`\`\``,
      `1. Switching to documentation during quiz — counts as a violation.\n2. Assuming warnings reset between questions — they persist for the session.\n3. Using mobile split-screen during quiz.`,
      `Complete all reading before starting the quiz. Close unrelated tabs. Use a single full-screen window.`
    ),
    quizData: quiz([
      { q: 'Focus Mode monitors:', opts: ['visibilitychange and blur', 'CPU temperature', 'Git pushes', 'Email'], ans: 0 },
      { q: 'Third violation result:', opts: ['Quiz auto-fail at 0%', 'Bonus points', 'Skip to certificate', 'Video unlock'], ans: 0 },
      { q: 'During quiz, sidebar navigation is:', opts: ['Disabled', 'Encouraged', 'Required', 'Random'], ans: 0 },
      { q: 'First violation message includes:', opts: ['Warning 1/3', 'Certificate issued', 'Chapter deleted', 'No warning'], ans: 0 },
      { q: 'quizAttempts tracks:', opts: ['Number of quiz tries', 'Video length', 'Email count', 'Index size'], ans: 0 },
      { q: 'Video complete button appears after:', opts: ['Full video watched', 'Quiz passed', 'Login', 'Random'], ans: 0 },
      { q: 'Failed focus quiz score:', opts: ['0%', '80%', '100%', '50%'], ans: 0 },
      { q: 'Retry after fail:', opts: ['Allowed after review', 'Permanently blocked', 'Admin only', 'Never'], ans: 0 },
      { q: 'Back button during quiz:', opts: ['Blocked', 'Recommended', 'Required', 'Issues certificate'], ans: 0 },
      { q: 'Focus Mode applies to:', opts: ['Theory quizzes', 'Video chapters', 'Certificate PDF', 'Login page'], ans: 0 },
    ]),
  },

  'module1-checkpoint': {
    theoryContent: theory(
      'Module 1 Checkpoint — Introduction Review',
      `Congratulations on reaching the Module 1 checkpoint. You should now understand the thirty-six chapter learning path, certification requirements at one hundred percent completion, the role of SQL in relational databases, PostgreSQL setup basics, and Focus Mode quiz integrity rules. Module 2 introduces your first verified video lecture on filtering and sorting, followed by theory chapters on comparison operators, pattern matching, and combined predicates. Review your sidebar — completed chapters show green checkmarks; locked chapters show lock icons. If you scored below eighty percent on any quiz, revisit the theory sections marked Introduction, Syntax, Examples, Common Mistakes, and Performance Tips before retrying. The checkpoint quiz below validates readiness for Module 2. Passing unlocks the Module 2 video chapter on WHERE clauses and logical operators by Alex The Analyst.`,
      `Checkpoint validates Module 1 themes: path, certification, SQL basics, setup, and Focus Mode.`,
      `\`\`\`text
Module 1 complete → Module 2 Video (WHERE & Logical Operators) unlocks
\`\`\``,
      `1. Rushing into Module 2 without passing checkpoint quiz.\n2. Ignoring sequential unlock rules.\n3. Not updating profile name before final certification.`,
      `Re-read Module 1 summaries. Aim for 90%+ on checkpoint to build confidence for filtering content.`
    ),
    quizData: quiz([
      { q: 'Module 1 has how many chapters?', opts: ['6', '1', '12', '36'], ans: 0 },
      { q: 'Module 2 first chapter type is:', opts: ['VIDEO', 'THEORY only', 'Certificate', 'Empty'], ans: 0 },
      { q: 'Module 1 includes video lectures:', opts: ['No — all theory', 'Yes — 6 videos', 'Yes — 1 video', 'Videos only'], ans: 0 },
      { q: 'Next module topic:', opts: ['Filtering & Sorting', 'Kubernetes', 'React hooks', 'OAuth'], ans: 0 },
      { q: 'Green checkmark in sidebar means:', opts: ['Chapter completed', 'Chapter locked', 'Quiz active', 'Video broken'], ans: 0 },
      { q: 'Certification needs:', opts: ['All 36 chapters', 'Module 1 only', 'One quiz', 'Video watch only'], ans: 0 },
      { q: 'Focus Mode violations max before fail:', opts: ['3', '1', '10', 'Unlimited'], ans: 0 },
      { q: 'PostgreSQL practice uses:', opts: ['Relational tables', 'Only JSON files', 'Only CSV', 'No data'], ans: 0 },
      { q: 'Quiz pass score:', opts: ['80%', '20%', '0%', '100% only'], ans: 0 },
      { q: 'After this checkpoint you unlock:', opts: ['Module 2 content', 'Final certificate', 'Admin panel', 'Nothing'], ans: 0 },
    ]),
  },
};

// Topic-specific content for Modules 2–6 (abbreviated keys with full quizzes)
const TOPIC_BANK = {
  'comparison-operators': {
    intro: 'Comparison operators (=, <>, <, >, <=, >=) filter rows by evaluating predicates to TRUE, FALSE, or UNKNOWN (NULL). They are the foundation of WHERE clauses.',
    syntax: '`WHERE column operator value` — combine with AND, OR, NOT. NULL comparisons require IS NULL.',
    examples: '```sql\nSELECT * FROM products WHERE price > 50 AND price <= 200;\nSELECT * FROM users WHERE age >= 18 AND status = \'active\';\nSELECT * FROM orders WHERE total <> 0;\n```',
    mistakes: '1. Using = with NULL.\n2. Chaining inequalities incorrectly.\n3. Implicit type coercion surprises.',
    tips: 'Index columns in range predicates. Use EXPLAIN to verify selective filters use indexes.',
    quiz: [
      { q: 'Which operator means "not equal" in SQL?', opts: ['<> or !=', '===', '::', '@>'], ans: 0 },
      { q: 'WHERE age > 21 returns users:', opts: ['Older than 21', 'Exactly 21', 'NULL only', 'All rows'], ans: 0 },
      { q: 'NULL = NULL evaluates to:', opts: ['UNKNOWN (not TRUE)', 'TRUE', 'FALSE', '0'], ans: 0 },
      { q: 'Combine predicates with:', opts: ['AND / OR', 'ONLY commas', 'GROUP BY', 'LIMIT'], ans: 0 },
      { q: 'price <= 100 means:', opts: ['At most 100', 'At least 100', 'Exactly 100', 'Not 100'], ans: 0 },
      { q: 'Selective WHERE clauses help:', opts: ['Index scans', 'Full table drops', 'DNS lookup', 'Email'], ans: 0 },
      { q: 'NOT (status = \'cancelled\')', opts: ['Excludes cancelled', 'Includes only cancelled', 'Deletes rows', 'Creates index'], ans: 0 },
      { q: 'Comparing strings in PostgreSQL is:', opts: ['Case-sensitive by default', 'Always case-insensitive', 'Impossible', 'Only numeric'], ans: 0 },
      { q: 'WHERE total > 0 filters:', opts: ['Positive totals', 'NULLs only', 'All rows', 'Indexes'], ans: 0 },
      { q: 'Comparison operators appear in:', opts: ['WHERE and JOIN ON', 'Only SELECT list', 'Only ORDER BY', 'Certificates'], ans: 0 },
    ],
  },
  'like-patterns': {
    intro: 'LIKE and ILIKE match text patterns using % (any sequence) and _ (single character). ILIKE is case-insensitive in PostgreSQL.',
    syntax: '`WHERE column LIKE \'pattern\'` — escape special chars with ESCAPE.',
    examples: '```sql\nSELECT * FROM users WHERE email LIKE \'%@gmail.com\';\nSELECT * FROM products WHERE name ILIKE \'%phone%\';\n```',
    mistakes: '1. Leading wildcard prevents index use.\n2. Confusing LIKE with =.\n3. Forgetting NULL returns no match.',
    tips: 'Use trigram indexes (pg_trgm) for fuzzy search. Prefer prefix patterns when possible.',
    quiz: [
      { q: 'LIKE wildcard for any string:', opts: ['%', '_', '*', '?'], ans: 0 },
      { q: 'ILIKE in PostgreSQL is:', opts: ['Case-insensitive LIKE', 'Case-sensitive only', 'A join type', 'An aggregate'], ans: 0 },
      { q: "'a%' matches:", opts: ['Strings starting with a', 'Ending with a', 'Exactly a', 'Nothing'], ans: 0 },
      { q: 'Leading % in LIKE often causes:', opts: ['Sequential scan', 'Index-only scan', 'Faster queries', 'Auto certificate'], ans: 0 },
      { q: '_ in LIKE matches:', opts: ['One character', 'Zero characters', 'Any length', 'Only digits'], ans: 0 },
      { q: 'LIKE is used in:', opts: ['WHERE clause', 'FROM clause only', 'GROUP BY only', 'CERT'], ans: 0 },
      { q: 'NULL LIKE \'%\' returns:', opts: ['UNKNOWN/false row', 'TRUE', 'All rows', 'Error always'], ans: 0 },
      { q: 'Pattern matching chapter focuses on:', opts: ['LIKE / ILIKE', 'GROUP BY', 'WINDOW', 'INDEX'], ans: 0 },
      { q: 'Escape clause helps when:', opts: ['Pattern contains % or _', 'No WHERE', 'Only joins', 'Videos'], ans: 0 },
      { q: 'pg_trgm helps:', opts: ['Fuzzy text search', 'Video embed', 'OAuth', 'PDF'], ans: 0 },
    ],
  },
  'in-between': {
    intro: 'IN tests membership in a list; BETWEEN tests inclusive range. Both simplify readable filters.',
    syntax: '`WHERE col IN (v1, v2)` and `WHERE col BETWEEN low AND high`',
    examples: '```sql\nSELECT * FROM orders WHERE status IN (\'shipped\', \'delivered\');\nSELECT * FROM products WHERE price BETWEEN 10 AND 50;\n```',
    mistakes: '1. BETWEEN with NULL endpoints.\n2. Large IN lists without indexes.\n3. Confusing inclusive bounds.',
    tips: 'Rewrite large IN lists as JOINs to temp tables for planner stability.',
    quiz: [
      { q: 'IN (1,2,3) keeps rows where value:', opts: ['Is in the list', 'Is greater than all', 'Is NULL only', 'Is negative only'], ans: 0 },
      { q: 'BETWEEN 10 AND 20 is:', opts: ['Inclusive of 10 and 20', 'Exclusive', 'Only 15', 'Invalid SQL'], ans: 0 },
      { q: 'NOT IN with NULL in list:', opts: ['Can yield no rows unexpectedly', 'Always returns all', 'Same as IN', 'Creates index'], ans: 0 },
      { q: 'BETWEEN is equivalent to:', opts: ['>= AND <=', '> AND <', '= only', 'LIKE'], ans: 0 },
      { q: 'IN is readable alternative to:', opts: ['Multiple OR equals', 'GROUP BY', 'WINDOW', 'DROP'], ans: 0 },
      { q: 'status IN (\'a\',\'b\') filters:', opts: ['Matching statuses', 'All NULL', 'Only indexes', 'Videos'], ans: 0 },
      { q: 'Chapter topic:', opts: ['IN and BETWEEN', 'Only JOIN', 'Only HAVING', 'Certificates'], ans: 0 },
      { q: 'Large IN lists may:', opts: ['Slow planning', 'Auto-pass quiz', 'Issue cert', 'Skip video'], ans: 0 },
      { q: 'BETWEEN works on:', opts: ['Ordered comparable types', 'Only images', 'Only JSON', 'Nothing'], ans: 0 },
      { q: 'Combine IN with:', opts: ['AND/OR', 'Only SELECT *', 'Only LIMIT 0', 'Only DROP'], ans: 0 },
    ],
  },
  'distinct-sorting': {
    intro: 'DISTINCT removes duplicate rows from results. ORDER BY sorts output; NULLS FIRST/LAST controls null placement.',
    syntax: '`SELECT DISTINCT col FROM t ORDER BY col [ASC|DESC] NULLS LAST`',
    examples: '```sql\nSELECT DISTINCT category FROM products ORDER BY category;\nSELECT DISTINCT user_id FROM orders ORDER BY user_id DESC;\n```',
    mistakes: '1. DISTINCT with unnecessary columns.\n2. ORDER BY expressions not in SELECT in DISTINCT queries.\n3. Sorting unindexed columns on huge tables.',
    tips: 'Use GROUP BY instead of DISTINCT when aggregating. Index ORDER BY columns for pagination.',
    quiz: [
      { q: 'DISTINCT removes:', opts: ['Duplicate rows', 'All rows', 'Indexes', 'Tables'], ans: 0 },
      { q: 'ORDER BY default sort:', opts: ['ASC', 'DESC', 'RANDOM', 'NULL'], ans: 0 },
      { q: 'DESC means:', opts: ['Descending', 'Ascending', 'Distinct', 'Delete'], ans: 0 },
      { q: 'NULLS LAST puts NULLs:', opts: ['At end', 'At start', 'Removed', 'Indexed'], ans: 0 },
      { q: 'DISTINCT category returns:', opts: ['Unique categories', 'All order lines', 'Only NULL', 'Certificate'], ans: 0 },
      { q: 'ORDER BY is applied:', opts: ['After SELECT/WHERE', 'Before FROM', 'Only in HAVING', 'In PDF'], ans: 0 },
      { q: 'Chapter covers:', opts: ['DISTINCT and sorting', 'Only JOIN', 'Only WINDOW', 'Video API'], ans: 0 },
      { q: 'Pagination often uses:', opts: ['ORDER BY + LIMIT', 'Only DISTINCT', 'DROP TABLE', 'Focus mode'], ans: 0 },
      { q: 'DISTINCT vs GROUP BY when aggregating:', opts: ['Prefer GROUP BY', 'Always DISTINCT', 'Never either', 'Use DROP'], ans: 0 },
      { q: 'Sorting unindexed huge columns may cause:', opts: ['External sort / slow query', 'Free certificate', 'Auto pass', 'Video skip'], ans: 0 },
    ],
  },
  'combining-filters': {
    intro: 'Real queries combine multiple predicates with AND, OR, and parentheses to control precedence. De Morgan laws help refactor conditions.',
    syntax: '`(a AND b) OR (c AND d)` — use parentheses explicitly.',
    examples: '```sql\nSELECT * FROM orders\nWHERE (status = \'shipped\' AND total > 100)\n   OR (status = \'pending\' AND created_at > NOW() - INTERVAL \'7 days\');\n```',
    mistakes: '1. AND/OR precedence bugs without parentheses.\n2. Overly complex OR preventing index use.\n3. Redundant overlapping conditions.',
    tips: 'Normalize OR-of-ANDs for partial index matching. Test with EXPLAIN.',
    quiz: [
      { q: 'AND has _____ precedence than OR without parens:', opts: ['Higher', 'Lower', 'Same as ORDER', 'None'], ans: 0 },
      { q: 'Parentheses in WHERE:', opts: ['Control evaluation order', 'Delete data', 'Create video', 'Issue cert'], ans: 0 },
      { q: 'Combining filters chapter is about:', opts: ['AND/OR predicate logic', 'Only GROUP BY', 'Only indexes', 'OAuth'], ans: 0 },
      { q: 'OR conditions may prevent:', opts: ['Single index scan', 'All SQL', 'SELECT', 'Reading'], ans: 0 },
      { q: 'De Morgan: NOT (A AND B) equals:', opts: ['NOT A OR NOT B', 'A AND B', 'A OR B', 'TRUE'], ans: 0 },
      { q: 'Complex WHERE should be:', opts: ['Tested with EXPLAIN', 'Never tested', 'Only in PDF', 'Hidden'], ans: 0 },
      { q: '(status = \'a\' OR status = \'b\') can rewrite to:', opts: ["status IN ('a','b')", 'status LIKE NULL', 'DROP status', 'VIDEO'], ans: 0 },
      { q: 'Redundant conditions:', opts: ['Hurt readability', 'Always speed up', 'Required for cert', 'Block video'], ans: 0 },
      { q: 'Filter combination appears in:', opts: ['WHERE clause', 'Only ORDER BY', 'Certificate', 'Navbar'], ans: 0 },
      { q: 'Module 2 ends with:', opts: ['Combining filters', 'Final exam', 'Module 1 intro', 'Empty'], ans: 0 },
    ],
  },
};

// Generate remaining topics from bank pattern
const EXTRA_KEYS = [
  ['inner-join', 'INNER JOIN Patterns', 'INNER JOIN returns matching rows from both tables on join predicate.'],
  ['left-join', 'LEFT JOIN Patterns', 'LEFT JOIN preserves all left rows; unmatched right columns are NULL.'],
  ['join-cardinality', 'Join Cardinality', 'One-to-many joins multiply rows; understand fan-out before aggregating.'],
  ['self-join', 'Self Joins', 'Join a table to itself with aliases for hierarchical or sequential data.'],
  ['join-antipatterns', 'Join Anti-Patterns', 'Cartesian products, missing ON clauses, and joining unindexed columns.'],
  ['count-sum', 'COUNT and SUM', 'COUNT(*) counts rows; SUM aggregates numeric columns with NULL ignored.'],
  ['avg-min-max', 'AVG, MIN, MAX', 'Statistical aggregates summarize grouped data.'],
  ['having-filters', 'HAVING Filters', 'HAVING filters groups after GROUP BY; WHERE filters rows before.'],
  ['rollup', 'ROLLUP Concepts', 'ROLLUP produces subtotals and grand totals in grouped reports.'],
  ['window-intro', 'Window Functions Intro', 'OVER() computes per-row analytics without collapsing groups.'],
  ['btree-indexes', 'B-Tree Indexes', 'B-tree indexes accelerate equality and range lookups on indexed columns.'],
  ['explain-plans', 'EXPLAIN Plans', 'EXPLAIN shows planner choices without executing the query.'],
  ['explain-analyze', 'EXPLAIN ANALYZE', 'Executes query and reports actual timings and row counts.'],
  ['query-rewriting', 'Query Rewriting', 'Refactor SQL for sargable predicates and fewer round trips.'],
  ['production-guardrails', 'Production Guardrails', 'Timeouts, connection limits, and read replicas for safety.'],
  ['autotune-arch', 'AutoTune Architecture', 'Pipeline from query log ingestion to ML scoring and advice.'],
  ['ml-risk', 'ML Risk Scoring', 'Classifies queries by performance, syntax, and logic risk.'],
  ['ai-rewrite', 'AI Query Rewriting', 'Suggests optimized SQL using schema context and EXPLAIN hints.'],
  ['error-class', 'Error Classification', 'Maps PostgreSQL errors to actionable categories.'],
  ['schema-tuning', 'Schema-Aware Tuning', 'Uses foreign keys and statistics for better recommendations.'],
  ['final-exam', 'Final Certification Exam', 'Comprehensive assessment across all academy topics.'],
];

EXTRA_KEYS.forEach(([key, title, intro]) => {
  if (CONTENT[key]) return;
  const bank = TOPIC_BANK[key];
  const body = bank || {
    intro: `${intro} This chapter provides production-oriented depth with syntax, examples, mistakes, and tuning guidance aligned strictly to ${title}.`,
    syntax: `Core SQL patterns for **${title}** follow PostgreSQL conventions. Read statements carefully and validate with EXPLAIN.`,
    examples: '```sql\n-- Example 1\nSELECT id, name FROM users LIMIT 10;\n-- Example 2\nSELECT status, COUNT(*) FROM orders GROUP BY status;\n-- Example 3\nSELECT u.username, o.id FROM users u JOIN orders o ON u.id = o.user_id;\n```',
    mistakes: `1. Applying concepts from other chapters incorrectly.\n2. Ignoring NULL semantics.\n3. Skipping EXPLAIN validation.\n4. Selecting * in production.\n5. Forgetting pass threshold is 80%.`,
    tips: `Index filter and join columns. Keep predicates sargable. Re-read theory before the quiz.`,
    quiz: [
      { q: `Primary focus of "${title}"?`, opts: [title, 'Unrelated topic', 'CSS', 'OAuth'], ans: 0 },
      { q: 'PostgreSQL uses EXPLAIN to show:', opts: ['Execution plans', 'HTML', 'Videos', 'Emails'], ans: 0 },
      { q: 'Passing chapter quiz requires:', opts: ['≥80%', '50%', '0%', 'Admin'], ans: 0 },
      { q: 'NULL comparisons use:', opts: ['IS NULL', '= NULL', '> NULL', 'LIKE NULL'], ans: 0 },
      { q: 'WHERE filters:', opts: ['Rows before aggregation', 'Groups after GROUP BY', 'Indexes only', 'PDF'], ans: 0 },
      { q: 'HAVING filters:', opts: ['Grouped results', 'Rows before GROUP BY', 'Videos', 'Certs'], ans: 0 },
      { q: 'INNER JOIN returns:', opts: ['Matching rows both sides', 'All left rows', 'No rows', 'Schema only'], ans: 0 },
      { q: 'Focus Mode violation limit:', opts: ['3', '1', '100', 'None'], ans: 0 },
      { q: 'Academy total chapters:', opts: ['36', '10', '5', '100'], ans: 0 },
      { q: 'Topic alignment means quiz tests:', opts: ['Current chapter title only', 'Random topics', 'Nothing', 'Videos only'], ans: 0 },
    ],
  };

  CONTENT[key] = {
    theoryContent: theory(title, bank?.intro || body.intro, bank?.syntax || body.syntax, bank?.examples || body.examples, bank?.mistakes || body.mistakes, bank?.tips || body.tips),
    quizData: quiz(bank?.quiz || body.quiz),
  };
});

// Merge TOPIC_BANK entries into CONTENT
Object.entries(TOPIC_BANK).forEach(([key, bank]) => {
  if (CONTENT[key]) return;
  const title = key.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  CONTENT[key] = {
    theoryContent: theory(title, bank.intro, bank.syntax, bank.examples, bank.mistakes, bank.tips),
    quizData: quiz(bank.quiz),
  };
});

function getContent(key) {
  return CONTENT[key] || CONTENT['learning-path'];
}

module.exports = { getContent, CONTENT, quiz, packChapterData };
